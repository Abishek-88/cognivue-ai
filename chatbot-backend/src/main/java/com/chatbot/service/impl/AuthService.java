package com.chatbot.service.impl;

import com.chatbot.dto.request.AuthRequest;
import com.chatbot.dto.response.AuthResponse;
import com.chatbot.entity.User;
import com.chatbot.exception.BadRequestException;
import com.chatbot.exception.ResourceNotFoundException;
import com.chatbot.repository.UserRepository;
import com.chatbot.security.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final JwtUtils jwtUtils;

    @Transactional
    public AuthResponse.TokenPair register(AuthRequest.Register request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .authProvider(User.AuthProvider.LOCAL)
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        String accessToken  = jwtUtils.generateAccessToken(user.getEmail());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail());

        return buildTokenPair(accessToken, refreshToken, user);
    }

    public AuthResponse.TokenPair login(AuthRequest.Login request) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accessToken  = jwtUtils.generateAccessToken(auth);
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail());

        return buildTokenPair(accessToken, refreshToken, user);
    }

    public AuthResponse.TokenPair refreshToken(AuthRequest.RefreshToken request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtUtils.validateToken(refreshToken) || !jwtUtils.isRefreshToken(refreshToken)) {
            throw new BadRequestException("Invalid refresh token");
        }

        String email = jwtUtils.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String newAccessToken  = jwtUtils.generateAccessToken(email);
        String newRefreshToken = jwtUtils.generateRefreshToken(email);

        return buildTokenPair(newAccessToken, newRefreshToken, user);
    }

    @Transactional
    public void changePassword(String email, AuthRequest.ChangePassword request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private AuthResponse.TokenPair buildTokenPair(String accessToken, String refreshToken, User user) {
        return AuthResponse.TokenPair.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .user(AuthResponse.UserInfo.from(user))
                .build();
    }
}
