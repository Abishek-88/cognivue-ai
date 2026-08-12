package com.chatbot.dto.request;

import com.chatbot.entity.Conversation;
import com.chatbot.entity.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class ChatRequest {

    @Data
    public static class SendMessage {
        @NotBlank(message = "Message cannot be empty")
        @Size(max = 10000, message = "Message too long")
        private String message;

        private Long conversationId;

        private Message.MessageType messageType = Message.MessageType.TEXT;

        private String languageCode = "en";
    }

    @Data
    public static class CreateConversation {
        @Size(max = 200)
        private String title;

        private Conversation.ConversationType type = Conversation.ConversationType.GENERAL;

        private Long documentId;
    }

    @Data
    public static class DocumentQuestion {
        @NotBlank(message = "Question cannot be empty")
        private String question;

        private Long documentId;

        private Long conversationId;

        private String languageCode = "en";
    }
}
