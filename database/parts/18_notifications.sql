-- =====================================================================
-- 18_notifications.sql — employee bell feed
-- Import: 19th. Requires: 01_users.sql, 07_onboarding_tasks.sql (link only).
--
-- Written by the app on approvals, rejections, chat replies and shared
-- files. link_section routes the dashboard tab: pre_employment | photo |
-- medical | first_day | privacy | forms | help.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS notifications (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      CHAR(36)  NOT NULL COMMENT 'Recipient FK -> users.id',
  type         ENUM('rejection', 'approval', 'reminder', 'chat', 'general') NOT NULL,
  title        VARCHAR(255) NOT NULL,
  body         TEXT      NULL,
  link_section VARCHAR(32) NULL COMMENT 'Dashboard tab id for deep-linking',
  task_id      VARCHAR(64) NULL COMMENT 'Related task slug (no FK: survives task cleanup)',
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
