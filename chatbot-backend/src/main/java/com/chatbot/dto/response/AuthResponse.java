package com.chatbot.dto.response;

import com.chatbot.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class AuthResponse {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenPair {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long expiresIn;
        private UserInfo user;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String profilePictureUrl;
        private String preferredLanguage;
        private LocalDateTime createdAt;

        public static UserInfo from(User user) {
            return UserInfo.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .profilePictureUrl(user.getProfilePictureUrl())
                    .preferredLanguage(user.getPreferredLanguage())
                    .createdAt(user.getCreatedAt())
                    .build();
        }
    }
}
