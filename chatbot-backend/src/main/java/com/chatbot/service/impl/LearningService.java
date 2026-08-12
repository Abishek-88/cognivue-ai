package com.chatbot.service.impl;

import com.chatbot.entity.*;
import com.chatbot.exception.ResourceNotFoundException;
import com.chatbot.repository.*;
import com.chatbot.service.GeminiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningService {

    private final UserRepository userRepo;
    private final ConversationRepository conversationRepo;
    private final MessageRepository messageRepo;
    private final GeminiService geminiService;

    @Transactional
    public LearningRoadmapResult generateRoadmap(String email, String topic, String currentLevel) {
        User user = getUser(email);

        String rawJson = geminiService.generateLearningRoadmap(topic, currentLevel);
        LearningRoadmapResult result = parseRoadmap(rawJson);

        // Save as a LEARNING conversation
        Conversation conv = conversationRepo.save(Conversation.builder()
                .user(user)
                .title("Learning: " + topic)
                .type(Conversation.ConversationType.LEARNING)
                .build());

        messageRepo.save(Message.builder()
                .conversation(conv)
                .sender(Message.Sender.USER)
                .message("Teach me " + topic)
                .messageType(Message.MessageType.TEXT)
                .build());

        messageRepo.save(Message.builder()
                .conversation(conv)
                .sender(Message.Sender.AI)
                .message("Here is your personalized learning roadmap for " + topic + ": " + rawJson)
                .messageType(Message.MessageType.TEXT)
                .build());

        result.setConversationId(conv.getId());
        return result;
    }

    public String askLearningQuestion(String email, Long conversationId, String question) {
        User user = getUser(email);
        Conversation conv = conversationRepo.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        List<Message> history = messageRepo.findByConversationOrderByTimestampAsc(conv);
        List<Map<String, String>> chatHistory = history.stream()
                .map(m -> Map.of(
                        "role", m.getSender() == Message.Sender.USER ? "user" : "model",
                        "text", m.getMessage()))
                .collect(Collectors.toList());

        String answer = geminiService.chat(question, chatHistory);

        messageRepo.save(Message.builder()
                .conversation(conv)
                .sender(Message.Sender.USER)
                .message(question)
                .messageType(Message.MessageType.TEXT)
                .build());

        messageRepo.save(Message.builder()
                .conversation(conv)
                .sender(Message.Sender.AI)
                .message(answer)
                .messageType(Message.MessageType.TEXT)
                .build());

        return answer;
    }

    public QuizResult generateQuiz(String email, String topic, int questionCount) {
        getUser(email);
        String prompt = """
                Generate a quiz with %d multiple-choice questions about: %s
                
                Return JSON:
                {
                  "topic": "%s",
                  "questions": [
                    {
                      "question": "<question text>",
                      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
                      "correctAnswer": "A",
                      "explanation": "<brief explanation>"
                    }
                  ]
                }
                Return ONLY valid JSON.
                """.formatted(questionCount, topic, topic);

        String rawJson = geminiService.chat(prompt, List.of());
        return parseQuiz(rawJson);
    }

    // ─── Parsers ─────────────────────────────────────────────────────────────────

    private LearningRoadmapResult parseRoadmap(String rawJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String cleaned = rawJson.replaceAll("```json|```", "").trim();
            JsonNode node = mapper.readTree(cleaned);

            List<WeeklyPlan> weeks = new ArrayList<>();
            node.path("weeks").forEach(w -> {
                List<String> resources = new ArrayList<>();
                w.path("resources").forEach(r -> resources.add(r.asText()));
                List<String> tasks = new ArrayList<>();
                w.path("tasks").forEach(t -> tasks.add(t.asText()));
                List<String> quiz = new ArrayList<>();
                w.path("quiz").forEach(q -> quiz.add(q.asText()));

                weeks.add(WeeklyPlan.builder()
                        .week(w.path("week").asInt())
                        .topic(w.path("topic").asText())
                        .resources(resources)
                        .tasks(tasks)
                        .quiz(quiz)
                        .build());
            });

            List<String> milestones = new ArrayList<>();
            node.path("milestones").forEach(m -> milestones.add(m.asText()));

            return LearningRoadmapResult.builder()
                    .title(node.path("title").asText(rawJson))
                    .totalDuration(node.path("totalDuration").asText("8 weeks"))
                    .weeks(weeks)
                    .milestones(milestones)
                    .build();
        } catch (Exception e) {
            log.warn("Roadmap parse failed: {}", e.getMessage());
            return LearningRoadmapResult.builder()
                    .title("Learning Roadmap")
                    .totalDuration("8 weeks")
                    .weeks(List.of())
                    .build();
        }
    }

    private QuizResult parseQuiz(String rawJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String cleaned = rawJson.replaceAll("```json|```", "").trim();
            JsonNode node = mapper.readTree(cleaned);

            List<QuizQuestion> questions = new ArrayList<>();
            node.path("questions").forEach(q -> {
                List<String> opts = new ArrayList<>();
                q.path("options").forEach(o -> opts.add(o.asText()));
                questions.add(QuizQuestion.builder()
                        .question(q.path("question").asText())
                        .options(opts)
                        .correctAnswer(q.path("correctAnswer").asText())
                        .explanation(q.path("explanation").asText())
                        .build());
            });

            return QuizResult.builder()
                    .topic(node.path("topic").asText())
                    .questions(questions)
                    .build();
        } catch (Exception e) {
            return QuizResult.builder().topic("Quiz").questions(List.of()).build();
        }
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // ─── DTOs ─────────────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LearningRoadmapResult {
        private Long conversationId;
        private String title;
        private String totalDuration;
        private List<WeeklyPlan> weeks;
        private List<String> milestones;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WeeklyPlan {
        private int week;
        private String topic;
        private List<String> resources;
        private List<String> tasks;
        private List<String> quiz;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class QuizResult {
        private String topic;
        private List<QuizQuestion> questions;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class QuizQuestion {
        private String question;
        private List<String> options;
        private String correctAnswer;
        private String explanation;
    }
}
