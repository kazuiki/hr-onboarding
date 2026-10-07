-- =====================================================================
-- 17_messages.sql — chat rows
-- Import: 18th. Requires: 16_message_threads.sql, 01_users.sql
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS messages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  thread_id   CHAR(36)  NOT NULL COMMENT 'FK -> message_threads.id',
  sender_id   CHAR(36)  NOT NULL COMMENT 'FK -> users.id',
  sender_role ENUM('employee', 'hr') NOT NULL,
  body        TEXT      NOT NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id)
    REFERENCES message_threads (id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_messages_thread (thread_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
