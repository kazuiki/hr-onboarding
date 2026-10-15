-- =====================================================================
-- 29_employee_medical_content.sql — per-hire Accredited Clinic details
-- Import: after 28_qr_login.sql. Requires: 02_employees.sql.
-- phpMyAdmin > Import > Go. Safe to re-run.
--
-- Model:
--   employee_medical_content — at most one row per hire (PK = employee_id).
--     Only the three rows inside the employee dashboard's
--     "Accredited Medical Clinic" card are editable per hire:
--     clinic name + address line, phone line, and hours line.
--     Hires without a row see DEFAULT_MEDICAL_CLINIC in lib/onboarding.ts.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS employee_medical_content (
  employee_id      CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'FK -> employees.id',
  clinic_name      VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Accredited clinic name',
  clinic_address   TEXT         NOT NULL COMMENT 'Street / building address shown after the name',
  clinic_phone     VARCHAR(64)  NOT NULL DEFAULT '' COMMENT 'Clinic contact number',
  clinic_hours     VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Clinic schedule line',
  updated_by       CHAR(36)     NULL COMMENT 'FK -> users.id, HR who last saved',
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_medical_content_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
