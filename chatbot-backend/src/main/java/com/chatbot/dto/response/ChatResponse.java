package com.chatbot.dto.response;

import com.chatbot.entity.Conversation;
import com.chatbot.entity.Document;
import com.chatbot.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class ChatResponse {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MessageResponse {
        private Long id;
        private String sender;
        private String message;
        private String messageType;
        private String languageCode;
        private LocalDateTime timestamp;

        public static MessageResponse from(Message msg) {
            return MessageResponse.builder()
                    .id(msg.getId())
                    .sender(msg.getSender().name())
                    .message(msg.getMessage())
                    .messageType(msg.getMessageType().name())
                    .languageCode(msg.getLanguageCode())
                    .timestamp(msg.getTimestamp())
                    .build();
        }
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ConversationResponse {
        private Long id;
        private String title;
        private String type;
        private Long documentId;
        private boolean isArchived;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<MessageResponse> messages;

        public static ConversationResponse from(Conversation conv) {
            return ConversationResponse.builder()
                    .id(conv.getId())
                    .title(conv.getTitle())
                    .type(conv.getType().name())
                    .documentId(conv.getDocumentId())
                    .isArchived(conv.getIsArchived())
                    .createdAt(conv.getCreatedAt())
                    .updatedAt(conv.getUpdatedAt())
                    .build();
        }
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AiReplyResponse {
        private Long conversationId;
        private MessageResponse userMessage;
        private MessageResponse aiMessage;
        private List<String> sourcedChunks;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DocumentResponse {
        private Long id;
        private String fileName;
        private String originalName;
        private String cloudinaryUrl;
        private Long fileSize;
        private Integer pageCount;
        private String status;
        private String documentType;
        private boolean isScanned;
        private LocalDateTime uploadTime;

        public static DocumentResponse from(Document doc) {
            return DocumentResponse.builder()
                    .id(doc.getId())
                    .fileName(doc.getFileName())
                    .originalName(doc.getOriginalName())
                    .cloudinaryUrl(doc.getCloudinaryUrl())
                    .fileSize(doc.getFileSize())
                    .pageCount(doc.getPageCount())
                    .status(doc.getStatus().name())
                    .documentType(doc.getDocumentType().name())
                    .isScanned(doc.getIsScanned())
                    .uploadTime(doc.getUploadTime())
                    .build();
        }
    }
}
