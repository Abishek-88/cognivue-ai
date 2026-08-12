package com.chatbot.controller;

import com.chatbot.dto.request.AuthRequest;
import com.chatbot.dto.response.ApiResponse;
import com.chatbot.dto.response.AuthResponse;
import com.chatbot.service.impl.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse.TokenPair>> register(
            @Valid @RequestBody AuthRequest.Register request) {
        return ResponseEntity.ok(ApiResponse.success("Registration successful",
                authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse.TokenPair>> login(
            @Valid @RequestBody AuthRequest.Login request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful",
                authService.login(request)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse.TokenPair>> refresh(
            @Valid @RequestBody AuthRequest.RefreshToken request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refreshToken(request)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AuthRequest.ChangePassword request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
