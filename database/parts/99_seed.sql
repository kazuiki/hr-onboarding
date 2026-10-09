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
-- Then immediately: UPDATE users SET password_hash = SHA2('your-new-password', 256)
--                   WHERE email = 'hr.admin@philkoei.com.ph';
-- =====================================================================
USE hr_onboarding;

-- --- HR administrator (temp credentials, change immediately) ---
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
('00000000-0000-0000-0000-000000000001', 'hr.admin@philkoei.com.ph',
 SHA2('ChangeMe123!', 256), 'hr_manager', 'HR Administrator');

-- --- Company configuration ---
INSERT INTO company_settings (setting_key, value_text, description) VALUES
('company_name', 'Philkoei International, Inc.', 'Brand name in header and welcome banner'),
('hq_office_name', 'Philkoei International Corporate Headquarters', 'First-day reporting office'),
('hq_office_address', '15th Floor, The Enterprise Center Tower 1, 6766 Ayala Avenue, Makati City, Metro Manila', 'First-day address'),
('hq_map_instructions', 'Enter via Paseo de Roxas or Ayala Avenue entrance. Take the High-Zone elevator bank to Floor 15.', 'First-day map hint'),
('default_arrival_time', '8:00 AM Sharp (PHT)', 'Default arrival seeded into first-day guides'),
('default_dress_code', 'Smart-Casual (collared shirts, slacks/chinos, closed-toe shoes; no slippers or distressed denim)', 'Default dress code'),
('default_reporting_to', 'HR People and Culture Department, 15th Floor Reception', 'Default reporting contact'),
('hr_contact_name', 'HR People and Culture Department', 'Need-Help contact'),
('hr_contact_email', 'hr@philkoei.com.ph', 'Need-Help email'),
('hr_contact_phone', '+63 2 8812 3456', 'Need-Help phone'),
('default_access_window_days', '30', 'Default onboarding window around the start date');

INSERT INTO company_settings (setting_key, value_json, description) VALUES
('default_items_to_bring',
 JSON_ARRAY('Original Government Valid IDs', 'Original Physical NBI Clearance Certificate', 'Bank Account Details for Payroll Authorization', 'Signed Physical Employment Contract Copy'),
 'Default what-to-bring list');

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
