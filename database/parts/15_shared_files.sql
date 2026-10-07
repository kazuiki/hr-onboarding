-- =====================================================================
-- 15_shared_files.sql — company files HR shares with one employee
-- Import: 16th. Requires: 02_employees.sql, 01_users.sql (uploaded_by).
--
-- Powers the seven fixed HR -> employee download links:
--   form-data-privacy, form-manual-conforme, form-id-conforme,
--   form-code-conduct, form-comprehension, medical-referral,
-- plus any requirement slug (e.g. req-app-form) for the application form.
-- One row per (employee, slot); re-upload replaces the row. The matching
-- employee-side Download button is grey until its slot has a row here.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS shared_files (
  id          CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id CHAR(36) NOT NULL COMMENT 'FK -> employees.id, recipient',
  slot        VARCHAR(64) NOT NULL COMMENT 'form-data-privacy | … | medical-referral | <task slug>',
  file_name   VARCHAR(255) NOT NULL COMMENT 'Original filename',
  file_path   VARCHAR(500) NOT NULL COMMENT 'Web path, e.g. /uploads/<employee_id>/<file>',
  file_size   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Bytes',
  mime_type   VARCHAR(128) NOT NULL DEFAULT 'application/octet-stream',
  notes       TEXT NULL,
  uploaded_by CHAR(36) NULL COMMENT 'FK -> users.id, sharing HR user',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shared_files_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_shared_files_uploader FOREIGN KEY (uploaded_by)
    REFERENCES users (id) ON DELETE SET NULL,
  UNIQUE KEY uq_shared_files_emp_slot (employee_id, slot),
  INDEX idx_shared_files_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
