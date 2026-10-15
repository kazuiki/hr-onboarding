-- =====================================================================
-- force-clear-data.sql — wipe ALL transactional data, keep config.
--
-- KEEPS (hindi gagalawin):
--   company_settings, onboarding_templates, template_tasks
--
-- WIPES (bura lahat ng rows):
--   users, employees + lahat ng hire data (packets, tasks, files, forms,
--   reviews, messages, checklist, medical, shared, history), notifications,
--   sessions, email_otp_codes, two_factor_challenges, qr_login_tokens,
--   audit_events
--
-- AFTER RUN: isa lang makaka-login:
--   hr.admin@philkoei.com.ph / ChangeMe123!
--   Palitan agad password pagkalogin. Saka gumawa ng accounts sa HR portal.
--
-- HOW TO RUN (phpMyAdmin sa 192.168.0.219):
--   1. BACKUP MUNA: click hr_onboarding > Export > Go, save ang .sql file.
--   2. Click hr_onboarding > SQL tab > paste buong file na ito > Go.
--   3. Kung may error na "Table 'x' doesn't exist": burahin lang yung
--      linyang yun, run ulit ang natira. Bawat DELETE independent.
--   4. Sa server disk (SSH/SFTP), burahin laman ng storage/uploads/
--      (iiwan ang folder mismo) para walang orphan files.
-- =====================================================================
USE hr_onboarding;

-- FK checks off: "force" delete kahit anong order, walang cascade error.
SET FOREIGN_KEY_CHECKS = 0;

-- --- transient / session data (safe, regenerable) ---
DELETE FROM qr_login_tokens;
DELETE FROM email_otp_codes;
DELETE FROM two_factor_challenges;
DELETE FROM sessions;
DELETE FROM notifications;

-- --- chat ---
DELETE FROM messages;
DELETE FROM message_threads;

-- --- hire data: uploads, forms, reviews ---
DELETE FROM review_decisions;
DELETE FROM task_files;
DELETE FROM form_submissions;
DELETE FROM submission_history;

-- --- hire data: packets + tasks ---
DELETE FROM onboarding_tasks;
DELETE FROM onboarding_packets;

-- --- hire data: per-employee extras ---
DELETE FROM shared_files;
DELETE FROM first_day_checklist;
DELETE FROM employee_medical_content;
DELETE FROM employees;

-- --- history + users ---
DELETE FROM audit_events;
DELETE FROM users;

-- --- OPTIONAL: HR resource library. Nasa schema ito (14_hr_assets.sql)
-- pero wala sa live table list — i-uncomment lang kung may hr_assets
-- table sa phpMyAdmin mo:
-- DELETE FROM hr_assets;

-- --- re-seed: tanging HR admin (password: ChangeMe123!) ---
-- Hash verified: scrypt('ChangeMe123!'), galing sa 99_seed.sql.
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
('00000000-0000-0000-0000-000000000001', 'hr.admin@philkoei.com.ph',
 'scrypt$822e4dbf067a295e41c6f27286a728e4$c6b62a745fbfce922963183dbbd1fd4e40d3d14337625e70974075981fd6f1944f15a32ff41d1ede7508810956b54c04630d03bab40699440a1b258e60aea188', 'hr_manager', 'HR Administrator');

SET FOREIGN_KEY_CHECKS = 1;

-- --- verification: dapat users=1, employees=0, config intact ---
SELECT (SELECT COUNT(*) FROM users) AS users_left,
       (SELECT COUNT(*) FROM employees) AS employees_left,
       (SELECT COUNT(*) FROM onboarding_packets) AS packets_left,
       (SELECT COUNT(*) FROM onboarding_tasks) AS tasks_left,
       (SELECT COUNT(*) FROM onboarding_templates) AS templates_kept,
       (SELECT COUNT(*) FROM template_tasks) AS template_tasks_kept,
       (SELECT COUNT(*) FROM company_settings) AS settings_kept;
