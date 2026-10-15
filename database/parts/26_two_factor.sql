-- =====================================================================
-- 26_two_factor.sql — authenticator-app 2FA (TOTP) per user ID
-- Import: after 25_submission_history.sql. Requires: 01_users.sql.
-- Run as a privileged user (ALTER needs more than the app's app user).
-- phpMyAdmin > Import > Go. Safe to re-run (ADD COLUMN IF NOT EXISTS is
-- emulated via INFORMATION_SCHEMA checks for older MySQL).
--
-- Model:
--   users.totp_secret / totp_enabled — one authenticator secret per user ID.
--     The secret is sensitive like a password hash: DB access bypasses 2FA.
--   two_factor_challenges — short-lived login/enrollment challenges (10 min).
--     The client holds only the random id; the secret never leaves the server
--     until enrollment is confirmed.
--   (30_drop_dead_2fa_tables.sql removes the retired remember-device and
--   backup-code tables from existing databases.)
-- =====================================================================
USE hr_onboarding;

SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'hr_onboarding' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'totp_secret'
);
SET @add_totp := IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN totp_secret TEXT NULL COMMENT ''Base32 TOTP secret, one per user ID'' AFTER password_hash,
   ADD COLUMN totp_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''1 once enrollment is confirmed'' AFTER totp_secret,
   ADD COLUMN totp_enabled_at TIMESTAMP NULL DEFAULT NULL AFTER totp_enabled',
  'SELECT ''users.totp columns already present''');
PREPARE stmt_add_totp FROM @add_totp;
EXECUTE stmt_add_totp;
DEALLOCATE PREPARE stmt_add_totp;

CREATE TABLE IF NOT EXISTS two_factor_challenges (
  id         CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'Random challenge id handed to the client',
  user_id    CHAR(36)    NOT NULL COMMENT 'FK -> users.id',
  purpose    ENUM('login', 'enroll') NOT NULL COMMENT 'login = post-password step-up, enroll = pending setup secret',
  secret     TEXT        NULL COMMENT 'Pending TOTP secret (enroll only, never for login)',
  expires_at TIMESTAMP   NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_2fa_challenge_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_2fa_challenge_user (user_id),
  INDEX idx_2fa_challenge_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
