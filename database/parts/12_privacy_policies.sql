-- =====================================================================
-- 12_privacy_policies.sql — versioned data-privacy notice text
-- Import: 13th. Requires: 01_users.sql (created_by only).
--
-- New regulation? Insert a new version row and flip is_current. Old rows
-- stay so past acknowledgements still pin the exact text version read.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS privacy_policies (
  id             CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  version        VARCHAR(32) NOT NULL UNIQUE COMMENT 'e.g. PKI-DP-2026-V3',
  title          VARCHAR(255) NOT NULL,
  content        MEDIUMTEXT NOT NULL COMMENT 'Full notice text',
  effective_date DATE NOT NULL,
  is_current     TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = shown to employees now',
  created_by     CHAR(36) NULL COMMENT 'FK -> users.id, publishing HR user',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_privacy_policies_author FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_privacy_policies_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
