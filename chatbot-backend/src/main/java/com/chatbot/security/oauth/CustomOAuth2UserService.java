package com.chatbot.security.oauth;

import com.chatbot.entity.User;
import com.chatbot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);
        return processOAuth2User(request, oAuth2User);
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest request, OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email    = (String) attributes.get("email");
        String name     = (String) attributes.get("name");
        String picture  = (String) attributes.get("picture");
        String googleId = (String) attributes.get("sub");

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> createGoogleUser(email, name, picture, googleId));

        // Update picture on each login
        if (picture != null && !picture.equals(user.getProfilePictureUrl())) {
            user.setProfilePictureUrl(picture);
            userRepository.save(user);
        }

        return new CustomOAuth2UserPrincipal(user, attributes);
    }

    private User createGoogleUser(String email, String name, String picture, String googleId) {
        User user = User.builder()
                .email(email)
                .name(name)
                .profilePictureUrl(picture)
                .providerId(googleId)
                .authProvider(User.AuthProvider.GOOGLE)
                .role(User.Role.USER)
                .build();
        return userRepository.save(user);
    }
}
