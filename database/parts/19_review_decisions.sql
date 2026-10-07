-- =====================================================================
-- 19_review_decisions.sql — explicit approve/reject history
-- Import: 20th. Requires: 07_onboarding_tasks.sql, 02_employees.sql,
--          01_users.sql (reviewer), 08_task_files.sql (file pin).
--
-- onboarding_tasks keeps only the latest status; this table keeps EVERY
-- decision with reviewer, timestamp and comment — the audit history shown
-- beside each submission.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS review_decisions (
  id          CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  task_id     VARCHAR(64) NOT NULL COMMENT 'Task slug',
  employee_id CHAR(36) NOT NULL COMMENT 'FK -> employees.id, submission owner',
  file_id     CHAR(36) NULL COMMENT 'FK -> task_files.id, exact file reviewed',
  reviewer_id CHAR(36) NULL COMMENT 'FK -> users.id; SET NULL keeps history',
  decision    ENUM('approved', 'needs_changes') NOT NULL,
  comment     TEXT NULL COMMENT 'HR feedback; required when needs_changes',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_decisions_task FOREIGN KEY (task_id, employee_id)
    REFERENCES onboarding_tasks (id, employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_decisions_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_review_decisions_file FOREIGN KEY (file_id)
    REFERENCES task_files (id) ON DELETE SET NULL,
  CONSTRAINT fk_review_decisions_reviewer FOREIGN KEY (reviewer_id)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_review_decisions_task (task_id, created_at),
  INDEX idx_review_decisions_employee (employee_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
