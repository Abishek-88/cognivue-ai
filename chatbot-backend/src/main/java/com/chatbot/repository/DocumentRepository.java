package com.chatbot.repository;

import com.chatbot.entity.Document;
import com.chatbot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserOrderByUploadTimeDesc(User user);
    Optional<Document> findByIdAndUser(Long id, User user);
    List<Document> findByUserAndDocumentType(User user, Document.DocumentType type);
    List<Document> findByUserAndStatus(User user, Document.DocumentStatus status);
}
