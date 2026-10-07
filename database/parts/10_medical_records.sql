-- =====================================================================
-- 10_medical_records.sql — sensitive pre-employment medical data (1:1)
-- Import: 11th. Requires: 02_employees.sql, 01_users.sql (reviewed_by).
--
-- Visible only to the owning employee and HR roles. The app must never
-- log proof paths or expose these rows in list endpoints.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS medical_records (
  id                CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id       CHAR(36) NOT NULL UNIQUE COMMENT 'FK -> employees.id',
  clinic_name       VARCHAR(255) NOT NULL DEFAULT 'Hi-Precision Diagnostic Center',
  clinic_address    TEXT     NULL,
  clinic_phone      VARCHAR(64) NULL,
  clinic_schedule   VARCHAR(255) NULL,
  expense_notes     TEXT     NULL,
  referral_doc_path VARCHAR(500) NULL COMMENT 'HR-shared referral slip path',
  proof_doc_path    VARCHAR(500) NULL COMMENT 'Employee proof path (sensitive)',
  status            ENUM('not_started', 'in_progress', 'submitted', 'needs_changes', 'approved') NOT NULL DEFAULT 'not_started',
  feedback          TEXT     NULL,
  reviewed_by       CHAR(36) NULL COMMENT 'FK -> users.id, reviewing HR user',
  reviewed_at       TIMESTAMP NULL DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_medical_records_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_medical_records_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
