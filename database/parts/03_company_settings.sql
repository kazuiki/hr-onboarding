-- =====================================================================
-- 03_company_settings.sql — editable company configuration
-- Import: 4th. Requires: 01_users.sql (updated_by only).
--
-- Company name, office details, arrival time, dress code, HR contact and
-- similar values live here so HR can change them without a code deploy.
-- value_text holds plain values; value_json holds structured ones.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS company_settings (
  setting_key VARCHAR(64)  NOT NULL PRIMARY KEY,
  value_text  TEXT         NULL,
  value_json  JSON         NULL,
  description VARCHAR(255) NULL COMMENT 'Hint shown beside the field in HR settings',
  updated_by  CHAR(36)     NULL COMMENT 'FK -> users.id, HR who last edited',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_editor FOREIGN KEY (updated_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
