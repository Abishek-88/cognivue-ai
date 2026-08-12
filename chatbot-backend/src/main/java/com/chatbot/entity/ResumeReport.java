package com.chatbot.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "resume_reports")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ResumeReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @Column(name = "ats_score")
    private Integer atsScore;

    @Column(name = "resume_summary", columnDefinition = "TEXT")
    private String resumeSummary;

    @Column(name = "extracted_skills", columnDefinition = "TEXT")
    private String extractedSkills;

    @Column(name = "missing_skills", columnDefinition = "TEXT")
    private String missingSkills;

    @Column(name = "suggestions", columnDefinition = "TEXT")
    private String suggestions;

    @Column(name = "experience_level", length = 50)
    private String experienceLevel;

    @Column(name = "target_roles", columnDefinition = "TEXT")
    private String targetRoles;

    @CreationTimestamp
    @Column(name = "generated_at", updatable = false)
    private LocalDateTime generatedAt;
}
