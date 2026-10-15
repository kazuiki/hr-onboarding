-- =====================================================================
-- 23_first_day_checklist.sql — per-hire first-day orientation checks
-- Import: 24th. Requires: 02_employees.sql.
--
-- One row per (employee, item_key); the hire toggles items in the
-- dashboard First Day section and each toggle upserts its row, so checks
-- survive refresh and HR sees them per hire. Wiping an employee cascades.
-- item_key values live in FIRST_DAY_CHECKLIST_ITEMS (lib/onboarding.ts).
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS first_day_checklist (
  employee_id CHAR(36)    NOT NULL COMMENT 'FK -> employees.id, owner',
  item_key    VARCHAR(64) NOT NULL COMMENT 'Stable slug, e.g. hr-orientation',
  is_checked  TINYINT(1)  NOT NULL DEFAULT 0,
  checked_at  TIMESTAMP   NULL DEFAULT NULL,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id, item_key),
  CONSTRAINT fk_first_day_checklist_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_first_day_checklist_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
