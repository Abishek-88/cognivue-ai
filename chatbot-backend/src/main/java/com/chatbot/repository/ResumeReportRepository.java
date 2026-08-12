package com.chatbot.repository;

import com.chatbot.entity.ResumeReport;
import com.chatbot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeReportRepository extends JpaRepository<ResumeReport, Long> {
    List<ResumeReport> findByUserOrderByGeneratedAtDesc(User user);
    Optional<ResumeReport> findTopByUserOrderByGeneratedAtDesc(User user);
    Optional<ResumeReport> findByIdAndUser(Long id, User user);
}
