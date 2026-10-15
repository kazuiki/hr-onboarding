-- =====================================================================
-- 01_users.sql — login accounts (employees and HR administrators)
-- Import: 2nd, after 00_database.sql. No dependencies.
--
-- One row per person. `role` decides which portal the app sends them to:
--   employee    -> /dashboard
--   hr_manager  -> /hr (full administration)
--   hr_assistant-> /hr (review and messaging; no destructive actions)
--
-- Passwords are scrypt hashes (`scrypt$<saltHex>$<hashHex>`) made by the app.
-- The app never stores or logs plain passwords. Login verification runs in
-- the application layer (lib/password.ts). Old school-build rows may still
-- hold bare SHA2-256 hex; those verify once, then upgrade to scrypt on login.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'UUID',
  email         VARCHAR(255) NOT NULL UNIQUE COMMENT 'Login identity',
  password_hash VARCHAR(255) NOT NULL COMMENT 'scrypt hash from lib/password.ts',
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
