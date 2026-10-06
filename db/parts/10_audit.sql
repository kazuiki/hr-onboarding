-- =========================================================================
-- PART 10 : audit_events (append-only compliance log)
-- Relationship: actor_id -> users.id (SET NULL, history survives deletion).
-- Flow: app writes one row per UPLOAD | APPROVE | REJECT | FILE_MESSAGE |
--       CHAT_SEND | CHAT_REPLY | PRIVACY_ACK | MEDICAL_REVIEWED |
--       FIRSTDAY_READY | INVITE_EMPLOYEE | LOGIN. Read at /hr/audit-log.
-- Requires: 01_users.sql
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS audit_events (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  actor_id    CHAR(36) NULL,
  actor_role  ENUM('hr_manager','hr_assistant','employee') NOT NULL,
  action      VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id   VARCHAR(64) NULL,
  details     JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_audit_actor (actor_id, created_at),
  INDEX idx_audit_action (action, created_at)
) ENGINE=InnoDB;
