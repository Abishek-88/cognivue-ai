package com.chatbot.service.impl;

import com.chatbot.dto.request.ChatRequest;
import com.chatbot.entity.Message;
import com.chatbot.entity.Conversation;
import com.chatbot.entity.Document;
import com.chatbot.repository.MessageRepository;
import com.chatbot.service.ChromaDbService;
import com.chatbot.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentRAGService {

    private final ChromaDbService chromaDbService;
    private final GeminiService geminiService;
    private final MessageRepository messageRepository;

    public String generateAnswer(Document document, Conversation conversation, ChatRequest.DocumentQuestion request, List<Double> questionEmbedding) {
        // Retrieve relevant chunks from ChromaDB
        List<String> relevantChunks = chromaDbService.querySimilarChunks(
                document.getChromaCollectionId(),
                questionEmbedding,
                5); // TOP_K_CHUNKS = 5

        // Build chat history from the conversation
        List<Message> history = messageRepository.findByConversationOrderByTimestampAsc(conversation);
        List<Map<String, String>> chatHistory = history.stream()
                .map(m -> Map.of(
                        "role", m.getSender() == Message.Sender.USER ? "user" : "model",
                        "text", m.getMessage()))
                .collect(Collectors.toList());

        // Generate answer using Gemini
        return geminiService.answerWithContext(
                request.getQuestion(),
                relevantChunks,
                chatHistory,
                request.getLanguageCode());
    }
}