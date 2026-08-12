package com.chatbot.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "original_name", length = 255)
    private String originalName;

    @Column(name = "cloudinary_url", length = 500)
    private String cloudinaryUrl;

    @Column(name = "cloudinary_public_id", length = 255)
    private String cloudinaryPublicId;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "page_count")
    private Integer pageCount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;

    @Column(name = "chroma_collection_id", length = 255)
    private String chromaCollectionId;

    @Column(name = "total_chunks")
    private Integer totalChunks;

    @Column(name = "is_scanned")
    @Builder.Default
    private Boolean isScanned = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DocumentType documentType = DocumentType.GENERAL;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "upload_time", updatable = false)
    private LocalDateTime uploadTime;

    public enum DocumentStatus {
        PENDING, PROCESSING, READY, FAILED
    }

    public enum DocumentType {
        GENERAL, RESUME
    }
}
