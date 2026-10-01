-- ============================================================================
-- Naga AI Assistant (Saranya) — Hostinger Production Safe Migration
-- SAFE: Uses `CREATE TABLE IF NOT EXISTS` and `INSERT IGNORE INTO`
-- Guaranteed: Never drops existing tables, never deletes existing client data!
-- Character Set: utf8mb4 (Full Unicode & Tamil Script Support)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NOT NULL,
  `role` ENUM('owner', 'admin', 'viewer') NOT NULL DEFAULT 'owner',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. System Settings Table
CREATE TABLE IF NOT EXISTS `settings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `assistant_name` VARCHAR(50) NOT NULL DEFAULT 'Arya',
  `owner_name` VARCHAR(100) NOT NULL DEFAULT 'Naga',
  `owner_phone` VARCHAR(30) NOT NULL DEFAULT '+916382379565',
  `owner_email` VARCHAR(150) NOT NULL DEFAULT 'naga@business.com',
  `language` VARCHAR(30) NOT NULL DEFAULT 'Tamil',
  `voice_style` VARCHAR(100) NOT NULL DEFAULT 'Natural Chennai conversational Tamil',
  `call_threshold` ENUM('high_only', 'high_and_normal', 'all') NOT NULL DEFAULT 'high_only',
  `quiet_hours_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `quiet_hours_start` VARCHAR(10) NOT NULL DEFAULT '22:00',
  `quiet_hours_end` VARCHAR(10) NOT NULL DEFAULT '07:00',
  `allow_high_priority_in_quiet_hours` TINYINT(1) NOT NULL DEFAULT 1,
  `mock_mode` TINYINT(1) NOT NULL DEFAULT 0,
  `gemini_api_key` VARCHAR(255) DEFAULT NULL,
  `vobiz_auth_id` VARCHAR(100) DEFAULT NULL,
  `vobiz_auth_token` VARCHAR(100) DEFAULT NULL,
  `vobiz_number` VARCHAR(30) DEFAULT '+914400000000',
  `snapserve_api_key` VARCHAR(255) DEFAULT NULL,
  `snapserve_agent_id` VARCHAR(100) DEFAULT NULL,
  `n8n_webhook_secret` VARCHAR(100) DEFAULT NULL,
  `whatsapp_verify_token` VARCHAR(100) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Clients Table
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `company` VARCHAR(150) DEFAULT '',
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `whatsapp` VARCHAR(30) DEFAULT NULL,
  `total_messages` INT NOT NULL DEFAULT 0,
  `total_calls` INT NOT NULL DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_clients_phone` (`phone`),
  INDEX `idx_clients_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `client_id` VARCHAR(36) DEFAULT NULL,
  `client_name` VARCHAR(100) NOT NULL DEFAULT 'Client',
  `company` VARCHAR(150) DEFAULT '',
  `channel` ENUM('email', 'whatsapp') NOT NULL,
  `subject` VARCHAR(255) DEFAULT NULL,
  `message` LONGTEXT NOT NULL,
  `clean_message` LONGTEXT DEFAULT NULL,
  `received_at` DATETIME NOT NULL,
  `processed_at` DATETIME DEFAULT NULL,
  `status` ENUM('received', 'analyzed', 'called', 'pending', 'ignored') NOT NULL DEFAULT 'received',
  `source_message_id` VARCHAR(150) DEFAULT NULL,
  `idempotency_key` VARCHAR(255) DEFAULT NULL,
  `raw_payload` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_msg_client` (`client_id`),
  INDEX `idx_msg_channel` (`channel`),
  INDEX `idx_msg_status` (`status`),
  INDEX `idx_msg_idempotency` (`idempotency_key`),
  CONSTRAINT `fk_messages_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. AI Analyses Table
CREATE TABLE IF NOT EXISTS `ai_analyses` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `message_id` VARCHAR(36) NOT NULL,
  `should_call` TINYINT(1) NOT NULL DEFAULT 0,
  `client_name` VARCHAR(100) NOT NULL,
  `company` VARCHAR(150) DEFAULT '',
  `client_contact` VARCHAR(100) DEFAULT '',
  `channel` ENUM('email', 'whatsapp') NOT NULL,
  `priority` ENUM('high', 'normal', 'low') NOT NULL DEFAULT 'normal',
  `summary` TEXT NOT NULL,
  `next_step` VARCHAR(255) DEFAULT NULL,
  `deadline` VARCHAR(100) DEFAULT NULL,
  `reason` TEXT DEFAULT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `model` VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-flash',
  `raw_response` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_analysis_msg` (`message_id`),
  INDEX `idx_analysis_priority` (`priority`),
  INDEX `idx_analysis_call` (`should_call`),
  CONSTRAINT `fk_analysis_msg` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Voice Calls Table
CREATE TABLE IF NOT EXISTS `calls` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `message_id` VARCHAR(36) DEFAULT NULL,
  `client_id` VARCHAR(36) DEFAULT NULL,
  `client_name` VARCHAR(100) NOT NULL,
  `channel` ENUM('email', 'whatsapp') NOT NULL,
  `phone_number` VARCHAR(30) NOT NULL,
  `provider` ENUM('mock', 'snapserve', 'vobiz') NOT NULL DEFAULT 'mock',
  `provider_call_id` VARCHAR(150) DEFAULT NULL,
  `status` ENUM('pending', 'calling', 'answered', 'no_answer', 'busy', 'failed', 'completed') NOT NULL DEFAULT 'completed',
  `priority` ENUM('high', 'normal', 'low') NOT NULL DEFAULT 'high',
  `reason` TEXT DEFAULT NULL,
  `summary` TEXT NOT NULL,
  `next_step` VARCHAR(255) DEFAULT NULL,
  `transcript` LONGTEXT DEFAULT NULL,
  `owner_instruction` TEXT DEFAULT NULL,
  `duration` INT NOT NULL DEFAULT 0,
  `started_at` DATETIME DEFAULT NULL,
  `ended_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_calls_client` (`client_id`),
  INDEX `idx_calls_status` (`status`),
  INDEX `idx_calls_priority` (`priority`),
  CONSTRAINT `fk_calls_msg` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calls_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Action Tasks Table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `client_id` VARCHAR(36) DEFAULT NULL,
  `client_name` VARCHAR(100) DEFAULT NULL,
  `company` VARCHAR(150) DEFAULT NULL,
  `message_id` VARCHAR(36) DEFAULT NULL,
  `call_id` VARCHAR(36) DEFAULT NULL,
  `priority` ENUM('high', 'normal', 'low') NOT NULL DEFAULT 'normal',
  `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `due_date` VARCHAR(100) DEFAULT NULL,
  `source` ENUM('ai_analysis', 'owner_instruction', 'manual') NOT NULL DEFAULT 'ai_analysis',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tasks_status` (`status`),
  INDEX `idx_tasks_priority` (`priority`),
  CONSTRAINT `fk_tasks_msg` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_call` FOREIGN KEY (`call_id`) REFERENCES `calls` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `service` VARCHAR(50) NOT NULL,
  `event` VARCHAR(50) NOT NULL,
  `status` ENUM('success', 'failure', 'warning', 'info') NOT NULL DEFAULT 'info',
  `details` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_service` (`service`),
  INDEX `idx_audit_event` (`event`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Safe Initial Seed (Uses INSERT IGNORE - Never overwrites existing records)
-- ============================================================================

INSERT IGNORE INTO `settings` (
  `id`, `assistant_name`, `owner_name`, `owner_phone`, `owner_email`,
  `language`, `voice_style`, `call_threshold`, `quiet_hours_enabled`,
  `quiet_hours_start`, `quiet_hours_end`, `allow_high_priority_in_quiet_hours`,
  `mock_mode`
) VALUES (
  'default-settings-1', 'Arya', 'Naga', '+916382379565', 'naga@business.com',
  'Tamil', 'Natural Chennai conversational Tamil', 'high_only', 1,
  '22:00', '07:00', 1, 0
);

INSERT IGNORE INTO `users` (`id`, `name`, `email`, `phone`, `role`, `timezone`)
VALUES ('user-naga-1', 'Naga', 'naga@business.com', '+916382379565', 'owner', 'Asia/Kolkata');
