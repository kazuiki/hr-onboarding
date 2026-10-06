-- =========================================================================
-- PART 08 : message_threads + messages (ONE model for both chats)
-- Relationships:
--   threads.employee_id -> employees.id (CASCADE)
--   threads.hr_id       -> users.id (SET NULL, unassigned pool)
--   threads.task_id     -> onboarding_tasks.id (SET NULL, file threads)
--   threads.file_id     -> task_files.id (SET NULL, exact-file threads)
--   messages.thread_id  -> message_threads.id (CASCADE)
--   messages.sender_id  -> users.id (CASCADE)
-- Flow: help  = Need Help messenger (subject thread per topic).
--       file  = HR "Message" button on a review row (per-file thread).
--       Admin inbox (/hr/messages) and employee chat read the same rows.
-- Requires: 02_employees.sql, 04_packets_tasks.sql, 05_files.sql
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS message_threads (
  id            CHAR(36) NOT NULL PRIMARY KEY,
  employee_id   CHAR(36) NOT NULL,
  hr_id         CHAR(36) NULL COMMENT 'assigned HR; NULL = unassigned pool',
  subject_type  ENUM('help','file') NOT NULL,
  subject_title VARCHAR(255) NOT NULL,
  task_id       VARCHAR(64) NULL,
  file_id       CHAR(36) NULL,
  status        ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_thread_emp FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_thread_hr FOREIGN KEY (hr_id)
    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_thread_task FOREIGN KEY (task_id)
    REFERENCES onboarding_tasks (id) ON DELETE SET NULL,
  CONSTRAINT fk_thread_file FOREIGN KEY (file_id)
    REFERENCES task_files (id) ON DELETE SET NULL,
  INDEX idx_threads_emp (employee_id, status),
  INDEX idx_threads_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  thread_id   CHAR(36)  NOT NULL,
  sender_id   CHAR(36)  NOT NULL,
  sender_role ENUM('employee','hr') NOT NULL,
  body        TEXT      NOT NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_thread FOREIGN KEY (thread_id)
    REFERENCES message_threads (id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_msg_thread (thread_id, created_at)
) ENGINE=InnoDB;
