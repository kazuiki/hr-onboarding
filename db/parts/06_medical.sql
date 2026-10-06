-- =========================================================================
-- PART 06 : medical_records (one row per employee)
-- Relationship: employee_id -> employees.id (UNIQUE, CASCADE).
-- Flow: employee taps "Mark Medical Section as Reviewed" -> status submitted.
--       Clinic sends results -> HR sets approved / needs_changes + feedback.
-- Requires: 02_employees.sql
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS medical_records (
  id                CHAR(36) NOT NULL PRIMARY KEY,
  employee_id       CHAR(36) NOT NULL UNIQUE,
  clinic_name       VARCHAR(255) NOT NULL DEFAULT 'Clinica Manila',
  clinic_address    TEXT     NULL,
  clinic_phone      VARCHAR(64) NULL,
  clinic_schedule   VARCHAR(255) NULL,
  expense_notes     TEXT     NULL,
  referral_doc_path VARCHAR(500) NULL,
  proof_doc_path    VARCHAR(500) NULL,
  status            ENUM('not_started','in_progress','submitted','needs_changes','approved') NOT NULL DEFAULT 'not_started',
  feedback          TEXT     NULL,
  reviewed_by       CHAR(36) NULL,
  reviewed_at       TIMESTAMP NULL DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_med_emp FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_med_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;
