-- ============================================================
-- AI-Powered Intelligent Learning & Document Assistant
-- MySQL Schema — matches JPA entities exactly
-- ============================================================

CREATE DATABASE IF NOT EXISTS chatbot_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chatbot_db;

-- Optional: dedicated app user (skip if using root)
-- CREATE USER IF NOT EXISTS 'chatbot'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON chatbot_db.* TO 'chatbot'@'localhost';
-- FLUSH PRIVILEGES;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Table: users
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name`                VARCHAR(100)  NOT NULL,
  `email`               VARCHAR(150)  NOT NULL,
  `password`            VARCHAR(255)  NULL,
  `role`                ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  `auth_provider`       ENUM('LOCAL','GOOGLE') NOT NULL DEFAULT 'LOCAL',
  `provider_id`         VARCHAR(255)  NULL,
  `profile_picture_url` VARCHAR(500)  NULL,
  `preferred_language`  VARCHAR(20)   NOT NULL DEFAULT 'en',
  `is_active`           TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_provider` (`provider_id`, `auth_provider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: conversations
-- ============================================================
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id`           BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`      BIGINT        NOT NULL,
  `title`        VARCHAR(200)  NULL,
  `type`         ENUM('GENERAL','DOCUMENT_QA','RESUME_ANALYSIS','INTERVIEW_PREP','LEARNING')
                 NOT NULL DEFAULT 'GENERAL',
  `document_id`  BIGINT        NULL,
  `is_archived`  TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_conv_user` (`user_id`),
  KEY `idx_conv_user_archived` (`user_id`, `is_archived`),
  KEY `idx_conv_type` (`user_id`, `type`),
  CONSTRAINT `fk_conv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: messages
-- ============================================================
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id`               BIGINT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id`  BIGINT        NOT NULL,
  `sender`           ENUM('USER','AI') NOT NULL,
  `message`          TEXT          NOT NULL,
  `message_type`     ENUM('TEXT','VOICE','DOCUMENT') NOT NULL DEFAULT 'TEXT',
  `language_code`    VARCHAR(10)   NOT NULL DEFAULT 'en',
  `token_count`      INT           NULL,
  `timestamp`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_msg_conversation` (`conversation_id`),
  KEY `idx_msg_conv_time` (`conversation_id`, `timestamp`),
  CONSTRAINT `fk_msg_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: documents
-- ============================================================
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id`                    BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`               BIGINT        NOT NULL,
  `file_name`             VARCHAR(255)  NOT NULL,
  `original_name`         VARCHAR(255)  NULL,
  `cloudinary_url`        VARCHAR(500)  NULL,
  `cloudinary_public_id`  VARCHAR(255)  NULL,
  `file_size`             BIGINT        NULL,
  `page_count`            INT           NULL,
  `status`                ENUM('PENDING','PROCESSING','READY','FAILED') NOT NULL DEFAULT 'PENDING',
  `chroma_collection_id`  VARCHAR(255)  NULL,
  `total_chunks`          INT           NULL,
  `is_scanned`            TINYINT(1)    NOT NULL DEFAULT 0,
  `document_type`         ENUM('GENERAL','RESUME') NOT NULL DEFAULT 'GENERAL',
  `error_message`         TEXT          NULL,
  `upload_time`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_doc_user` (`user_id`),
  KEY `idx_doc_user_type` (`user_id`, `document_type`),
  KEY `idx_doc_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_doc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: resume_reports
-- ============================================================
DROP TABLE IF EXISTS `resume_reports`;
CREATE TABLE `resume_reports` (
  `id`                BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`           BIGINT        NOT NULL,
  `document_id`       BIGINT        NULL,
  `ats_score`         INT           NULL,
  `resume_summary`    TEXT          NULL,
  `extracted_skills`  TEXT          NULL,
  `missing_skills`    TEXT          NULL,
  `suggestions`       TEXT          NULL,
  `experience_level`  VARCHAR(50)   NULL,
  `target_roles`      TEXT          NULL,
  `generated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_resume_user` (`user_id`),
  KEY `idx_resume_user_generated` (`user_id`, `generated_at`),
  CONSTRAINT `fk_resume_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_resume_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Add FK from conversations.document_id -> documents.id
-- (added after both tables exist)
-- ============================================================
ALTER TABLE `conversations`
  ADD CONSTRAINT `fk_conv_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Seed data (optional — comment out if not needed)
-- ============================================================

-- Sample admin user (password = 'admin123', bcrypt-hashed with strength 12)
-- Replace this hash by registering normally through /api/auth/register if you prefer.
INSERT INTO `users` (`name`, `email`, `password`, `role`, `auth_provider`, `preferred_language`)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2a$12$KIXQ4Yz8N1bM3vR5tW7yJeQwX2sL9pH4cF6dG0aE1jK3mN5oP7qRu',
  'ADMIN',
  'LOCAL',
  'en'
);

-- ============================================================
-- Useful verification queries
-- ============================================================
-- SHOW TABLES;
-- DESCRIBE users;
-- SELECT * FROM users;
-- SELECT c.id, c.title, u.name FROM conversations c JOIN users u ON c.user_id = u.id;