-- =====================================================================
-- 28_qr_login.sql — scan-with-phone approval tokens (QR "another way")
-- Import: after 27_email_otp.sql. Requires: 01_users.sql.
-- phpMyAdmin > Import > Go. Safe to re-run.
--
-- Model:
--   qr_login_tokens — one row per QR shown. The phone opens the encoded link
--     and taps Approve/Deny; the desktop polls until decided. Only the
--     SHA-256 hash is stored, never the raw token. Single-purpose rows:
--     approve/deny sets used_at, expiry is enforced on every check.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS qr_login_tokens (
  id           CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'UUID',
  user_id      CHAR(36)    NOT NULL COMMENT 'FK -> users.id',
  challenge_id CHAR(36)    NOT NULL COMMENT 'Login challenge awaiting approval',
  token_hash   CHAR(64)    NOT NULL COMMENT 'SHA-256 of the raw approve-link token',
  status       ENUM('pending', 'approved', 'denied') NOT NULL DEFAULT 'pending',
  used_at      TIMESTAMP   NULL DEFAULT NULL COMMENT 'Set when decided or consumed',
  expires_at   TIMESTAMP   NOT NULL COMMENT '3 minutes after the QR is shown',
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_qr_login_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_qr_login_challenge (challenge_id),
  INDEX idx_qr_login_token (token_hash),
  INDEX idx_qr_login_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
