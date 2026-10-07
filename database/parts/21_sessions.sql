-- =====================================================================
-- 21_sessions.sql — server login sessions (httpOnly cookie tokens)
-- Import: 22nd. Requires: 01_users.sql
--
-- The app creates one row per sign-in and deletes it on sign-out or
-- expiry. The token stored here is the session cookie value; it is random
-- 128-bit hex, single-purpose, and useless after expires_at passes.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS sessions (
  token      CHAR(64)    NOT NULL PRIMARY KEY COMMENT 'Random session token (cookie value)',
  user_id    CHAR(36)    NOT NULL COMMENT 'FK -> users.id',
  expires_at TIMESTAMP   NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
