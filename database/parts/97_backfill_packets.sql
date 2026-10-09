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
