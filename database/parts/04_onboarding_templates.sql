-- =====================================================================
-- 04_onboarding_templates.sql — reusable requirement sets defined by HR
-- Import: 5th. Requires: 01_users.sql (created_by only).
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS onboarding_templates (
  id          CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'UUID',
  name        VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  department  VARCHAR(255) NULL COMMENT 'NULL means usable for every department',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_by  CHAR(36)     NULL COMMENT 'FK -> users.id, authoring HR user',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_templates_author FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_templates_dept_active (department, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
