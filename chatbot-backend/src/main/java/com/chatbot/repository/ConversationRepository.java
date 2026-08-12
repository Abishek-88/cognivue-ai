package com.chatbot.repository;

import com.chatbot.entity.Conversation;
import com.chatbot.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Page<Conversation> findByUserAndIsArchivedFalseOrderByUpdatedAtDesc(User user, Pageable pageable);

    List<Conversation> findByUserAndIsArchivedFalseOrderByUpdatedAtDesc(User user);

    Optional<Conversation> findByIdAndUser(Long id, User user);

    @Query("SELECT c FROM Conversation c WHERE c.user = :user AND c.type = :type ORDER BY c.updatedAt DESC")
    List<Conversation> findByUserAndType(User user, Conversation.ConversationType type);

    long countByUserAndIsArchivedFalse(User user);
}
