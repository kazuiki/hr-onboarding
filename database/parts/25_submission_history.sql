-- =====================================================================
-- 25_submission_history.sql — permanent per-hire submission log
-- Import: 26th. Requires: 02_employees.sql.
--
-- One row per submitted or removed file (plus one row per online form
-- answer set). Rows are append-only: removing an uploaded file deletes its
-- task_files row but NEVER its history rows, so the History page keeps the
-- full record. item_label snapshots the title at submit time.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS submission_history (
  id          CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id CHAR(36)    NOT NULL COMMENT 'FK -> employees.id, owner',
  item_kind   ENUM('requirement', 'form') NOT NULL COMMENT 'Task upload or online form',
  item_key    VARCHAR(64) NOT NULL COMMENT 'Task slug or form_type',
  item_label  VARCHAR(255) NOT NULL COMMENT 'Title snapshot at submit time',
  category    VARCHAR(32) NOT NULL DEFAULT 'document' COMMENT 'Task category, or form',
  file_name   VARCHAR(255) NULL COMMENT 'Original filename; NULL for answer-only forms',
  file_path   VARCHAR(500) NULL COMMENT 'Storage path snapshot; NULL when no file',
  action      ENUM('upload', 'remove') NOT NULL DEFAULT 'upload',
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_submission_history_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_submission_history_employee (employee_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
