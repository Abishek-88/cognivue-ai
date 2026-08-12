package com.chatbot.controller;

import com.chatbot.dto.request.ChatRequest;
import com.chatbot.dto.response.ApiResponse;
import com.chatbot.dto.response.ChatResponse;
import com.chatbot.service.impl.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ─── Send Message ────────────────────────────────────────────────────────────

    @PostMapping("/message")
    public ResponseEntity<ApiResponse<ChatResponse.AiReplyResponse>> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChatRequest.SendMessage request) {
        ChatResponse.AiReplyResponse response =
                chatService.sendMessage(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── Conversations ───────────────────────────────────────────────────────────

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ChatResponse.ConversationResponse>> createConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChatRequest.CreateConversation request) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.createConversation(userDetails.getUsername(), request)));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ChatResponse.ConversationResponse>>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getUserConversations(userDetails.getUsername())));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<ChatResponse.ConversationResponse>> getConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getConversationWithMessages(userDetails.getUsername(), id)));
    }

    @PatchMapping("/conversations/{id}/archive")
    public ResponseEntity<ApiResponse<Void>> archiveConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        chatService.archiveConversation(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Conversation archived", null));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        chatService.deleteConversation(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted", null));
    }
}
