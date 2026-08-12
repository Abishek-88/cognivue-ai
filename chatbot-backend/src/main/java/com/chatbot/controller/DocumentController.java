package com.chatbot.controller;

import com.chatbot.dto.request.ChatRequest;
import com.chatbot.dto.response.ApiResponse;
import com.chatbot.dto.response.ChatResponse;
import com.chatbot.entity.Document;
import com.chatbot.service.impl.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ChatResponse.DocumentResponse>> uploadDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "GENERAL") String type) {

        Document.DocumentType docType = Document.DocumentType.valueOf(type.toUpperCase());
        ChatResponse.DocumentResponse response =
                documentService.uploadDocument(userDetails.getUsername(), file, docType);
        return ResponseEntity.ok(ApiResponse.success("Document uploaded and processing started", response));
    }

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<ChatResponse.AiReplyResponse>> askQuestion(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChatRequest.DocumentQuestion request) {
        return ResponseEntity.ok(ApiResponse.success(
                documentService.askQuestion(userDetails.getUsername(), request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatResponse.DocumentResponse>>> getDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                documentService.getUserDocuments(userDetails.getUsername())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        documentService.deleteDocument(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Document deleted", null));
    }
}
