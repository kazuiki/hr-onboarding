-- =====================================================================
-- 31_prune_company_settings.sql — delete unread display-only seed keys
-- Import: anytime AFTER deploying code that reads only
-- `default_access_window_days`. Requires: 03_company_settings.sql.
-- phpMyAdmin > Import > Go. Safe to re-run.
--
-- Keeps the one live key (`default_access_window_days`, stamped onto new
-- hires at invite time). Removes retired keys nothing in the app reads
-- (company/office display strings, HR contact, what-to-bring list).
-- =====================================================================
USE hr_onboarding;

DELETE FROM company_settings WHERE setting_key IN (
  'company_name',
  'hq_office_name',
  'hq_office_address',
  'hq_map_instructions',
  'default_arrival_time',
  'default_dress_code',
  'default_reporting_to',
  'hr_contact_name',
  'hr_contact_email',
  'hr_contact_phone',
  'default_items_to_bring'
);
