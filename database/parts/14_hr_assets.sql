-- =====================================================================
-- 14_hr_assets.sql — HR resource library (versioned uploads)
-- Import: 15th. Requires: 01_users.sql (uploaded_by only).
--
-- Editable PDFs, reference documents, sample photos and videos HR shares
-- with hires. Old versions stay (is_current = 0) for packets that used them.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS hr_assets (
  id          CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  title       VARCHAR(255) NOT NULL,
  asset_type  ENUM('template_pdf', 'reference_doc', 'sample_photo', 'video', 'referral_slip', 'policy_doc', 'other') NOT NULL DEFAULT 'reference_doc',
  file_name   VARCHAR(255) NOT NULL COMMENT 'Original filename',
  file_path   VARCHAR(500) NOT NULL COMMENT 'Storage path or external URL',
  file_size   INT UNSIGNED NULL COMMENT 'Bytes; NULL for external URLs',
  mime_type   VARCHAR(128) NULL,
  version     INT NOT NULL DEFAULT 1 COMMENT 'Bumped on re-upload of the same title',
  is_current  TINYINT(1) NOT NULL DEFAULT 1,
  uploaded_by CHAR(36) NULL COMMENT 'FK -> users.id, uploading HR user',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_hr_assets_uploader FOREIGN KEY (uploaded_by)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_hr_assets_type_current (asset_type, is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
