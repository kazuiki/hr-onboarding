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

-- --- Company configuration ---
-- Only keys the app actually reads are seeded. (Retired display-only keys
-- were pruned; see 31_prune_company_settings.sql for existing databases.)
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
