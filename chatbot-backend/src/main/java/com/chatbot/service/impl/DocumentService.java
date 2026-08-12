package com.chatbot.service.impl;

import com.chatbot.dto.request.ChatRequest;
import com.chatbot.dto.response.ChatResponse;
import com.chatbot.entity.*;
import com.chatbot.exception.BadRequestException;
import com.chatbot.exception.ResourceNotFoundException;
import com.chatbot.repository.*;
import com.chatbot.service.*;
import com.chatbot.service.PdfProcessingService.PdfExtractionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private static final int TOP_K_CHUNKS = 5;

    private final DocumentRepository documentRepo;
    private final UserRepository userRepo;
    private final MessageRepository messageRepo;
    private final ConversationRepository conversationRepo;
    private final PdfProcessingService pdfService;
    private final CloudinaryService cloudinaryService;
    private final GeminiService geminiService;
    private final ChromaDbService chromaDbService;

    // ─── Upload ──────────────────────────────────────────────────────────────────

    @Transactional
    public ChatResponse.DocumentResponse uploadDocument(String email,
                                                         MultipartFile file,
                                                         Document.DocumentType type) {
        validateFile(file);
        User user = getUser(email);

        // Upload raw file to Cloudinary
        CloudinaryService.UploadResult upload;
        try {
            upload = cloudinaryService.uploadFile(file, "documents/" + email);
        } catch (Exception e) {
            throw new BadRequestException("File upload failed: " + e.getMessage());
        }

        Document document = Document.builder()
                .user(user)
                .fileName(upload.getPublicId())
                .originalName(file.getOriginalFilename())
                .cloudinaryUrl(upload.getSecureUrl())
                .cloudinaryPublicId(upload.getPublicId())
                .fileSize(upload.getBytes())
                .status(Document.DocumentStatus.PENDING)
                .documentType(type)
                .build();

        document = documentRepo.save(document);

        // Async processing
        processDocumentAsync(document.getId(), file);

        return ChatResponse.DocumentResponse.from(document);
    }

    @Async
    public void processDocumentAsync(Long documentId, MultipartFile file) {
        Document document = documentRepo.findById(documentId).orElse(null);
        if (document == null) return;

        try {
            document.setStatus(Document.DocumentStatus.PROCESSING);
            documentRepo.save(document);

            // Extract text
            PdfExtractionResult result = pdfService.extractText(file);
            document.setPageCount(result.getPageCount());
            document.setIsScanned(result.isScanned());

            if (result.getChunks().isEmpty()) {
                throw new RuntimeException("No text extracted from document");
            }

            // Create ChromaDB collection
            String collectionName = "doc_" + documentId + "_" + System.currentTimeMillis();
            String collectionId = chromaDbService.createCollection(collectionName);
            document.setChromaCollectionId(collectionId);
            document.setTotalChunks(result.getChunks().size());

            // Generate embeddings for each chunk
            List<List<Double>> embeddings = result.getChunks().stream()
                    .map(geminiService::generateEmbedding)
                    .collect(Collectors.toList());

            // Store in ChromaDB
            chromaDbService.addEmbeddings(collectionId, result.getChunks(),
                    embeddings, documentId.toString());

            document.setStatus(Document.DocumentStatus.READY);
            documentRepo.save(document);
            log.info("Document {} processed successfully", documentId);

        } catch (Exception e) {
            log.error("Document {} processing failed: {}", documentId, e.getMessage(), e);
            document.setStatus(Document.DocumentStatus.FAILED);
            document.setErrorMessage(e.getMessage());
            documentRepo.save(document);
        }
    }

    // ─── RAG Question Answering ──────────────────────────────────────────────────

    @Transactional
    public ChatResponse.AiReplyResponse askQuestion(String email, ChatRequest.DocumentQuestion request) {
        User user = getUser(email);
        Document document = documentRepo.findByIdAndUser(request.getDocumentId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        if (document.getStatus() != Document.DocumentStatus.READY) {
            throw new BadRequestException("Document is not ready. Status: " + document.getStatus());
        }

        // Get or create conversation
        Conversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepo.findByIdAndUser(request.getConversationId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        } else {
            conversation = conversationRepo.save(Conversation.builder()
                    .user(user)
                    .title("Document: " + document.getOriginalName())
                    .type(Conversation.ConversationType.DOCUMENT_QA)
                    .documentId(document.getId())
                    .build());
        }

        // Embed the question
        List<Double> questionEmbedding = geminiService.generateEmbedding(request.getQuestion());

        // Retrieve relevant chunks
        List<String> relevantChunks = chromaDbService.querySimilarChunks(
                document.getChromaCollectionId(), questionEmbedding, TOP_K_CHUNKS);

        // Build chat history
        List<Message> history = messageRepo.findByConversationOrderByTimestampAsc(conversation);
        List<Map<String, String>> chatHistory = history.stream()
                .map(m -> Map.of(
                        "role", m.getSender() == Message.Sender.USER ? "user" : "model",
                        "text", m.getMessage()))
                .collect(Collectors.toList());

        // Generate answer with RAG
        String answer = geminiService.answerWithContext(
                request.getQuestion(), relevantChunks, chatHistory, request.getLanguageCode());

        // Save messages
        Message userMsg = saveMessage(conversation, Message.Sender.USER,
                request.getQuestion(), Message.MessageType.TEXT, request.getLanguageCode());
        Message aiMsg = saveMessage(conversation, Message.Sender.AI,
                answer, Message.MessageType.TEXT, request.getLanguageCode());

        return ChatResponse.AiReplyResponse.builder()
                .conversationId(conversation.getId())
                .userMessage(ChatResponse.MessageResponse.from(userMsg))
                .aiMessage(ChatResponse.MessageResponse.from(aiMsg))
                .sourcedChunks(relevantChunks)
                .build();
    }

    // ─── List & Delete ───────────────────────────────────────────────────────────

    public List<ChatResponse.DocumentResponse> getUserDocuments(String email) {
        User user = getUser(email);
        return documentRepo.findByUserOrderByUploadTimeDesc(user)
                .stream()
                .map(ChatResponse.DocumentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDocument(String email, Long documentId) {
        User user = getUser(email);
        Document document = documentRepo.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        // Cleanup Cloudinary
        if (document.getCloudinaryPublicId() != null) {
            cloudinaryService.deleteFile(document.getCloudinaryPublicId());
        }

        // Cleanup ChromaDB
        if (document.getChromaCollectionId() != null) {
            chromaDbService.deleteCollection(document.getChromaCollectionId());
        }

        documentRepo.delete(document);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("File is empty");
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Only PDF files are supported");
        }
        if (file.getSize() > 20 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds 20MB limit");
        }
    }

    private Message saveMessage(Conversation conv, Message.Sender sender,
                                 String text, Message.MessageType type, String lang) {
        return messageRepo.save(Message.builder()
                .conversation(conv)
                .sender(sender)
                .message(text)
                .messageType(type)
                .languageCode(lang != null ? lang : "en")
                .build());
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
