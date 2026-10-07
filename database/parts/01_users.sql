-- =====================================================================
-- 01_users.sql — login accounts (employees and HR administrators)
-- Import: 2nd, after 00_database.sql. No dependencies.
--
-- One row per person. `role` decides which portal the app sends them to:
--   employee    -> /dashboard
--   hr_manager  -> /hr (full administration)
--   hr_assistant-> /hr (review and messaging; no destructive actions)
--
-- Passwords are SHA2-256 hex digests. The app never stores or logs plain
-- passwords. Login check used by the server:
--   SELECT id, role, full_name, is_active FROM users
--   WHERE email = ? AND password_hash = SHA2(?, 256);
-- For production, re-hash with bcrypt/argon2 in the application layer and
-- store the result here instead of SHA2.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'UUID',
  email         VARCHAR(255) NOT NULL UNIQUE COMMENT 'Login identity',
  password_hash CHAR(64)     NOT NULL COMMENT 'SHA2(password, 256) hex; bcrypt in production',
  role          ENUM('hr_manager', 'hr_assistant', 'employee') NOT NULL DEFAULT 'employee',
  full_name     VARCHAR(255) NOT NULL,
  avatar_url    TEXT         NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '0 disables login without deleting history',
  last_login_at TIMESTAMP    NULL DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
