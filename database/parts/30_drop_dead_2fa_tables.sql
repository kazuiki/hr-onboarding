-- =====================================================================
-- 30_drop_dead_2fa_tables.sql — drop unused remember/backup tables
-- Import: after the 29 file, AFTER deploying code without remember-device
-- and backup-code support. Requires: none (drops only).
-- phpMyAdmin > Import > Go. Safe to re-run.
--
-- Drops:
--   user_two_factor_backup_codes — recovery codes were never issued or
--     verified anywhere in the app; the table was always empty.
--   user_two_factor_devices — "remember this device" was removed; every
--     sign-in now asks for a code. Dropping forgets old remembered
--     browsers (their next sign-in asks for a code). Live sessions in
--     `sessions` are untouched — nobody gets signed out by this.
-- =====================================================================
USE hr_onboarding;

DROP TABLE IF EXISTS user_two_factor_backup_codes;
DROP TABLE IF EXISTS user_two_factor_devices;
