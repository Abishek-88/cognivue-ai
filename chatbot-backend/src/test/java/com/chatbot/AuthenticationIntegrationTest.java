import com.fasterxml.jackson.databind.ObjectMapper;
import com.chatbot.AiChatbotApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = AiChatbotApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthenticationIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper();

    private String accessToken;
    private String refreshToken;

    @BeforeEach
    void setUp() throws Exception {
        // Register a new user to obtain tokens
        String registerPayload = "{\"name\":\"Test User\",\"email\":\"user@example.com\",\"password\":\"password123\"}";
        MvcResult registerResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/register").contentType("application/json").content(registerPayload))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        String registerResponse = registerResult.getResponse().getContentAsString();
        // Parse JSON to get accessToken and refreshToken
        accessToken = objectMapper.readTree(registerResponse).path("data").path("accessToken").asText();
        refreshToken = objectMapper.readTree(registerResponse).path("data").path("refreshToken").asText();
    }

    @Test
    void accessProtectedEndpointWithValidToken() throws Exception {
        String messagePayload = "{\"message\":\"Hello\"}";
        mockMvc.perform(MockMvcRequestBuilders.post("/api/chat/message")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType("application/json")
                        .content(messagePayload))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void accessProtectedEndpointWithExpiredToken() throws Exception {
        // Wait longer than access token expiration (set to 1s in test config)
        Thread.sleep(1500);
        String messagePayload = "{\"message\":\"Hello\"}";
        mockMvc.perform(MockMvcRequestBuilders.post("/api/chat/message")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType("application/json")
                        .content(messagePayload))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    void accessProtectedEndpointWithInvalidToken() throws Exception {
        String messagePayload = "{\"message\":\"Hello\"}";
        mockMvc.perform(MockMvcRequestBuilders.post("/api/chat/message")
                        .header("Authorization", "Bearer invalidtoken")
                        .contentType("application/json")
                        .content(messagePayload))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    void refreshTokenSuccessfullyObtainsNewAccessToken() throws Exception {
        // Use the refresh endpoint directly
        String refreshPayload = "{\"refreshToken\":\"" + refreshToken + "\"}";
        MvcResult refreshResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/refresh").contentType("application/json").content(refreshPayload))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        String refreshResponse = refreshResult.getResponse().getContentAsString();
        String newAccessToken = objectMapper.readTree(refreshResponse).path("data").path("accessToken").asText();
        // Use new access token to access protected endpoint
        String messagePayload = "{\"message\":\"After refresh\"}";
        mockMvc.perform(MockMvcRequestBuilders.post("/api/chat/message")
                        .header("Authorization", "Bearer " + newAccessToken)
                        .contentType("application/json")
                        .content(messagePayload))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void refreshTokenCannotBeUsedAsBearerInProtectedEndpoint() throws Exception {
        // Attempt to use refresh token as bearer
        String messagePayload = "{\"message\":\"Should fail\"}";
        mockMvc.perform(MockMvcRequestBuilders.post("/api/chat/message")
                        .header("Authorization", "Bearer " + refreshToken)
                        .contentType("application/json")
                        .content(messagePayload))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }
}
