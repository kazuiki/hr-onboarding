-- hr-onboarding-full.sql: complete database in ONE execution. Paste into phpMyAdmin SQL Go once. Tables views backfill safe to re-run; 99_seed admin row insert once only.

-- ---------------- 00_database.sql ----------------
-- =====================================================================
-- 00_database.sql — schema bootstrap
-- Import first. Creates the hr_onboarding schema (utf8mb4).
-- phpMyAdmin: Import > choose this file > Go.
-- Requires: MySQL 5.7+ / MariaDB 10.2+ (JSON columns).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS hr_onboarding
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hr_onboarding;

-- ---------------- 01_users.sql ----------------
-- =====================================================================
-- 01_users.sql — login accounts (employees and HR administrators)
-- Import: 2nd, after 00_database.sql. No dependencies.
--
-- One row per person. `role` decides which portal the app sends them to:
--   employee    -> /dashboard
--   hr_manager  -> /hr (full administration)
--   hr_assistant-> /hr (review and messaging; no destructive actions)
--
-- Passwords are scrypt hashes (`scrypt$<saltHex>$<hashHex>`) made by the app.
-- The app never stores or logs plain passwords. Login verification runs in
-- the application layer (lib/password.ts). Old school-build rows may still
-- hold bare SHA2-256 hex; those verify once, then upgrade to scrypt on login.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'UUID',
  email         VARCHAR(255) NOT NULL UNIQUE COMMENT 'Login identity',
  password_hash VARCHAR(255) NOT NULL COMMENT 'scrypt hash from lib/password.ts',
  role          ENUM('hr_manager', 'hr_assistant', 'employee') NOT NULL DEFAULT 'employee',
  full_name     VARCHAR(255) NOT NULL,
  avatar_url    TEXT         NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '0 disables login without deleting history',
  last_login_at TIMESTAMP    NULL DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 02_employees.sql ----------------
-- =====================================================================
-- 02_employees.sql — HR-owned employment profile (one per hire)
-- Import: 3rd. Requires: 01_users.sql
--
-- employees.id reuses users.id (shared primary key, 1:1). Deleting the user
-- cascades here. Day-to-day offboarding is a soft archive instead:
--   status = 'archived', archived_at = NOW()  (history is kept)
--
-- access_window_days bounds portal access to ±N days around start_date.
-- completion_pct and orientation_watched are maintained by the app when
-- tasks change; HR never edits them by hand.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS employees (
  id                  CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'FK -> users.id',
  employee_number     VARCHAR(32)  NOT NULL UNIQUE COMMENT 'Company ID, e.g. PKI-2026-0842',
  position            VARCHAR(255) NOT NULL,
  department          VARCHAR(255) NOT NULL,
  manager_name        VARCHAR(255) NOT NULL,
  start_date          DATE         NOT NULL,
  access_window_days  INT          NOT NULL DEFAULT 30,
  status              ENUM('active', 'completed', 'archived') NOT NULL DEFAULT 'active',
  avatar_url          TEXT         NULL,
  welcome_message     TEXT         NULL,
  completion_pct      INT          NOT NULL DEFAULT 0,
  orientation_watched TINYINT(1)   NOT NULL DEFAULT 0,
  notes               TEXT         NULL COMMENT 'Internal HR notes, never shown to the employee',
  archived_at         TIMESTAMP    NULL DEFAULT NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_employees_user FOREIGN KEY (id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_employees_number (employee_number),
  INDEX idx_employees_dept_status (department, status),
  INDEX idx_employees_start (start_date),
  INDEX idx_employees_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 03_company_settings.sql ----------------
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

-- ---------------- 04_onboarding_templates.sql ----------------
-- =====================================================================
-- 04_onboarding_templates.sql — reusable requirement sets defined by HR
-- Import: 5th. Requires: 01_users.sql (created_by only).
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS onboarding_templates (
  id          CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'UUID',
  name        VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  department  VARCHAR(255) NULL COMMENT 'NULL means usable for every department',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_by  CHAR(36)     NULL COMMENT 'FK -> users.id, authoring HR user',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_templates_author FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_templates_dept_active (department, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 05_template_tasks.sql ----------------
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

-- ---------------- 06_onboarding_packets.sql ----------------
-- =====================================================================
-- 06_onboarding_packets.sql — one onboarding instance per employee
-- Import: 7th. Requires: 02_employees.sql, 04_onboarding_templates.sql
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS onboarding_packets (
  id                  CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id         CHAR(36) NOT NULL UNIQUE COMMENT 'FK -> employees.id, one packet each',
  template_id         CHAR(36) NULL COMMENT 'FK -> onboarding_templates.id, source set',
  welcome_message     TEXT     NULL,
  completion_pct      INT      NOT NULL DEFAULT 0 COMMENT 'Maintained by the app',
  orientation_watched TINYINT(1) NOT NULL DEFAULT 0,
  completed_at        TIMESTAMP NULL DEFAULT NULL COMMENT 'Set when completion hits 100',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_packets_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_packets_template FOREIGN KEY (template_id)
    REFERENCES onboarding_templates (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 07_onboarding_tasks.sql ----------------
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

-- ---------------- 08_task_files.sql ----------------
-- =====================================================================
-- 08_task_files.sql — uploaded file metadata (documents and ID photos)
-- Import: 9th. Requires: 07_onboarding_tasks.sql, 02_employees.sql
--
-- One row per file; several files may belong to one requirement.
-- Only metadata and the storage path live here — byte content lives on
-- disk under public/uploads/<employee_id>/ (see the /api/uploads route).
-- uploaded_by marks the origin: employee submission vs HR correction.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS task_files (
  id               CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'UUID',
  task_id          VARCHAR(64)  NOT NULL COMMENT 'FK -> onboarding_tasks.id',
  employee_id      CHAR(36)     NOT NULL COMMENT 'FK -> employees.id, owner',
  file_name        VARCHAR(255) NOT NULL COMMENT 'Original client filename',
  file_path        VARCHAR(500) NOT NULL COMMENT 'Web path, e.g. /uploads/<employee_id>/<file>',
  file_size        INT UNSIGNED NOT NULL COMMENT 'Bytes',
  mime_type        VARCHAR(128) NOT NULL,
  status           ENUM('not_started', 'in_progress', 'submitted', 'needs_changes', 'approved') NOT NULL DEFAULT 'submitted',
  rejection_reason TEXT         NULL,
  uploaded_by      ENUM('employee', 'hr') NOT NULL DEFAULT 'employee',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_files_task FOREIGN KEY (task_id, employee_id)
    REFERENCES onboarding_tasks (id, employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_task_files_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_task_files_task (task_id),
  INDEX idx_task_files_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 09_form_submissions.sql ----------------
-- =====================================================================
-- 09_form_submissions.sql — structured online employment forms
-- Import: 10th. Requires: 07_onboarding_tasks.sql, 02_employees.sql
--
-- Covers Data Privacy, Manual Conforme, Company ID Conforme, Code of
-- Conduct and Comprehension Test. form_data holds the filled answers as
-- JSON. Resubmits insert new rows so HR keeps version history.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS form_submissions (
  id           CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'UUID',
  task_id      VARCHAR(64) NOT NULL COMMENT 'FK -> onboarding_tasks.id',
  employee_id  CHAR(36)    NOT NULL COMMENT 'FK -> employees.id, owner',
  form_type    VARCHAR(64) NOT NULL COMMENT 'data-privacy | manual-conforme | id-conforme | code-conduct | comprehension',
  form_data    JSON        NOT NULL COMMENT 'Filled answers object',
  status       ENUM('not_started', 'in_progress', 'submitted', 'needs_changes', 'approved') NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_form_submissions_task FOREIGN KEY (task_id, employee_id)
    REFERENCES onboarding_tasks (id, employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_form_submissions_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_form_submissions_employee (employee_id),
  INDEX idx_form_submissions_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 14_hr_assets.sql ----------------
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

-- ---------------- 15_shared_files.sql ----------------
-- =====================================================================
-- 15_shared_files.sql — company files HR shares with one employee
-- Import: 16th. Requires: 02_employees.sql, 01_users.sql (uploaded_by).
--
-- Powers the seven fixed HR -> employee download links:
--   form-data-privacy, form-manual-conforme, form-id-conforme,
--   form-code-conduct, form-comprehension, medical-referral,
-- plus any requirement slug (e.g. req-app-form) for the application form.
-- One row per (employee, slot); re-upload replaces the row. The matching
-- employee-side Download button is grey until its slot has a row here.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS shared_files (
  id          CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id CHAR(36) NOT NULL COMMENT 'FK -> employees.id, recipient',
  slot        VARCHAR(64) NOT NULL COMMENT 'form-data-privacy | … | medical-referral | <task slug>',
  file_name   VARCHAR(255) NOT NULL COMMENT 'Original filename',
  file_path   VARCHAR(500) NOT NULL COMMENT 'Web path, e.g. /uploads/<employee_id>/<file>',
  file_size   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Bytes',
  mime_type   VARCHAR(128) NOT NULL DEFAULT 'application/octet-stream',
  notes       TEXT NULL,
  uploaded_by CHAR(36) NULL COMMENT 'FK -> users.id, sharing HR user',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shared_files_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_shared_files_uploader FOREIGN KEY (uploaded_by)
    REFERENCES users (id) ON DELETE SET NULL,
  UNIQUE KEY uq_shared_files_emp_slot (employee_id, slot),
  INDEX idx_shared_files_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 16_message_threads.sql ----------------
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

-- ---------------- 17_messages.sql ----------------
-- =====================================================================
-- 17_messages.sql — chat rows
-- Import: 18th. Requires: 16_message_threads.sql, 01_users.sql
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS messages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  thread_id   CHAR(36)  NOT NULL COMMENT 'FK -> message_threads.id',
  sender_id   CHAR(36)  NOT NULL COMMENT 'FK -> users.id',
  sender_role ENUM('employee', 'hr') NOT NULL,
  body        TEXT      NOT NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id)
    REFERENCES message_threads (id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_messages_thread (thread_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 18_notifications.sql ----------------
-- =====================================================================
-- 18_notifications.sql — employee bell feed
-- Import: 19th. Requires: 01_users.sql, 07_onboarding_tasks.sql (link only).
--
-- Written by the app on approvals, rejections, chat replies and shared
-- files. link_section routes the dashboard tab: pre_employment | photo |
-- medical | first_day | privacy | forms | help.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS notifications (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      CHAR(36)  NOT NULL COMMENT 'Recipient FK -> users.id',
  type         ENUM('rejection', 'approval', 'reminder', 'chat', 'general') NOT NULL,
  title        VARCHAR(255) NOT NULL,
  body         TEXT      NULL,
  link_section VARCHAR(32) NULL COMMENT 'Dashboard tab id for deep-linking',
  task_id      VARCHAR(64) NULL COMMENT 'Related task slug (no FK: survives task cleanup)',
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 19_review_decisions.sql ----------------
-- =====================================================================
-- 19_review_decisions.sql — explicit approve/reject history
-- Import: 20th. Requires: 07_onboarding_tasks.sql, 02_employees.sql,
--          01_users.sql (reviewer), 08_task_files.sql (file pin).
--
-- onboarding_tasks keeps only the latest status; this table keeps EVERY
-- decision with reviewer, timestamp and comment — the audit history shown
-- beside each submission.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS review_decisions (
  id          CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  task_id     VARCHAR(64) NOT NULL COMMENT 'Task slug',
  employee_id CHAR(36) NOT NULL COMMENT 'FK -> employees.id, submission owner',
  file_id     CHAR(36) NULL COMMENT 'FK -> task_files.id, exact file reviewed',
  reviewer_id CHAR(36) NULL COMMENT 'FK -> users.id; SET NULL keeps history',
  decision    ENUM('approved', 'needs_changes') NOT NULL,
  comment     TEXT NULL COMMENT 'HR feedback; required when needs_changes',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_decisions_task FOREIGN KEY (task_id, employee_id)
    REFERENCES onboarding_tasks (id, employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_decisions_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_review_decisions_file FOREIGN KEY (file_id)
    REFERENCES task_files (id) ON DELETE SET NULL,
  CONSTRAINT fk_review_decisions_reviewer FOREIGN KEY (reviewer_id)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_review_decisions_task (task_id, created_at),
  INDEX idx_review_decisions_employee (employee_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 20_audit_events.sql ----------------
-- =====================================================================
-- 20_audit_events.sql — append-only compliance log
-- Import: 21st. Requires: 01_users.sql
--
-- The app only ever INSERTs here. Never store file bytes, medical details
-- or passwords in details. History survives account deletion (SET NULL).
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS audit_events (
  id          CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  actor_id    CHAR(36) NULL COMMENT 'FK -> users.id',
  actor_name  VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Denormalized so the log reads without a join',
  actor_role  ENUM('hr_manager', 'hr_assistant', 'employee') NOT NULL,
  action      VARCHAR(64) NOT NULL COMMENT 'INVITE_EMPLOYEE | UPLOAD | APPROVE | REJECT | REMOVE_UPLOAD | CHAT_SEND | CHAT_REPLY | PRIVACY_ACK | MEDICAL_REVIEWED | FIRSTDAY_READY | LOGIN | LOGOUT | ARCHIVE_EMPLOYEE',
  target_type VARCHAR(64) NOT NULL COMMENT 'employee | task | file | thread | policy | template',
  target_id   VARCHAR(64) NULL,
  details     JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_events_actor FOREIGN KEY (actor_id)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_audit_events_actor (actor_id, created_at),
  INDEX idx_audit_events_action (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 21_sessions.sql ----------------
-- =====================================================================
-- 21_sessions.sql — server login sessions (httpOnly cookie tokens)
-- Import: 22nd. Requires: 01_users.sql
--
-- The app creates one row per sign-in and deletes it on sign-out or
-- expiry. The token stored here is the session cookie value; it is random
-- 128-bit hex, single-purpose, and useless after expires_at passes.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS sessions (
  token      CHAR(64)    NOT NULL PRIMARY KEY COMMENT 'Random session token (cookie value)',
  user_id    CHAR(36)    NOT NULL COMMENT 'FK -> users.id',
  expires_at TIMESTAMP   NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 22_views.sql ----------------
-- =====================================================================
-- 22_views.sql — ready-made datasets for the HR screens
-- Import: 23rd. Requires: 01_users, 02_employees, 06_onboarding_packets,
--          07_onboarding_tasks, 20_audit_events.
--
-- v_review_queue      -> submitted + needs_changes items with names
-- v_employee_progress -> per-hire required/approved counts and percent
-- v_audit_log         -> newest 10 audit events (audit page, page 1;
--                        the app pages further with LIMIT/OFFSET itself)
-- =====================================================================
USE hr_onboarding;

CREATE OR REPLACE VIEW v_review_queue AS
SELECT t.id, t.title, t.description, t.category, t.status, t.required,
       t.file_name, t.feedback, t.submitted_at, t.reviewed_at,
       e.id AS employee_id, e.employee_number, u.full_name AS employee_name,
       e.department, e.start_date,
       r.full_name AS reviewed_by_name
FROM onboarding_tasks t
JOIN employees e ON e.id = t.employee_id
JOIN users u ON u.id = e.id
LEFT JOIN users r ON r.id = t.reviewed_by
WHERE t.status IN ('submitted', 'needs_changes')
ORDER BY t.updated_at DESC;

CREATE OR REPLACE VIEW v_employee_progress AS
SELECT e.id AS employee_id, e.employee_number, u.full_name AS employee_name,
       e.department, e.status, e.start_date,
       COUNT(CASE WHEN t.required = 1 THEN 1 END) AS required_total,
       COUNT(CASE WHEN t.required = 1 AND t.status = 'approved' THEN 1 END) AS approved_count,
       CASE WHEN COUNT(CASE WHEN t.required = 1 THEN 1 END) = 0 THEN 100
            ELSE ROUND(COUNT(CASE WHEN t.required = 1 AND t.status = 'approved' THEN 1 END) * 100.0
                       / COUNT(CASE WHEN t.required = 1 THEN 1 END)) END AS progress_pct
FROM employees e
JOIN users u ON u.id = e.id
LEFT JOIN onboarding_tasks t ON t.employee_id = e.id
GROUP BY e.id, e.employee_number, u.full_name, e.department, e.status, e.start_date;

CREATE OR REPLACE VIEW v_audit_log AS
SELECT id, actor_name, actor_role, action, target_type, target_id, details, created_at
FROM audit_events
ORDER BY created_at DESC
LIMIT 10;

-- ---------------- 23_first_day_checklist.sql ----------------
-- =====================================================================
-- 23_first_day_checklist.sql — per-hire first-day orientation checks
-- Import: 24th. Requires: 02_employees.sql.
--
-- One row per (employee, item_key); the hire toggles items in the
-- dashboard First Day section and each toggle upserts its row, so checks
-- survive refresh and HR sees them per hire. Wiping an employee cascades.
-- item_key values live in FIRST_DAY_CHECKLIST_ITEMS (lib/onboarding.ts).
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS first_day_checklist (
  employee_id CHAR(36)    NOT NULL COMMENT 'FK -> employees.id, owner',
  item_key    VARCHAR(64) NOT NULL COMMENT 'Stable slug, e.g. hr-orientation',
  is_checked  TINYINT(1)  NOT NULL DEFAULT 0,
  checked_at  TIMESTAMP   NULL DEFAULT NULL,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id, item_key),
  CONSTRAINT fk_first_day_checklist_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_first_day_checklist_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 24_password_hashes.sql ----------------
-- =====================================================================
-- 24_password_hashes.sql — widen password_hash for scrypt digests
-- Import: 25th. Requires: 01_users.sql.
--
-- scrypt rows (`scrypt$<saltHex>$<hashHex>`) are longer than the old
-- CHAR(64) SHA2 digests. Safe to re-run. Legacy SHA2 rows keep working:
-- each upgrades to scrypt on its next successful login.
-- =====================================================================
USE hr_onboarding;

ALTER TABLE users MODIFY password_hash VARCHAR(255) NOT NULL COMMENT 'scrypt hash from lib/password.ts';

-- ---------------- 25_submission_history.sql ----------------
-- =====================================================================
-- 25_submission_history.sql — permanent per-hire submission log
-- Import: 26th. Requires: 02_employees.sql.
--
-- One row per submitted or removed file (plus one row per online form
-- answer set). Rows are append-only: removing an uploaded file deletes its
-- task_files row but NEVER its history rows, so the History page keeps the
-- full record. item_label snapshots the title at submit time.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS submission_history (
  id          CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id CHAR(36)    NOT NULL COMMENT 'FK -> employees.id, owner',
  item_kind   ENUM('requirement', 'form') NOT NULL COMMENT 'Task upload or online form',
  item_key    VARCHAR(64) NOT NULL COMMENT 'Task slug or form_type',
  item_label  VARCHAR(255) NOT NULL COMMENT 'Title snapshot at submit time',
  category    VARCHAR(32) NOT NULL DEFAULT 'document' COMMENT 'Task category, or form',
  file_name   VARCHAR(255) NULL COMMENT 'Original filename; NULL for answer-only forms',
  file_path   VARCHAR(500) NULL COMMENT 'Storage path snapshot; NULL when no file',
  action      ENUM('upload', 'remove') NOT NULL DEFAULT 'upload',
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_submission_history_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_submission_history_employee (employee_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 26_two_factor.sql ----------------
-- =====================================================================
-- 26_two_factor.sql — authenticator-app 2FA (TOTP) per user ID
-- Import: after 25_submission_history.sql. Requires: 01_users.sql.
-- Run as a privileged user (ALTER needs more than the app's app user).
-- phpMyAdmin > Import > Go. Safe to re-run.
--
-- Model:
--   users.totp_secret / totp_enabled — one authenticator secret per user ID.
--     The secret is sensitive like a password hash: DB access bypasses 2FA.
--   two_factor_challenges — short-lived login/enrollment challenges (10 min).
--     The client holds only the random id; the secret never leaves the server
--     until enrollment is confirmed.
--   (30_drop_dead_2fa_tables.sql removes the retired remember-device and
--   backup-code tables from existing databases.)
-- =====================================================================
USE hr_onboarding;

SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'hr_onboarding' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'totp_secret'
);
SET @add_totp := IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN totp_secret TEXT NULL COMMENT ''Base32 TOTP secret, one per user ID'' AFTER password_hash,
   ADD COLUMN totp_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''1 once enrollment is confirmed'' AFTER totp_secret,
   ADD COLUMN totp_enabled_at TIMESTAMP NULL DEFAULT NULL AFTER totp_enabled',
  'SELECT ''users.totp columns already present''');
PREPARE stmt_add_totp FROM @add_totp;
EXECUTE stmt_add_totp;
DEALLOCATE PREPARE stmt_add_totp;

CREATE TABLE IF NOT EXISTS two_factor_challenges (
  id         CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'Random challenge id handed to the client',
  user_id    CHAR(36)    NOT NULL COMMENT 'FK -> users.id',
  purpose    ENUM('login', 'enroll') NOT NULL COMMENT 'login = post-password step-up, enroll = pending setup secret',
  secret     TEXT        NULL COMMENT 'Pending TOTP secret (enroll only, never for login)',
  expires_at TIMESTAMP   NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_2fa_challenge_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_2fa_challenge_user (user_id),
  INDEX idx_2fa_challenge_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 27_email_otp.sql ----------------
-- =====================================================================
-- 27_email_otp.sql — emailed sign-in codes (6 digits, 3-minute expiry)
-- Import: after 26_two_factor.sql. Requires: 01_users.sql.
-- phpMyAdmin > Import > Go. Safe to re-run.
--
-- Model:
--   email_otp_codes — one row per sent code, bound to the login challenge
--     that requested it. Only the SHA-256 hash is stored, never the code.
--     Rows are single-purpose: a successful verify or 5 wrong guesses burns
--     the row (used_at set), and expiry is enforced on every check.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS email_otp_codes (
  id           CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'UUID',
  user_id      CHAR(36)    NOT NULL COMMENT 'FK -> users.id',
  challenge_id CHAR(36)    NOT NULL COMMENT 'Login challenge that requested this code',
  code_hash    CHAR(64)    NOT NULL COMMENT 'SHA-256 of the 6-digit code',
  attempts     TINYINT     NOT NULL DEFAULT 0 COMMENT 'Wrong guesses; burned at 5',
  used_at      TIMESTAMP   NULL DEFAULT NULL COMMENT 'Set on success, burn, or supersede',
  expires_at   TIMESTAMP   NOT NULL COMMENT '3 minutes after send',
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_otp_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_email_otp_user (user_id),
  INDEX idx_email_otp_challenge (challenge_id),
  INDEX idx_email_otp_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 28_qr_login.sql ----------------
-- =====================================================================
-- 28_qr_login.sql — scan-with-phone approval tokens (QR "another way")
-- Import: after 27_email_otp.sql. Requires: 01_users.sql.
-- phpMyAdmin > Import > Go. Safe to re-run.
--
-- Model:
--   qr_login_tokens — one row per QR shown. The phone opens the encoded link
--     and taps Approve/Deny; the desktop polls until decided. Only the
--     SHA-256 hash is stored, never the raw token. Single-purpose rows:
--     approve/deny sets used_at, expiry is enforced on every check.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS qr_login_tokens (
  id           CHAR(36)    NOT NULL PRIMARY KEY COMMENT 'UUID',
  user_id      CHAR(36)    NOT NULL COMMENT 'FK -> users.id',
  challenge_id CHAR(36)    NOT NULL COMMENT 'Login challenge awaiting approval',
  token_hash   CHAR(64)    NOT NULL COMMENT 'SHA-256 of the raw approve-link token',
  status       ENUM('pending', 'approved', 'denied') NOT NULL DEFAULT 'pending',
  used_at      TIMESTAMP   NULL DEFAULT NULL COMMENT 'Set when decided or consumed',
  expires_at   TIMESTAMP   NOT NULL COMMENT '3 minutes after the QR is shown',
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_qr_login_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_qr_login_challenge (challenge_id),
  INDEX idx_qr_login_token (token_hash),
  INDEX idx_qr_login_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- 98_accounts.sql ----------------
-- =====================================================================
-- 98_accounts.sql — login accounts only: 1 HR + 2 sample employees
-- Import AFTER 00-22, BEFORE 99_seed.sql (or standalone).
-- Run once in phpMyAdmin > SQL. Edit emails/names/passwords below first.
--
-- Logins created:
--   HR:       hr@philkoei.com.ph / ChangeMe123!
--   Employee: juan.delacruz@philkoei.com.ph / TempPass123!
--   Employee: maria.santos@philkoei.com.ph / TempPass123!
-- Change all temp passwords after first login from the dashboard
-- (Welcome > Change Password). Hashes below are scrypt digests of the
-- printed temp passwords.
-- =====================================================================
USE hr_onboarding;

-- --- 1. HR administrator (no employees-row needed) ---
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
('00000000-0000-0000-0000-000000000010', 'hr@philkoei.com.ph',
 'scrypt$822e4dbf067a295e41c6f27286a728e4$c6b62a745fbfce922963183dbbd1fd4e40d3d14337625e70974075981fd6f1944f15a32ff41d1ede7508810956b54c04630d03bab40699440a1b258e60aea188', 'hr_manager', 'HR Administrator')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- --- 2. Sample employee #1 ---
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
('00000000-0000-0000-0000-000000000011', 'juan.delacruz@philkoei.com.ph',
 'scrypt$eea54e3ecbb918d101c08d491fcb5552$49ac5248e797d0560d0f0828a867e606c4d57e1ca007e4cbbc11ef8533749cf04ec2215382fd40fc95a8b8c1bc19b50db1e162a86990af0a62e7cacaaaa0845d', 'employee', 'Juan Dela Cruz')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
INSERT INTO employees (id, employee_number, position, department, manager_name, start_date) VALUES
('00000000-0000-0000-0000-000000000011', 'PKI-2026-0001',
 'Junior Engineer', 'Engineering', 'HR Administrator', '2026-10-15')
ON DUPLICATE KEY UPDATE position = VALUES(position);

-- --- 3. Sample employee #2 ---
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
('00000000-0000-0000-0000-000000000012', 'maria.santos@philkoei.com.ph',
 'scrypt$eea54e3ecbb918d101c08d491fcb5552$49ac5248e797d0560d0f0828a867e606c4d57e1ca007e4cbbc11ef8533749cf04ec2215382fd40fc95a8b8c1bc19b50db1e162a86990af0a62e7cacaaaa0845d', 'employee', 'Maria Santos')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
INSERT INTO employees (id, employee_number, position, department, manager_name, start_date) VALUES
('00000000-0000-0000-0000-000000000012', 'PKI-2026-0002',
 'HR Assistant', 'People and Culture', 'HR Administrator', '2026-10-15')
ON DUPLICATE KEY UPDATE position = VALUES(position);

-- ---------------- 99_seed.sql ----------------
-- =====================================================================
-- 99_seed.sql — minimal realistic starting data (NO demo employees)
-- Import LAST, after 00-22. One Go in phpMyAdmin.
--
-- What this seeds:
--   * One HR administrator account (temp password — CHANGE on first login)
--   * Company configuration (edit in HR settings later, not in code)
--   * One standard onboarding template with its requirement list
--
-- It deliberately seeds ZERO employees, tasks or submissions: HR creates
-- hires through the "Create Employee Account" button, which builds their
-- packet from the template below. That keeps every record genuine.
--
-- FIRST LOGIN:  hr.admin@philkoei.com.ph / ChangeMe123!
-- Change it immediately after first sign-in.
-- =====================================================================
USE hr_onboarding;

-- --- HR administrator (temp credentials, change immediately) ---
-- password_hash below is scrypt('ChangeMe123!'); generate new ones with the app.
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
('00000000-0000-0000-0000-000000000001', 'hr.admin@philkoei.com.ph',
 'scrypt$822e4dbf067a295e41c6f27286a728e4$c6b62a745fbfce922963183dbbd1fd4e40d3d14337625e70974075981fd6f1944f15a32ff41d1ede7508810956b54c04630d03bab40699440a1b258e60aea188', 'hr_manager', 'HR Administrator');

-- --- Company configuration (only keys the app reads) ---
INSERT INTO company_settings (setting_key, value_text, description) VALUES
('default_access_window_days', '30', 'Default onboarding window around the start date');

-- --- Standard onboarding template ---
INSERT INTO onboarding_templates (id, name, description, department, is_active, created_by) VALUES
('20000000-0000-0000-0000-000000000001', 'Standard New-Hire Packet',
 'Default requirement set assigned to every new hire: application form, government IDs, photo, clearances, medical, first-day readiness, and privacy consent.',
 NULL, 1, '00000000-0000-0000-0000-000000000001');

INSERT INTO template_tasks (id, template_id, slug, title, description, category, required, display_order, config) VALUES
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-app-form', 'Employment Application Form', 'Official application form with personal and employment background.', 'document', 1, 1, JSON_OBJECT('has_download', true)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-psa-birth', 'PSA Birth Certificate', 'Philippine Statistics Authority issued birth certificate copy.', 'document', 1, 2, JSON_OBJECT('accept', JSON_ARRAY('image/jpeg', 'image/png', 'application/pdf'), 'max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-sss', 'SSS Form E1 / SSS ID', 'Social Security System Form E-1 or member ID.', 'document', 1, 3, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-philhealth', 'PhilHealth MDR', 'PhilHealth Member Data Record or ID copy.', 'document', 1, 4, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-pagibig', 'PAG-IBIG MDR', 'HDMF Member Data Record with MID number.', 'document', 1, 5, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-bir-2316', 'BIR Form 2316', 'Certificate of compensation payment / tax withheld from the previous employer.', 'document', 1, 6, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-bir-1902', 'BIR Form 1902 / TIN ID', 'Application for registration or TIN card.', 'document', 1, 7, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-diploma', 'Diploma', 'College or university graduation diploma scan.', 'document', 1, 8, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-tor', 'Transcript of Records', 'Official transcript with school seal.', 'document', 1, 9, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-nbi', 'NBI Clearance', 'Valid multi-purpose NBI clearance issued within the last 6 months.', 'document', 1, 10, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-photo', '2x2 / 1x1 Photo', 'Formal corporate portrait on white background.', 'photo', 1, 11, JSON_OBJECT('accept', JSON_ARRAY('image/jpeg', 'image/png'), 'max_mb', 5)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-marriage-cert', 'Marriage Certificate', 'PSA marriage certificate (married employees only).', 'document', 0, 12, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-prc', 'PRC License', 'Professional Regulation Commission license card, front and back.', 'document', 0, 13, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'req-coe', 'Certificate of Employment', 'Certificate of employment from previous employer.', 'document', 0, 14, JSON_OBJECT('max_mb', 10)),
(UUID(), '20000000-0000-0000-0000-000000000001', 'task-med-1', 'Medical Examination and Health Clearance', 'Pre-employment medical examination at the accredited clinic.', 'medical', 1, 15, JSON_OBJECT()),
(UUID(), '20000000-0000-0000-0000-000000000001', 'task-firstday-1', 'First Day Readiness and Orientation', 'Arrival schedule, dress code and reporting details.', 'first_day', 1, 16, JSON_OBJECT()),
(UUID(), '20000000-0000-0000-0000-000000000001', 'task-privacy-1', 'Data Privacy Policy and Consent', 'Read and acknowledge the company privacy notice.', 'privacy', 1, 17, JSON_OBJECT());

-- --- Audit trail starts here ---
INSERT INTO audit_events (id, actor_id, actor_name, actor_role, action, target_type, target_id, details) VALUES
(UUID(), '00000000-0000-0000-0000-000000000001', 'HR Administrator', 'hr_manager', 'SYSTEM_SEED', 'system', 'hr_onboarding', JSON_OBJECT('note', 'Schema seeded: admin account, company settings, standard template.'));

-- ---------------- 97_backfill_packets.sql ----------------
-- =====================================================================
-- 97_backfill_packets.sql — packets + tasks for hires created outside the app
-- Run anytime in phpMyAdmin > SQL. Safe to re-run (INSERT IGNORE).
--
-- Why: accounts added by raw INSERT (e.g. 98_accounts.sql samples) have no
-- onboarding_packets / onboarding_tasks rows, so every upload fails on the
-- form_submissions foreign key and the dashboard shows nothing to do.
-- Hires created via the app's "Create Employee Account" never need this.
-- =====================================================================
USE hr_onboarding;

-- --- Packets for employees missing one ---
INSERT IGNORE INTO onboarding_packets (id, employee_id, welcome_message)
SELECT UUID(), e.id, CONCAT('Welcome to the team, ', u.full_name, '!')
FROM employees e
JOIN users u ON u.id = e.id
LEFT JOIN onboarding_packets p ON p.employee_id = e.id
WHERE p.id IS NULL;

-- --- Checklist tasks (mirrors DEFAULT_REQUIREMENTS in lib/onboarding.ts) ---
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-app-form', p.id, p.employee_id, 'Employment Application Form', 'Official application form with personal and employment background.', 'document', 1, 1, 1 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-psa-birth', p.id, p.employee_id, 'PSA Birth Certificate', 'Philippine Statistics Authority issued birth certificate copy.', 'document', 1, 2, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-sss', p.id, p.employee_id, 'SSS Form E1 / SSS ID', 'Social Security System Form E-1 or member ID.', 'document', 1, 3, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-philhealth', p.id, p.employee_id, 'PhilHealth MDR', 'PhilHealth Member Data Record or ID copy.', 'document', 1, 4, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-pagibig', p.id, p.employee_id, 'PAG-IBIG MDR', 'HDMF Member Data Record with MID number.', 'document', 1, 5, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-bir-2316', p.id, p.employee_id, 'BIR Form 2316', 'Certificate of compensation payment / tax withheld from the previous employer.', 'document', 1, 6, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-bir-1902', p.id, p.employee_id, 'BIR Form 1902 / TIN ID', 'Application for registration or TIN card.', 'document', 1, 7, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-diploma', p.id, p.employee_id, 'Diploma', 'College or university graduation diploma scan.', 'document', 1, 8, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-tor', p.id, p.employee_id, 'Transcript of Records', 'Official transcript with school seal.', 'document', 1, 9, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-nbi', p.id, p.employee_id, 'NBI Clearance', 'Valid multi-purpose NBI clearance issued within the last 6 months.', 'document', 1, 10, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-photo', p.id, p.employee_id, '2x2 / 1x1 Photo', 'Formal corporate portrait on white background.', 'photo', 1, 11, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-marriage-cert', p.id, p.employee_id, 'Marriage Certificate', 'PSA marriage certificate (married employees only).', 'document', 0, 12, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-prc', p.id, p.employee_id, 'PRC License', 'Professional Regulation Commission license card, front and back.', 'document', 0, 13, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'req-coe', p.id, p.employee_id, 'Certificate of Employment', 'Certificate of employment from previous employer.', 'document', 0, 14, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'task-med-1', p.id, p.employee_id, 'Medical Examination and Health Clearance', 'Pre-employment medical examination at the accredited clinic.', 'medical', 1, 15, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'task-firstday-1', p.id, p.employee_id, 'First Day Readiness and Orientation', 'Arrival schedule, dress code and reporting details.', 'first_day', 1, 16, 0 FROM onboarding_packets p;
INSERT IGNORE INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
SELECT 'task-privacy-1', p.id, p.employee_id, 'Data Privacy Policy and Consent', 'Read and acknowledge the company privacy notice.', 'privacy', 1, 17, 0 FROM onboarding_packets p;

-- ---------------- 29_employee_medical_content.sql ----------------
-- 29_employee_medical_content.sql — per-hire Accredited Clinic details.
-- Requires: 02_employees.sql. Safe to re-run.
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS employee_medical_content (
  employee_id      CHAR(36)     NOT NULL PRIMARY KEY COMMENT 'FK -> employees.id',
  clinic_name      VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Accredited clinic name',
  clinic_address   TEXT         NOT NULL COMMENT 'Street / building address shown after the name',
  clinic_phone     VARCHAR(64)  NOT NULL DEFAULT '' COMMENT 'Clinic contact number',
  clinic_hours     VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Clinic schedule line',
  updated_by       CHAR(36)     NULL COMMENT 'FK -> users.id, HR who last saved',
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_medical_content_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
