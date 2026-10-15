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
