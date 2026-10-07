-- =====================================================================
-- 02_employees.sql — HR-owned employment profile (one per hire)
-- Import: 3rd. Requires: 01_users.sql
--
-- employees.id reuses users.id (shared primary key, 1:1). Deleting the user
-- cascades here. Day-to-day offboarding is a soft archive instead:
--   status = 'archived', archived_at = NOW()  (history is kept)
--
-- access_window_days bounds portal access to ±N days around start_date.
-- completion_pct and orientation_watched are maintained by the app when
-- tasks change; HR never edits them by hand.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS employees (
  id                  CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'FK -> users.id',
  employee_number     VARCHAR(32)  NOT NULL UNIQUE COMMENT 'Company ID, e.g. PKI-2026-0842',
  position            VARCHAR(255) NOT NULL,
  department          VARCHAR(255) NOT NULL,
  manager_name        VARCHAR(255) NOT NULL,
  start_date          DATE         NOT NULL,
  access_window_days  INT          NOT NULL DEFAULT 30,
  status              ENUM('active', 'completed', 'archived') NOT NULL DEFAULT 'active',
  avatar_url          TEXT         NULL,
  welcome_message     TEXT         NULL,
  completion_pct      INT          NOT NULL DEFAULT 0,
  orientation_watched TINYINT(1)   NOT NULL DEFAULT 0,
  notes               TEXT         NULL COMMENT 'Internal HR notes, never shown to the employee',
  archived_at         TIMESTAMP    NULL DEFAULT NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_employees_user FOREIGN KEY (id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_employees_number (employee_number),
  INDEX idx_employees_dept_status (department, status),
  INDEX idx_employees_start (start_date),
  INDEX idx_employees_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
