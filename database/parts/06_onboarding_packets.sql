-- =====================================================================
-- 06_onboarding_packets.sql — one onboarding instance per employee
-- Import: 7th. Requires: 02_employees.sql, 04_onboarding_templates.sql
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS onboarding_packets (
  id                  CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id         CHAR(36) NOT NULL UNIQUE COMMENT 'FK -> employees.id, one packet each',
  template_id         CHAR(36) NULL COMMENT 'FK -> onboarding_templates.id, source set',
  welcome_message     TEXT     NULL,
  completion_pct      INT      NOT NULL DEFAULT 0 COMMENT 'Maintained by the app',
  orientation_watched TINYINT(1) NOT NULL DEFAULT 0,
  completed_at        TIMESTAMP NULL DEFAULT NULL COMMENT 'Set when completion hits 100',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_packets_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_packets_template FOREIGN KEY (template_id)
    REFERENCES onboarding_templates (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
