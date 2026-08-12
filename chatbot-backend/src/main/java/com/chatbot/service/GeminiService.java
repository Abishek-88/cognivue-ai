package com.chatbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    @Value("${app.gemini.api-key}")
    private String apiKey;

    @Value("${app.gemini.base-url}")
    private String baseUrl;

    @Value("${app.gemini.model}")
    private String model;

    @Value("${app.gemini.embedding-model}")
    private String embeddingModel;

    @Value("${app.gemini.max-tokens}")
    private int maxTokens;

    @Value("${app.gemini.temperature}")
    private double temperature;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // ─── Core Chat ──────────────────────────────────────────────────────────────

    public String chat(String userMessage, List<Map<String, String>> history) {
        try {
            String url = baseUrl + "/models/" + model + ":generateContent?key=" + apiKey;

            ObjectNode requestBody = objectMapper.createObjectNode();
            ArrayNode contents = requestBody.putArray("contents");

            // Add conversation history
            for (Map<String, String> turn : history) {
                ObjectNode content = contents.addObject();
                content.put("role", turn.get("role"));
                ArrayNode parts = content.putArray("parts");
                parts.addObject().put("text", turn.get("text"));
            }

            // Add current user message
            ObjectNode userContent = contents.addObject();
            userContent.put("role", "user");
            userContent.putArray("parts").addObject().put("text", userMessage);

            // Generation config
            ObjectNode genConfig = requestBody.putObject("generationConfig");
            genConfig.put("maxOutputTokens", maxTokens);
            genConfig.put("temperature", temperature);

            String response = webClient.post()
                    .uri(url)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractTextFromResponse(response);
        } catch (Exception e) {
            log.error("Gemini chat error: {}", e.getMessage(), e);
            throw new RuntimeException("AI service error: " + e.getMessage());
        }
    }

    // ─── Document Q&A with RAG ───────────────────────────────────────────────

    public String answerWithContext(String question, List<String> relevantChunks,
                                    List<Map<String, String>> history, String languageCode) {
        String contextText = String.join("\n\n---\n\n", relevantChunks);

        String systemPrompt = buildDocumentQAPrompt(question, contextText, languageCode);
        return chat(systemPrompt, history);
    }

    // ─── Resume Analysis ────────────────────────────────────────────────────────

    public String analyzeResume(String resumeText) {
        String prompt = """
                Analyze the following resume and provide a comprehensive evaluation in JSON format.
                
                Resume Text:
                %s
                
                Provide a JSON response with exactly these fields:
                {
                  "atsScore": <integer 0-100>,
                  "resumeSummary": "<2-3 sentence summary>",
                  "extractedSkills": "<comma-separated list of technical and soft skills>",
                  "missingSkills": "<comma-separated list of commonly expected missing skills>",
                  "suggestions": "<numbered list of specific improvement suggestions>",
                  "experienceLevel": "<Fresher|Junior|Mid-level|Senior|Lead>",
                  "targetRoles": "<comma-separated list of suitable job roles>"
                }
                
                Return ONLY valid JSON, no markdown, no explanation.
                """.formatted(resumeText);

        return chat(prompt, List.of());
    }

    // ─── Interview Question Generation ──────────────────────────────────────────

    public String generateInterviewQuestions(String resumeText, String targetRole) {
        String prompt = """
                Based on the following resume, generate comprehensive interview questions.
                Target Role: %s
                
                Resume:
                %s
                
                Generate a JSON response with:
                {
                  "technicalQuestions": ["<question1>", "<question2>", ...],
                  "behavioralQuestions": ["<question1>", "<question2>", ...],
                  "roleSpecificQuestions": ["<question1>", "<question2>", ...],
                  "hrQuestions": ["<question1>", "<question2>", ...],
                  "codingChallenges": ["<challenge1>", "<challenge2>", ...]
                }
                
                Generate 5 questions per category. Return ONLY valid JSON.
                """.formatted(targetRole, resumeText);

        return chat(prompt, List.of());
    }

    // ─── Learning Roadmap ───────────────────────────────────────────────────────

    public String generateLearningRoadmap(String topic, String currentLevel) {
        String prompt = """
                Create a detailed personalized learning roadmap for: %s
                Current Level: %s
                
                Provide JSON response with:
                {
                  "title": "<roadmap title>",
                  "totalDuration": "<estimated total time>",
                  "weeks": [
                    {
                      "week": 1,
                      "topic": "<topic>",
                      "resources": ["<resource1>", "<resource2>"],
                      "tasks": ["<task1>", "<task2>"],
                      "quiz": ["<question1>?", "<question2>?"]
                    }
                  ],
                  "milestones": ["<milestone1>", "<milestone2>"]
                }
                
                Plan for 8 weeks minimum. Return ONLY valid JSON.
                """.formatted(topic, currentLevel);

        return chat(prompt, List.of());
    }

    // ─── Embeddings ─────────────────────────────────────────────────────────────

    public List<Double> generateEmbedding(String text) {
        try {
            String url = baseUrl + "/models/" + embeddingModel + ":embedContent?key=" + apiKey;

            ObjectNode requestBody = objectMapper.createObjectNode();
            ObjectNode content = requestBody.putObject("content");
            content.putArray("parts").addObject().put("text", text);

            String response = webClient.post()
                    .uri(url)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(response);
            JsonNode values = root.path("embedding").path("values");

            List<Double> embedding = new java.util.ArrayList<>();
            values.forEach(v -> embedding.add(v.asDouble()));
            return embedding;
        } catch (Exception e) {
            log.error("Embedding generation error: {}", e.getMessage(), e);
            throw new RuntimeException("Embedding error: " + e.getMessage());
        }
    }

    // ─── Language Detection ─────────────────────────────────────────────────────

    public String detectLanguage(String text) {
        String prompt = "Detect the language of this text and return ONLY the ISO 639-1 code (e.g., en, ta, hi, te, ml). Text: " + text;
        String result = chat(prompt, List.of());
        return result.trim().toLowerCase().replaceAll("[^a-z]", "").substring(0, Math.min(2, result.trim().length()));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private String extractTextFromResponse(String rawResponse) throws Exception {
        JsonNode root = objectMapper.readTree(rawResponse);
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty()) {
            log.warn("No candidates in Gemini response: {}", rawResponse);
            return "I'm sorry, I couldn't generate a response. Please try again.";
        }
        return candidates.get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();
    }

    private String buildDocumentQAPrompt(String question, String context, String lang) {
        return """
                You are a helpful document assistant. Use ONLY the provided context to answer the question.
                If the answer is not in the context, say "I couldn't find that information in the document."
                Respond in the same language as the question (%s).
                
                Context:
                %s
                
                Question: %s
                """.formatted(lang, context, question);
    }
}
