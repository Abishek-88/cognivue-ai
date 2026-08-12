package com.chatbot.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ConversationType type = ConversationType.GENERAL;

    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "is_archived")
    @Builder.Default
    private Boolean isArchived = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("timestamp ASC")
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    public enum ConversationType {
        GENERAL, DOCUMENT_QA, RESUME_ANALYSIS, INTERVIEW_PREP, LEARNING
    }
}
