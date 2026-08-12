package com.chatbot.service.impl;

import com.chatbot.dto.request.ChatRequest;
import com.chatbot.dto.response.ChatResponse;
import com.chatbot.entity.*;
import com.chatbot.exception.BadRequestException;
import com.chatbot.exception.ResourceNotFoundException;
import com.chatbot.repository.*;
import com.chatbot.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private static final int CONTEXT_WINDOW = 10; // last N message pairs for memory

    private final ConversationRepository conversationRepo;
    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final GeminiService geminiService;

    // ─── Conversations ───────────────────────────────────────────────────────────

    @Transactional
    public ChatResponse.ConversationResponse createConversation(String email,
                                                                  ChatRequest.CreateConversation request) {
        User user = getUser(email);

        Conversation conversation = Conversation.builder()
                .user(user)
                .title(request.getTitle() != null ? request.getTitle() : "New Conversation")
                .type(request.getType() != null ? request.getType() : Conversation.ConversationType.GENERAL)
                .documentId(request.getDocumentId())
                .build();

        return ChatResponse.ConversationResponse.from(conversationRepo.save(conversation));
    }

    public List<ChatResponse.ConversationResponse> getUserConversations(String email) {
        User user = getUser(email);
        return conversationRepo.findByUserAndIsArchivedFalseOrderByUpdatedAtDesc(user)
                .stream()
                .map(ChatResponse.ConversationResponse::from)
                .collect(Collectors.toList());
    }

    public ChatResponse.ConversationResponse getConversationWithMessages(String email, Long conversationId) {
        User user = getUser(email);
        Conversation conversation = conversationRepo.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        List<Message> messages = messageRepo.findByConversationOrderByTimestampAsc(conversation);
        ChatResponse.ConversationResponse response = ChatResponse.ConversationResponse.from(conversation);
        response.setMessages(messages.stream()
                .map(ChatResponse.MessageResponse::from)
                .collect(Collectors.toList()));
        return response;
    }

    @Transactional
    public void archiveConversation(String email, Long conversationId) {
        User user = getUser(email);
        Conversation conversation = conversationRepo.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        conversation.setIsArchived(true);
        conversationRepo.save(conversation);
    }

    @Transactional
    public void deleteConversation(String email, Long conversationId) {
        User user = getUser(email);
        Conversation conversation = conversationRepo.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        messageRepo.deleteByConversation(conversation);
        conversationRepo.delete(conversation);
    }

    // ─── Send Message (with memory) ──────────────────────────────────────────────

    @Transactional
    public ChatResponse.AiReplyResponse sendMessage(String email, ChatRequest.SendMessage request) {
        User user = getUser(email);

        // Get or create conversation
        Conversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepo.findByIdAndUser(request.getConversationId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        } else {
            conversation = Conversation.builder()
                    .user(user)
                    .title(truncate(request.getMessage(), 50))
                    .type(Conversation.ConversationType.GENERAL)
                    .build();
            conversation = conversationRepo.save(conversation);
        }

        // Save user message
        Message userMsg = saveMessage(conversation, Message.Sender.USER,
                request.getMessage(), request.getMessageType(), request.getLanguageCode());

        // Build conversation history for context memory
        List<Map<String, String>> history = buildContextHistory(conversation);

        // Generate AI response
        String aiText = geminiService.chat(request.getMessage(), history);

        // Detect language if not specified
        String langCode = request.getLanguageCode() != null ? request.getLanguageCode() : "en";

        // Save AI message
        Message aiMsg = saveMessage(conversation, Message.Sender.AI,
                aiText, Message.MessageType.TEXT, langCode);

        // Update conversation title if it's the first exchange
        if (messageRepo.countByConversation(conversation) <= 2) {
            conversation.setTitle(truncate(request.getMessage(), 50));
            conversationRepo.save(conversation);
        }

        return ChatResponse.AiReplyResponse.builder()
                .conversationId(conversation.getId())
                .userMessage(ChatResponse.MessageResponse.from(userMsg))
                .aiMessage(ChatResponse.MessageResponse.from(aiMsg))
                .build();
    }

    // ─── Context Memory Builder ──────────────────────────────────────────────────

    private List<Map<String, String>> buildContextHistory(Conversation conversation) {
        List<Message> recent = messageRepo.findLastNMessages(
                conversation, PageRequest.of(0, CONTEXT_WINDOW * 2));

        // Reverse to get chronological order
        Collections.reverse(recent);

        return recent.stream()
                .map(msg -> Map.of(
                        "role", msg.getSender() == Message.Sender.USER ? "user" : "model",
                        "text", msg.getMessage()
                ))
                .collect(Collectors.toList());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private Message saveMessage(Conversation conv, Message.Sender sender,
                                 String text, Message.MessageType type, String lang) {
        Message msg = Message.builder()
                .conversation(conv)
                .sender(sender)
                .message(text)
                .messageType(type)
                .languageCode(lang != null ? lang : "en")
                .build();
        return messageRepo.save(msg);
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "New Chat";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }
}
