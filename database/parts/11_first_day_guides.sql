-- =====================================================================
-- 11_first_day_guides.sql — per-employee first-day content (1:1)
-- Import: 12th. Requires: 02_employees.sql
--
-- Defaults are seeded from company_settings so arrival time, dress code
-- and office details stay editable data instead of hard-coded strings.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS first_day_guides (
  id               CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id      CHAR(36) NOT NULL UNIQUE COMMENT 'FK -> employees.id',
  office_name      VARCHAR(255) NOT NULL DEFAULT 'Corporate Headquarters',
  office_address   TEXT         NOT NULL,
  arrival_time     VARCHAR(64)  NOT NULL DEFAULT '8:00 AM',
  dress_code       VARCHAR(255) NOT NULL DEFAULT 'Smart-Casual',
  reporting_to     VARCHAR(255) NOT NULL DEFAULT 'HR Reception',
  items_to_bring   JSON         NULL COMMENT 'Array of strings',
  intro_video_url  TEXT         NULL,
  map_instructions TEXT         NULL,
  is_acknowledged  TINYINT(1)   NOT NULL DEFAULT 0,
  acknowledged_at  TIMESTAMP    NULL DEFAULT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_first_day_guides_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
