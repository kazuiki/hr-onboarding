-- =========================================================================
-- PART 03 : onboarding_templates + template_tasks (HR-defined sets)
-- Relationship: template_tasks.template_id -> onboarding_templates.id (CASCADE).
-- Flow: assigning a template to an employee clones template_tasks rows
--       into onboarding_tasks (part 04) in the app layer.
-- Requires: none (standalone).
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS onboarding_templates (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  department  VARCHAR(255) NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS template_tasks (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  template_id   CHAR(36)     NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT         NULL,
  category      ENUM('welcome','form','photo','document','medical','first_day','privacy','help','completion') NOT NULL,
  required      TINYINT(1)   NOT NULL DEFAULT 1,
  display_order INT          NOT NULL DEFAULT 0,
  has_download  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'show Download Form button',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ttpl_task FOREIGN KEY (template_id)
    REFERENCES onboarding_templates (id) ON DELETE CASCADE,
  INDEX idx_ttpl_task_tpl (template_id)
) ENGINE=InnoDB;
