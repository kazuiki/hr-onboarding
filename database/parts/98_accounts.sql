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
