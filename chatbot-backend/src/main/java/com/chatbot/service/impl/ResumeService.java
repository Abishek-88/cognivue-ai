package com.chatbot.service.impl;

import com.chatbot.dto.response.ChatResponse;
import com.chatbot.entity.*;
import com.chatbot.exception.BadRequestException;
import com.chatbot.exception.ResourceNotFoundException;
import com.chatbot.repository.*;
import com.chatbot.service.*;
import com.chatbot.service.PdfProcessingService.PdfExtractionResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private final UserRepository userRepo;
    private final DocumentRepository documentRepo;
    private final ResumeReportRepository reportRepo;
    private final PdfProcessingService pdfService;
    private final CloudinaryService cloudinaryService;
    private final GeminiService geminiService;

    @Transactional
    public ResumeAnalysisResult analyzeResume(String email, MultipartFile file) {
        User user = getUser(email);
        validatePdf(file);

        // Upload to Cloudinary
        CloudinaryService.UploadResult upload;
        try {
            upload = cloudinaryService.uploadFile(file, "resumes/" + email);
        } catch (Exception e) {
            throw new BadRequestException("Resume upload failed");
        }

        // Extract text
        PdfExtractionResult extracted;
        try {
            extracted = pdfService.extractText(file);
        } catch (Exception e) {
            throw new BadRequestException("Could not read resume: " + e.getMessage());
        }

        // Save document record
        Document document = documentRepo.save(Document.builder()
                .user(user)
                .fileName(upload.getPublicId())
                .originalName(file.getOriginalFilename())
                .cloudinaryUrl(upload.getSecureUrl())
                .cloudinaryPublicId(upload.getPublicId())
                .fileSize(upload.getBytes())
                .pageCount(extracted.getPageCount())
                .status(Document.DocumentStatus.READY)
                .documentType(Document.DocumentType.RESUME)
                .isScanned(extracted.isScanned())
                .build());

        // Analyze with Gemini
        String rawJson = geminiService.analyzeResume(extracted.getText());

        // Parse JSON response
        ResumeAnalysisResult result = parseResumeAnalysis(rawJson);

        // Save report
        ResumeReport report = ResumeReport.builder()
                .user(user)
                .document(document)
                .atsScore(result.getAtsScore())
                .resumeSummary(result.getResumeSummary())
                .extractedSkills(result.getExtractedSkills())
                .missingSkills(result.getMissingSkills())
                .suggestions(result.getSuggestions())
                .experienceLevel(result.getExperienceLevel())
                .targetRoles(result.getTargetRoles())
                .build();

        reportRepo.save(report);
        result.setReportId(report.getId());
        result.setDocumentId(document.getId());

        return result;
    }

    public InterviewQuestionsResult generateInterviewQuestions(String email,
                                                                Long documentId,
                                                                String targetRole) {
        User user = getUser(email);
        Document document = documentRepo.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found"));

        // Re-download and extract text from Cloudinary URL
        // (In production, you'd cache this. For now, re-fetch via URL.)
        // Since we can't re-parse the uploaded file here, we use Gemini with document URL
        String prompt = "Document URL: " + document.getCloudinaryUrl() + "\nTarget Role: " + targetRole;
        String rawJson = geminiService.generateInterviewQuestions(
                "Resume from: " + document.getOriginalName() + " (stored at " + document.getCloudinaryUrl() + ")",
                targetRole
        );

        return parseInterviewQuestions(rawJson);
    }

    public List<ResumeReportSummary> getResumeHistory(String email) {
        User user = getUser(email);
        return reportRepo.findByUserOrderByGeneratedAtDesc(user)
                .stream()
                .map(ResumeReportSummary::from)
                .collect(Collectors.toList());
    }

    // ─── Parse Helpers ───────────────────────────────────────────────────────────

    private ResumeAnalysisResult parseResumeAnalysis(String rawJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String cleaned = rawJson.replaceAll("```json|```", "").trim();
            JsonNode node = mapper.readTree(cleaned);

            return ResumeAnalysisResult.builder()
                    .atsScore(node.path("atsScore").asInt(0))
                    .resumeSummary(node.path("resumeSummary").asText(""))
                    .extractedSkills(node.path("extractedSkills").asText(""))
                    .missingSkills(node.path("missingSkills").asText(""))
                    .suggestions(node.path("suggestions").asText(""))
                    .experienceLevel(node.path("experienceLevel").asText("Unknown"))
                    .targetRoles(node.path("targetRoles").asText(""))
                    .build();
        } catch (Exception e) {
            log.warn("Could not parse resume JSON: {}", e.getMessage());
            return ResumeAnalysisResult.builder()
                    .atsScore(0)
                    .resumeSummary("Analysis complete.")
                    .suggestions(rawJson)
                    .build();
        }
    }

    private InterviewQuestionsResult parseInterviewQuestions(String rawJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String cleaned = rawJson.replaceAll("```json|```", "").trim();
            JsonNode node = mapper.readTree(cleaned);

            return InterviewQuestionsResult.builder()
                    .technicalQuestions(toList(node.path("technicalQuestions")))
                    .behavioralQuestions(toList(node.path("behavioralQuestions")))
                    .roleSpecificQuestions(toList(node.path("roleSpecificQuestions")))
                    .hrQuestions(toList(node.path("hrQuestions")))
                    .codingChallenges(toList(node.path("codingChallenges")))
                    .build();
        } catch (Exception e) {
            return InterviewQuestionsResult.builder()
                    .technicalQuestions(List.of(rawJson))
                    .build();
        }
    }

    private List<String> toList(JsonNode node) {
        List<String> list = new java.util.ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> list.add(n.asText()));
        }
        return list;
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("File is empty");
        if (!file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Only PDF resumes are supported");
        }
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // ─── Result DTOs ─────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ResumeAnalysisResult {
        private Long reportId;
        private Long documentId;
        private int atsScore;
        private String resumeSummary;
        private String extractedSkills;
        private String missingSkills;
        private String suggestions;
        private String experienceLevel;
        private String targetRoles;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class InterviewQuestionsResult {
        private List<String> technicalQuestions;
        private List<String> behavioralQuestions;
        private List<String> roleSpecificQuestions;
        private List<String> hrQuestions;
        private List<String> codingChallenges;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ResumeReportSummary {
        private Long id;
        private int atsScore;
        private String experienceLevel;
        private java.time.LocalDateTime generatedAt;

        public static ResumeReportSummary from(ResumeReport r) {
            return ResumeReportSummary.builder()
                    .id(r.getId())
                    .atsScore(r.getAtsScore() != null ? r.getAtsScore() : 0)
                    .experienceLevel(r.getExperienceLevel())
                    .generatedAt(r.getGeneratedAt())
                    .build();
        }
    }
}
