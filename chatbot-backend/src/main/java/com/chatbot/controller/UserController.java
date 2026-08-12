package com.chatbot.controller;

import com.chatbot.dto.response.ApiResponse;
import com.chatbot.dto.response.AuthResponse;
import com.chatbot.entity.User;
import com.chatbot.exception.ResourceNotFoundException;
import com.chatbot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(ApiResponse.success(AuthResponse.UserInfo.from(user)));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> updates) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (updates.containsKey("name") && !updates.get("name").isBlank()) {
            user.setName(updates.get("name"));
        }
        if (updates.containsKey("preferredLanguage")) {
            user.setPreferredLanguage(updates.get("preferredLanguage"));
        }

        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Profile updated",
                AuthResponse.UserInfo.from(user)));
    }
}
