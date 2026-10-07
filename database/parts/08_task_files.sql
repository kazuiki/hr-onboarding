-- =====================================================================
-- 08_task_files.sql — uploaded file metadata (documents and ID photos)
-- Import: 9th. Requires: 07_onboarding_tasks.sql, 02_employees.sql
--
-- One row per file; several files may belong to one requirement.
-- Only metadata and the storage path live here — byte content lives on
-- disk under public/uploads/<employee_id>/ (see the /api/uploads route).
-- uploaded_by marks the origin: employee submission vs HR correction.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS task_files (
  id               CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'UUID',
  task_id          VARCHAR(64)  NOT NULL COMMENT 'FK -> onboarding_tasks.id',
  employee_id      CHAR(36)     NOT NULL COMMENT 'FK -> employees.id, owner',
  file_name        VARCHAR(255) NOT NULL COMMENT 'Original client filename',
  file_path        VARCHAR(500) NOT NULL COMMENT 'Web path, e.g. /uploads/<employee_id>/<file>',
  file_size        INT UNSIGNED NOT NULL COMMENT 'Bytes',
  mime_type        VARCHAR(128) NOT NULL,
  status           ENUM('not_started', 'in_progress', 'submitted', 'needs_changes', 'approved') NOT NULL DEFAULT 'submitted',
  rejection_reason TEXT         NULL,
  uploaded_by      ENUM('employee', 'hr') NOT NULL DEFAULT 'employee',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_files_task FOREIGN KEY (task_id, employee_id)
    REFERENCES onboarding_tasks (id, employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_task_files_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_task_files_task (task_id),
  INDEX idx_task_files_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
