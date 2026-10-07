-- =====================================================================
-- 09_form_submissions.sql — structured online employment forms
-- Import: 10th. Requires: 07_onboarding_tasks.sql, 02_employees.sql
--
-- Covers Data Privacy, Manual Conforme, Company ID Conforme, Code of
-- Conduct and Comprehension Test. form_data holds the filled answers as
-- JSON. Resubmits insert new rows so HR keeps version history.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS form_submissions (
  id           CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'UUID',
  task_id      VARCHAR(64) NOT NULL COMMENT 'FK -> onboarding_tasks.id',
  employee_id  CHAR(36)    NOT NULL COMMENT 'FK -> employees.id, owner',
  form_type    VARCHAR(64) NOT NULL COMMENT 'data-privacy | manual-conforme | id-conforme | code-conduct | comprehension',
  form_data    JSON        NOT NULL COMMENT 'Filled answers object',
  status       ENUM('not_started', 'in_progress', 'submitted', 'needs_changes', 'approved') NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_form_submissions_task FOREIGN KEY (task_id, employee_id)
    REFERENCES onboarding_tasks (id, employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_form_submissions_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_form_submissions_employee (employee_id),
  INDEX idx_form_submissions_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
