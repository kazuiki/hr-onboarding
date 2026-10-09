-- =====================================================================
-- 98_accounts.sql — login accounts only: 1 HR + 2 sample employees
-- Import AFTER 00-22, BEFORE 99_seed.sql (or standalone).
-- Run once in phpMyAdmin > SQL. Edit emails/names/passwords below first.
--
-- Logins created:
--   HR:       hr@philkoei.com.ph / ChangeMe123!
--   Employee: juan.delacruz@philkoei.com.ph / TempPass123!
--   Employee: maria.santos@philkoei.com.ph / TempPass123!
-- Change all temp passwords after first login:
--   UPDATE users SET password_hash = SHA2('new-password', 256)
--   WHERE email = 'hr@philkoei.com.ph';
-- =====================================================================
USE hr_onboarding;

-- --- 1. HR administrator (no employees-row needed) ---
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
('00000000-0000-0000-0000-000000000010', 'hr@philkoei.com.ph',
 SHA2('ChangeMe123!', 256), 'hr_manager', 'HR Administrator')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- --- 2. Sample employee #1 ---
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
('00000000-0000-0000-0000-000000000011', 'juan.delacruz@philkoei.com.ph',
 SHA2('TempPass123!', 256), 'employee', 'Juan Dela Cruz')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
INSERT INTO employees (id, employee_number, position, department, manager_name, start_date) VALUES
('00000000-0000-0000-0000-000000000011', 'PKI-2026-0001',
 'Junior Engineer', 'Engineering', 'HR Administrator', '2026-10-15')
ON DUPLICATE KEY UPDATE position = VALUES(position);

-- --- 3. Sample employee #2 ---
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
('00000000-0000-0000-0000-000000000012', 'maria.santos@philkoei.com.ph',
 SHA2('TempPass123!', 256), 'employee', 'Maria Santos')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
INSERT INTO employees (id, employee_number, position, department, manager_name, start_date) VALUES
('00000000-0000-0000-0000-000000000012', 'PKI-2026-0002',
 'HR Assistant', 'People and Culture', 'HR Administrator', '2026-10-15')
ON DUPLICATE KEY UPDATE position = VALUES(position);
