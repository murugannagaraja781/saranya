-- ============================================================================
-- Naga AI Assistant (Saranya) — MySQL Database Schema
-- Character Set: utf8mb4 (Full Unicode & Tamil Script Support)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `saranya_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `saranya_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
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
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `assistant_name` VARCHAR(50) NOT NULL DEFAULT 'Arya',
  `owner_name` VARCHAR(100) NOT NULL DEFAULT 'Naga',
  `owner_phone` VARCHAR(30) NOT NULL DEFAULT '+916382379565',
  `owner_email` VARCHAR(150) NOT NULL DEFAULT 'naga@example.com',
  `language` VARCHAR(30) NOT NULL DEFAULT 'Tamil',
  `voice_style` VARCHAR(100) NOT NULL DEFAULT 'Natural Chennai conversational Tamil',
  `call_threshold` ENUM('high_only', 'high_and_normal', 'all') NOT NULL DEFAULT 'high_only',
  `quiet_hours_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `quiet_hours_start` VARCHAR(10) NOT NULL DEFAULT '22:00',
  `quiet_hours_end` VARCHAR(10) NOT NULL DEFAULT '07:00',
  `allow_high_priority_in_quiet_hours` TINYINT(1) NOT NULL DEFAULT 1,
  `mock_mode` TINYINT(1) NOT NULL DEFAULT 1,
  `gemini_api_key` VARCHAR(255) DEFAULT NULL,
  `vobiz_auth_id` VARCHAR(100) DEFAULT NULL,
  `vobiz_auth_token` VARCHAR(100) DEFAULT NULL,
  `vobiz_number` VARCHAR(30) DEFAULT '+914400000000',
  `snapserve_api_key` VARCHAR(255) DEFAULT NULL,
  `snapserve_agent_id` VARCHAR(100) DEFAULT NULL,
  `n8n_webhook_secret` VARCHAR(100) DEFAULT 'dev_n8n_secret_token_12345',
  `whatsapp_verify_token` VARCHAR(100) DEFAULT 'dev_whatsapp_verify_token_12345',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Clients Table
DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
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
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
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
DROP TABLE IF EXISTS `ai_analyses`;
CREATE TABLE `ai_analyses` (
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
DROP TABLE IF EXISTS `calls`;
CREATE TABLE `calls` (
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
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
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
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
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
-- Seed Initial Records
-- ============================================================================

-- Seed Default Settings
INSERT INTO `settings` (
  `id`, `assistant_name`, `owner_name`, `owner_phone`, `owner_email`,
  `language`, `voice_style`, `call_threshold`, `quiet_hours_enabled`,
  `quiet_hours_start`, `quiet_hours_end`, `allow_high_priority_in_quiet_hours`,
  `mock_mode`, `n8n_webhook_secret`, `whatsapp_verify_token`
) VALUES (
  'default-settings-1', 'Arya', 'Naga', '+916382379565', 'naga@business.com',
  'Tamil', 'Natural Chennai conversational Tamil', 'high_only', 1,
  '22:00', '07:00', 1,
  1, 'dev_n8n_secret_token_12345', 'dev_whatsapp_verify_token_12345'
);

-- Seed Default User
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `role`, `timezone`)
VALUES ('user-naga-1', 'Naga', 'naga@business.com', '+916382379565', 'owner', 'Asia/Kolkata');

-- Seed Sample Clients
INSERT INTO `clients` (`id`, `name`, `company`, `email`, `phone`, `whatsapp`, `total_messages`, `total_calls`, `notes`)
VALUES
('client-1', 'Ramesh Kumar', 'ABC Traders', 'ramesh@abctraders.com', '+919840123456', '+919840123456', 3, 2, 'Key supplier client in Chennai.'),
('client-2', 'Priya Sundaram', 'Apex Retail Solutions', 'priya@apexretail.com', '+919840999888', '+919840999888', 2, 1, 'Contract renewal pending.'),
('client-3', 'Suresh Babu', 'Modern Logistics', 'suresh@modernlogistics.in', '+919840777666', '+919840777666', 1, 1, 'Delivery inquiries.');

-- Seed Sample Message 1 (Quotation approved with installment request)
INSERT INTO `messages` (`id`, `client_id`, `client_name`, `company`, `channel`, `subject`, `message`, `clean_message`, `received_at`, `status`, `source_message_id`)
VALUES (
  'msg-seed-1', 'client-1', 'Ramesh Kumar', 'ABC Traders', 'email',
  'Quotation Approved - Payment Terms Discussion',
  'Dear Naga,\n\nWe have reviewed the quotation you sent yesterday. We are happy with the pricing and we approve it. However, we request to make the payment in 2 installments (50% advance, 50% on completion). Please confirm by tomorrow.\n\nThanks,\nRamesh',
  'We have reviewed the quotation you sent yesterday. We are happy with the pricing and we approve it. However, we request to make the payment in 2 installments (50% advance, 50% on completion). Please confirm by tomorrow.',
  DATE_SUB(NOW(), INTERVAL 2 HOUR), 'called', 'gmail-msg-001'
);

-- Seed AI Analysis for Message 1
INSERT INTO `ai_analyses` (`id`, `message_id`, `should_call`, `client_name`, `company`, `client_contact`, `channel`, `priority`, `summary`, `next_step`, `deadline`, `reason`, `category`)
VALUES (
  'analysis-seed-1', 'msg-seed-1', 1, 'Ramesh Kumar', 'ABC Traders', '+919840123456', 'email', 'high',
  'ரமேஷ் குமார், ABC Traders quotation-அ OK பண்ணிட்டாரு. ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாரு. நாளைக்குள்ள நீங்க confirm பண்ணணும்.',
  'Confirm two installment payment arrangement.',
  'Tomorrow',
  'Quotation approved with split payment request requiring owner decision.',
  'payment'
);

-- Seed Call Record for Message 1
INSERT INTO `calls` (`id`, `message_id`, `client_id`, `client_name`, `channel`, `phone_number`, `provider`, `provider_call_id`, `status`, `priority`, `reason`, `summary`, `next_step`, `transcript`, `owner_instruction`, `duration`, `started_at`, `ended_at`)
VALUES (
  'call-seed-1', 'msg-seed-1', 'client-1', 'Ramesh Kumar', 'email', '+916382379565', 'mock', 'mock-call-101', 'completed', 'high',
  'Payment installment approval required',
  'ரமேஷ் குமார், ABC Traders quotation-அ OK பண்ணிட்டாரு. ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாரு. நாளைக்குள்ள நீங்க confirm பண்ணணும்.',
  'Confirm two installment payment arrangement.',
  'Arya: "வணக்கம் Naga! நான் Arya. உங்க client Ramesh Kumar கிட்ட இருந்து Email-ல ஒரு முக்கியமான reply வந்திருக்கு."\n\nArya: "ரமேஷ் குமார், ABC Traders quotation-அ OK பண்ணிட்டாரு. ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாரு. நாளைக்குள்ள நீங்க confirm பண்ணணும்."\n\nArya: "இதுக்கு நான் என்ன note பண்ணணும்?"\n\nNaga: "Two installment okay என்று note பண்ணு."\n\nArya: "சரி Naga. \"Two installment okay என்று note பண்ணு.\"-ன்னு note பண்ணிட்டேன். Bye."',
  'Two installment okay என்று note பண்ணு.',
  42, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 59 MINUTE)
);

-- Seed Task from Call
INSERT INTO `tasks` (`id`, `title`, `description`, `client_id`, `client_name`, `company`, `message_id`, `call_id`, `priority`, `status`, `due_date`, `source`)
VALUES (
  'task-seed-1',
  'Confirm 2 installment payment to Ramesh Kumar',
  'Instruction from Naga: Two installment okay என்று note பண்ணு.',
  'client-1', 'Ramesh Kumar', 'ABC Traders', 'msg-seed-1', 'call-seed-1', 'high', 'pending', 'Tomorrow', 'owner_instruction'
);

-- Seed Sample Audit Log
INSERT INTO `audit_logs` (`id`, `service`, `event`, `status`, `details`)
VALUES (
  'audit-seed-1', 'SaranyaBackend', 'message_received', 'success',
  JSON_OBJECT('messageId', 'msg-seed-1', 'channel', 'email', 'client', 'Ramesh Kumar', 'callTriggered', true)
);
