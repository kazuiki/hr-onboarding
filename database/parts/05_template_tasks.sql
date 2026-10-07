-- =====================================================================
-- 05_template_tasks.sql — line items inside a template
-- Import: 6th. Requires: 04_onboarding_templates.sql
--
-- Assigning a template clones these rows into onboarding_tasks (07).
-- slug is the stable identifier (e.g. req-psa-birth) reused per employee.
-- config carries per-item knobs (accepted MIME types, max MB, whether the
-- employee may download a blank form) so behavior is data-driven.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS template_tasks (
  id            CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'UUID',
  template_id   CHAR(36)     NOT NULL COMMENT 'FK -> onboarding_templates.id',
  slug          VARCHAR(64)  NOT NULL COMMENT 'Stable id reused in onboarding_tasks',
  title         VARCHAR(255) NOT NULL,
  description   TEXT         NULL,
  category      ENUM('welcome', 'form', 'photo', 'document', 'medical', 'first_day', 'privacy', 'help', 'completion') NOT NULL,
  required      TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 counts toward completion_pct',
  display_order INT          NOT NULL DEFAULT 0,
  config        JSON         NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_template_tasks_template FOREIGN KEY (template_id)
    REFERENCES onboarding_templates (id) ON DELETE CASCADE,
  UNIQUE KEY uq_template_tasks_slug (template_id, slug),
  INDEX idx_template_tasks_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
