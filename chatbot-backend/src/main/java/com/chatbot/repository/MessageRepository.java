package com.chatbot.repository;

import com.chatbot.entity.Conversation;
import com.chatbot.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationOrderByTimestampAsc(Conversation conversation);

    // Get last N messages for context window
    @Query("SELECT m FROM Message m WHERE m.conversation = :conversation ORDER BY m.timestamp DESC")
    List<Message> findLastNMessages(Conversation conversation, Pageable pageable);

    long countByConversation(Conversation conversation);

    void deleteByConversation(Conversation conversation);
}
