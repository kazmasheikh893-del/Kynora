-- =======================================================
-- Kynora Database DDL Schema (MySQL 8.0+)
-- AI-Powered Intelligent Email Management System
-- Compatible with MySQL Workbench
-- =======================================================

CREATE DATABASE IF NOT EXISTS `kynora_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `kynora_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `full_name` VARCHAR(255) NULL,
    `hashed_password` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Gmail Accounts (OAuth Credentials)
CREATE TABLE IF NOT EXISTS `gmail_accounts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `google_email` VARCHAR(255) NOT NULL,
    `google_sub_id` VARCHAR(255) NOT NULL UNIQUE,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `token_expiry` DATETIME NULL,
    `sync_status` VARCHAR(50) DEFAULT 'idle',
    `last_synced_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_gmail_user` (`user_id`),
    CONSTRAINT `fk_gmail_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Emails Table
CREATE TABLE IF NOT EXISTS `emails` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` INT NULL,
    `gmail_message_id` VARCHAR(128) UNIQUE NULL,
    `sender_name` VARCHAR(255) NOT NULL,
    `sender_email` VARCHAR(255) NOT NULL,
    `recipient_email` VARCHAR(255) NULL,
    `subject` VARCHAR(500) NOT NULL,
    `preview` VARCHAR(1000) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `received_at` DATETIME NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_emails_user_received` (`user_id`, `received_at`),
    INDEX `idx_emails_sender` (`sender_email`),
    INDEX `idx_emails_received_at` (`received_at`),
    CONSTRAINT `fk_emails_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Email Predictions (Machine Learning Outputs)
CREATE TABLE IF NOT EXISTS `email_predictions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email_id` VARCHAR(64) NOT NULL UNIQUE,
    `predicted_priority` VARCHAR(32) NOT NULL,
    `predicted_category` VARCHAR(64) NOT NULL,
    `summary` TEXT NULL,
    `action_required` BOOLEAN NOT NULL DEFAULT FALSE,
    `recommended_action` VARCHAR(500) NULL,
    `detected_deadline` VARCHAR(64) NULL,
    `cluster_id` INT NULL,
    `confidence_score` FLOAT NOT NULL DEFAULT 0.85,
    `model_version` VARCHAR(64) NOT NULL DEFAULT 'scikit-learn-v1.0',
    `prediction_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_pred_priority` (`predicted_priority`),
    INDEX `idx_pred_category` (`predicted_category`),
    CONSTRAINT `fk_predictions_email` FOREIGN KEY (`email_id`) 
        REFERENCES `emails` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. User Feedback (Model Tuning & Corrections)
CREATE TABLE IF NOT EXISTS `user_feedback` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email_id` VARCHAR(64) NOT NULL,
    `user_id` INT NULL,
    `corrected_priority` VARCHAR(32) NULL,
    `corrected_category` VARCHAR(64) NULL,
    `user_notes` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_feedback_email` (`email_id`),
    INDEX `idx_feedback_user` (`user_id`),
    CONSTRAINT `fk_feedback_email` FOREIGN KEY (`email_id`) 
        REFERENCES `emails` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
