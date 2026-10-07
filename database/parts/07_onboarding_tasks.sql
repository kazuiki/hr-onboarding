-- =====================================================================
-- 07_onboarding_tasks.sql — per-employee checklist and HR review queue
-- Import: 8th. Requires: 06_onboarding_packets.sql, 02_employees.sql,
--          01_users.sql (reviewed_by).
--
-- Status machine (enforced by the app, values constrained here):
--   not_started -> in_progress -> submitted -> approved
--                                          -> needs_changes -> submitted...
-- Employees may only move their own rows to in_progress/submitted.
-- Only HR may set approved/needs_changes with feedback.
--
-- template_file_name holds the HR-shared blank form. The employee Download
-- button is enabled only when it is set; otherwise the button renders grey.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id                 VARCHAR(64)  NOT NULL COMMENT 'Stable slug, e.g. req-psa-birth',
  packet_id          CHAR(36)     NOT NULL COMMENT 'FK -> onboarding_packets.id',
  employee_id        CHAR(36)     NOT NULL COMMENT 'FK -> employees.id, owner',
  title              VARCHAR(255) NOT NULL,
  description        TEXT         NULL,
  category           ENUM('welcome', 'form', 'photo', 'document', 'medical', 'first_day', 'privacy', 'help', 'completion') NOT NULL,
  status             ENUM('not_started', 'in_progress', 'submitted', 'needs_changes', 'approved') NOT NULL DEFAULT 'not_started',
  required           TINYINT(1)   NOT NULL DEFAULT 1,
  display_order      INT          NOT NULL DEFAULT 0,
  has_download       TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 shows a Download control when a template file exists',
  template_file_name VARCHAR(255) NULL COMMENT 'HR-shared blank form filename; NULL means Download stays grey',
  template_file_path VARCHAR(500) NULL COMMENT 'Storage path of the HR-shared file',
  file_name          VARCHAR(255) NULL COMMENT 'Latest employee submission label',
  feedback           TEXT         NULL COMMENT 'Latest HR comment',
  submitted_at       TIMESTAMP    NULL DEFAULT NULL,
  reviewed_at        TIMESTAMP    NULL DEFAULT NULL,
  reviewed_by        CHAR(36)     NULL COMMENT 'FK -> users.id, reviewing HR user',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id, employee_id),
  CONSTRAINT fk_tasks_packet FOREIGN KEY (packet_id)
    REFERENCES onboarding_packets (id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_tasks_emp_status (employee_id, status),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_packet (packet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
