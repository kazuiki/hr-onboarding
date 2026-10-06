-- =========================================================================
-- PART 02 : employees (HR-owned profile)
-- Relationship: employees.id -> users.id (1:1, ON DELETE CASCADE).
-- Flow: HR Invite (admin) INSERTs users + employees rows.
--       Employee login reads packet + tasks for this id.
-- Requires: 01_users.sql
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS employees (
  id                  CHAR(36)     NOT NULL PRIMARY KEY,
  employee_number     VARCHAR(32)  NOT NULL UNIQUE,
  position            VARCHAR(255) NOT NULL,
  department          VARCHAR(255) NOT NULL,
  manager_name        VARCHAR(255) NOT NULL,
  start_date          DATE         NOT NULL,
  access_window_days  INT          NOT NULL DEFAULT 30,
  status              ENUM('active','completed','archived') NOT NULL DEFAULT 'active',
  avatar_url          TEXT         NULL,
  welcome_message     TEXT         NULL,
  completion_pct      INT          NOT NULL DEFAULT 0 COMMENT 'maintained by trigger (12_triggers.sql)',
  orientation_watched TINYINT(1)   NOT NULL DEFAULT 0,
  notes               TEXT         NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_employees_user FOREIGN KEY (id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_employees_dept (department),
  INDEX idx_employees_status (status)
) ENGINE=InnoDB;
