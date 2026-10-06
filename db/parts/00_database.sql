-- =========================================================================
-- PART 00 : database
-- Creates the hr_onboarding database. Import FIRST, then parts 01-13 in order.
-- phpMyAdmin > Import > select file > Go. Repeat per file, same order.
-- Relationship map:
--   users (1) ──< employees (1:1, shared PK)
--   employees ──< onboarding_packets ──< onboarding_tasks ──< task_files
--   employees ──< medical_records | privacy_acknowledgements | message_threads
--   message_threads ──< messages | notifications | audit_events (cross-cutting)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS hr_onboarding
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr_onboarding;
