package com.chatbot.controller;

import com.chatbot.dto.response.ApiResponse;
import com.chatbot.service.impl.ResumeService;
import com.chatbot.service.impl.LearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<ResumeService.ResumeAnalysisResult>> analyzeResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(
                resumeService.analyzeResume(userDetails.getUsername(), file)));
    }

    @PostMapping("/{documentId}/interview-questions")
    public ResponseEntity<ApiResponse<ResumeService.InterviewQuestionsResult>> generateQuestions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "Software Engineer") String targetRole) {
        return ResponseEntity.ok(ApiResponse.success(
                resumeService.generateInterviewQuestions(userDetails.getUsername(), documentId, targetRole)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ResumeService.ResumeReportSummary>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                resumeService.getResumeHistory(userDetails.getUsername())));
    }
}


@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
class LearningController {

    private final LearningService learningService;

    @PostMapping("/roadmap")
    public ResponseEntity<ApiResponse<LearningService.LearningRoadmapResult>> generateRoadmap(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String topic = body.getOrDefault("topic", "Programming");
        String level = body.getOrDefault("currentLevel", "Beginner");
        return ResponseEntity.ok(ApiResponse.success(
                learningService.generateRoadmap(userDetails.getUsername(), topic, level)));
    }

    @PostMapping("/ask/{conversationId}")
    public ResponseEntity<ApiResponse<String>> askLearning(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long conversationId,
            @RequestBody Map<String, String> body) {
        String answer = learningService.askLearningQuestion(
                userDetails.getUsername(), conversationId, body.get("question"));
        return ResponseEntity.ok(ApiResponse.success(answer));
    }

    @GetMapping("/quiz")
    public ResponseEntity<ApiResponse<LearningService.QuizResult>> generateQuiz(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String topic,
            @RequestParam(defaultValue = "5") int count) {
        return ResponseEntity.ok(ApiResponse.success(
                learningService.generateQuiz(userDetails.getUsername(), topic, count)));
    }
}
