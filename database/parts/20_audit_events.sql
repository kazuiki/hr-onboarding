-- =====================================================================
-- 20_audit_events.sql — append-only compliance log
-- Import: 21st. Requires: 01_users.sql
--
-- The app only ever INSERTs here. Never store file bytes, medical details
-- or passwords in details. History survives account deletion (SET NULL).
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS audit_events (
  id          CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  actor_id    CHAR(36) NULL COMMENT 'FK -> users.id',
  actor_name  VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Denormalized so the log reads without a join',
  actor_role  ENUM('hr_manager', 'hr_assistant', 'employee') NOT NULL,
  action      VARCHAR(64) NOT NULL COMMENT 'INVITE_EMPLOYEE | UPLOAD | APPROVE | REJECT | REMOVE_UPLOAD | CHAT_SEND | CHAT_REPLY | PRIVACY_ACK | MEDICAL_REVIEWED | FIRSTDAY_READY | LOGIN | LOGOUT | ARCHIVE_EMPLOYEE',
  target_type VARCHAR(64) NOT NULL COMMENT 'employee | task | file | thread | policy | template',
  target_id   VARCHAR(64) NULL,
  details     JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_events_actor FOREIGN KEY (actor_id)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_audit_events_actor (actor_id, created_at),
  INDEX idx_audit_events_action (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
