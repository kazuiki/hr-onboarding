-- =========================================================================
-- PART 09 : notifications (employee bell feed)
-- Relationships: user_id -> users.id (CASCADE); task_id optional link.
-- Flow: written by triggers (part 12) on approve/reject/chat.
--       link_section routes dashboard tabs:
--       pre_employment|photo|medical|first_day|privacy|forms|help.
-- Requires: 01_users.sql, 04_packets_tasks.sql (task link optional).
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS notifications (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      CHAR(36)  NOT NULL COMMENT 'recipient (employee users.id)',
  type         ENUM('rejection','approval','reminder','chat','general') NOT NULL,
  title        VARCHAR(255) NOT NULL,
  body         TEXT      NULL,
  link_section VARCHAR(32) NULL COMMENT 'dashboard tab id',
  task_id      VARCHAR(64) NULL,
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_task FOREIGN KEY (task_id)
    REFERENCES onboarding_tasks (id) ON DELETE SET NULL,
  INDEX idx_notif_user (user_id, is_read, created_at)
) ENGINE=InnoDB;
