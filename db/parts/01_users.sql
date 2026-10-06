-- =========================================================================
-- PART 01 : users (accounts)
-- One row per human. Role routes portals: employee -> /dashboard, HR -> /hr.
-- employees.id reuses users.id (1:1, mirrors Supabase profiles pattern).
-- Passwords: SHA2-256 hex. Login check:
--   SELECT id, role FROM users WHERE email = ? AND password_hash = SHA2(?, 256)
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)      NOT NULL PRIMARY KEY COMMENT 'UUID; doubles as employees.id',
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash CHAR(64)      NOT NULL COMMENT 'SHA2(password,256) hex',
  role          ENUM('hr_manager','hr_assistant','employee') NOT NULL DEFAULT 'employee',
  full_name     VARCHAR(255)  NOT NULL,
  avatar_url    TEXT          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
