-- =====================================================================
-- 27_email_otp.sql — emailed sign-in codes (6 digits, 3-minute expiry)
-- Import: after 26_two_factor.sql. Requires: 01_users.sql.
-- phpMyAdmin > Import > Go. Safe to re-run.
--
-- Model:
--   email_otp_codes — one row per sent code, bound to the login challenge
--     that requested it. Only the SHA-256 hash is stored, never the code.
--     Rows are single-purpose: a successful verify or 5 wrong guesses burns
--     the row (used_at set), and expiry is enforced on every check.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS email_otp_codes (
  id           CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'UUID',
  user_id      CHAR(36)    NOT NULL COMMENT 'FK -> users.id',
  challenge_id CHAR(36)    NOT NULL COMMENT 'Login challenge that requested this code',
  code_hash    CHAR(64)    NOT NULL COMMENT 'SHA-256 of the 6-digit code',
  attempts     TINYINT     NOT NULL DEFAULT 0 COMMENT 'Wrong guesses; burned at 5',
  used_at      TIMESTAMP   NULL DEFAULT NULL COMMENT 'Set on success, burn, or supersede',
  expires_at   TIMESTAMP   NOT NULL COMMENT '3 minutes after send',
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_otp_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_email_otp_user (user_id),
  INDEX idx_email_otp_challenge (challenge_id),
  INDEX idx_email_otp_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
