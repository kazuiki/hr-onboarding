-- =========================================================================
-- PART 05 : task_files + form_submissions (uploads, both sides)
-- Relationships: both tables -> onboarding_tasks.id + employees.id (CASCADE).
-- Flow: multi-file per requirement lives here (one row per file).
--       uploaded_by marks origin: 'employee' submissions vs 'hr' corrections.
--       form_submissions.form_data holds structured filled forms as JSON.
-- Requires: 04_packets_tasks.sql
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS task_files (
  id               CHAR(36)     NOT NULL PRIMARY KEY,
  task_id          VARCHAR(64)  NOT NULL,
  employee_id      CHAR(36)     NOT NULL,
  file_name        VARCHAR(255) NOT NULL,
  file_path        VARCHAR(500) NOT NULL COMMENT 'storage path or URL, e.g. uploads/{employee_id}/{file}',
  file_size        INT UNSIGNED NOT NULL COMMENT 'bytes',
  mime_type        VARCHAR(128) NOT NULL,
  status           ENUM('not_started','in_progress','submitted','needs_changes','approved') NOT NULL DEFAULT 'submitted',
  rejection_reason TEXT         NULL,
  uploaded_by      ENUM('employee','hr') NOT NULL DEFAULT 'employee',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_file_task FOREIGN KEY (task_id)
    REFERENCES onboarding_tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_file_emp FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_files_task (task_id),
  INDEX idx_files_emp (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS form_submissions (
  id           CHAR(36)    NOT NULL PRIMARY KEY,
  task_id      VARCHAR(64) NOT NULL,
  employee_id  CHAR(36)    NOT NULL,
  form_type    VARCHAR(64) NOT NULL COMMENT 'data-privacy | manual-conforme | id-conforme | code-conduct | comprehension',
  form_data    JSON        NOT NULL,
  status       ENUM('not_started','in_progress','submitted','needs_changes','approved') NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_form_task FOREIGN KEY (task_id)
    REFERENCES onboarding_tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_form_emp FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_forms_emp (employee_id)
) ENGINE=InnoDB;
