-- =====================================================================
-- 16_message_threads.sql — one model for help chat and file comments
-- Import: 17th. Requires: 02_employees.sql, 01_users.sql,
--          07_onboarding_tasks.sql, 08_task_files.sql
--
-- subject_type 'help'  = Need-Help topic thread.
-- subject_type 'file'  = HR comment pinned to a task (and exact file when
--                        file_id is set). The HR inbox and the employee chat
--                        read the same rows.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS message_threads (
  id            CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id   CHAR(36) NOT NULL COMMENT 'FK -> employees.id, owner',
  hr_id         CHAR(36) NULL COMMENT 'FK -> users.id; NULL means unassigned pool',
  subject_type  ENUM('help', 'file') NOT NULL,
  subject_title VARCHAR(255) NOT NULL,
  task_id       VARCHAR(64) NULL COMMENT 'onboarding_tasks.id for file threads (no FK: composite task keys cannot SET NULL; app keeps it consistent)',
  file_id       CHAR(36) NULL COMMENT 'FK -> task_files.id for exact-file threads',
  status        ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_threads_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_threads_hr FOREIGN KEY (hr_id)
    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_threads_file FOREIGN KEY (file_id)
    REFERENCES task_files (id) ON DELETE SET NULL,
  INDEX idx_threads_task (task_id),
  INDEX idx_threads_emp_status (employee_id, status),
  INDEX idx_threads_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
