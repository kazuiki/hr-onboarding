-- =========================================================================
-- PART 04 : onboarding_packets + onboarding_tasks (THE shared contract)
-- Relationships:
--   packets.employee_id -> employees.id (UNIQUE, CASCADE)
--   packets.template_id -> onboarding_templates.id (SET NULL)
--   tasks.packet_id     -> onboarding_packets.id (CASCADE)
--   tasks.employee_id   -> employees.id (CASCADE)
--   tasks.reviewed_by   -> users.id (SET NULL)
-- Flow: employee writes status='submitted' + files  -> HR review queue.
--       HR writes 'approved' -> progress. 'needs_changes'+feedback -> bell.
-- Task id holds the stable app slug (req-psa-birth) or a UUID.
-- Requires: 02_employees.sql, 03_templates.sql (template link optional).
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS onboarding_packets (
  id                  CHAR(36) NOT NULL PRIMARY KEY,
  employee_id         CHAR(36) NOT NULL UNIQUE,
  template_id         CHAR(36) NULL,
  welcome_message     TEXT     NULL,
  completion_pct      INT      NOT NULL DEFAULT 0 COMMENT 'maintained by trigger (12_triggers.sql)',
  orientation_watched TINYINT(1) NOT NULL DEFAULT 0,
  completed_at        TIMESTAMP NULL DEFAULT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_packet_emp FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_packet_tpl FOREIGN KEY (template_id)
    REFERENCES onboarding_templates (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id            VARCHAR(64)  NOT NULL PRIMARY KEY COMMENT 'stable slug (req-psa-birth) or UUID',
  packet_id     CHAR(36)     NOT NULL,
  employee_id   CHAR(36)     NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT         NULL,
  category      ENUM('welcome','form','photo','document','medical','first_day','privacy','help','completion') NOT NULL,
  status        ENUM('not_started','in_progress','submitted','needs_changes','approved') NOT NULL DEFAULT 'not_started',
  required      TINYINT(1)   NOT NULL DEFAULT 1,
  display_order INT          NOT NULL DEFAULT 0,
  has_download  TINYINT(1)   NOT NULL DEFAULT 0,
  file_name     VARCHAR(255) NULL COMMENT 'latest file label (detail rows in task_files, part 05)',
  feedback      TEXT         NULL COMMENT 'HR comment; bell alert source',
  submitted_at  TIMESTAMP    NULL DEFAULT NULL,
  reviewed_at   TIMESTAMP    NULL DEFAULT NULL,
  reviewed_by   CHAR(36)     NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_packet FOREIGN KEY (packet_id)
    REFERENCES onboarding_packets (id) ON DELETE CASCADE,
  CONSTRAINT fk_task_emp FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_task_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_tasks_emp_status (employee_id, status),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_packet (packet_id)
) ENGINE=InnoDB;
