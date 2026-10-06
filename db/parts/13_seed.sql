-- =========================================================================
-- PART 13 : seed (demo accounts + John's packet, mirrors current mock state)
-- Import LAST (parts 00-12 first).
-- Demo logins: john.arcas@philkoei.com.ph / password123 (employee)
--              maria.santos@philkoei.com.ph / password123 (employee)
--              elena.gomez@philkoei.com.ph / hrpassword123 (HR)
-- CHANGE passwords right after import:
--   UPDATE users SET password_hash = SHA2('new-secret', 256) WHERE email = ...;
-- =========================================================================
USE hr_onboarding;

INSERT INTO users (id, email, password_hash, role, full_name, avatar_url) VALUES
('emp-001', 'john.arcas@philkoei.com.ph', SHA2('password123', 256), 'employee', 'John Pritch L. Arcas', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'),
('emp-002', 'maria.santos@philkoei.com.ph', SHA2('password123', 256), 'employee', 'Maria Santos', NULL),
('hr-001', 'elena.gomez@philkoei.com.ph', SHA2('hrpassword123', 256), 'hr_manager', 'Elena Gomez', NULL);

INSERT INTO employees (id, employee_number, position, department, manager_name, start_date, welcome_message, completion_pct, orientation_watched) VALUES
('emp-001', 'PKI-2026-0842', 'Senior Infrastructure Engineer', 'Civil & Environmental Engineering', 'Engr. Roberto Cruz', '2026-10-01', 'Mabuhay and welcome to Philkoei International, Inc.!', 0, 1),
('emp-002', 'PKI-2026-0843', 'Junior Structural BIM Specialist', 'Structural Design & Drafting', 'Engr. Roberto Cruz', '2026-10-15', 'Welcome to Philkoei, Maria!', 25, 0);

INSERT INTO onboarding_packets (id, employee_id, welcome_message, completion_pct, orientation_watched) VALUES
('pkt-001', 'emp-001', 'Mabuhay and welcome to Philkoei International, Inc.!', 0, 1),
('pkt-002', 'emp-002', 'Welcome to Philkoei, Maria!', 25, 0);

INSERT INTO onboarding_tasks (id, packet_id, employee_id, title, description, category, status, required, display_order, has_download, file_name, feedback, submitted_at) VALUES
('req-app-form',  'pkt-001', 'emp-001', 'Employment Application Form', 'Official Philkoei Application Form with personal and employment background.', 'document', 'not_started', 1, 1, 1, NULL, NULL, NULL),
('req-psa-birth', 'pkt-001', 'emp-001', 'PSA Birth Certificate', 'Official Philippine Statistics Authority (PSA) issued Birth Certificate copy.', 'document', 'needs_changes', 1, 2, 0, 'PSA-birth-cert.jpg', 'The uploaded scan is blurred and the lower portion is cut off. Please re-upload a clear, complete copy.', NOW()),
('req-marriage-cert', 'pkt-001', 'emp-001', 'Marriage Certificate', 'PSA issued Marriage Certificate (required only for married employees).', 'document', 'not_started', 0, 3, 0, NULL, NULL, NULL),
('req-sss',       'pkt-001', 'emp-001', 'SSS Form E1 / SSS ID', 'Social Security System (SSS) Form E-1, digitized ID, or verified static member profile.', 'document', 'not_started', 1, 4, 0, NULL, NULL, NULL),
('req-philhealth','pkt-001', 'emp-001', 'PhilHealth MDR', 'Updated PhilHealth Member Data Record or official PhilHealth ID copy.', 'document', 'not_started', 1, 5, 0, NULL, NULL, NULL),
('req-photo',     'pkt-001', 'emp-001', '2x2 / 1x1 Photo', 'Formal corporate portrait with white background for company ID printing and records.', 'photo', 'not_started', 1, 6, 0, NULL, NULL, NULL),
('req-bir-2316',  'pkt-001', 'emp-001', 'BIR Form 2316', 'Certificate of Compensation Payment / Tax Withheld from immediate previous employer (current year).', 'document', 'not_started', 1, 7, 0, NULL, NULL, NULL),
('req-pagibig',   'pkt-001', 'emp-001', 'PAG-IBIG MDR', 'HDMF Member Data Record showing Pag-IBIG MID number and transaction details.', 'document', 'not_started', 1, 8, 0, NULL, NULL, NULL),
('req-bir-1902',  'pkt-001', 'emp-001', 'BIR Form 1902 / TIN ID', 'Application for Registration or official Taxpayer Identification Number card.', 'document', 'not_started', 1, 9, 0, NULL, NULL, NULL),
('req-diploma',   'pkt-001', 'emp-001', 'Diploma', 'Official College / University Graduation Diploma (clear authenticated scan).', 'document', 'not_started', 1, 10, 0, NULL, NULL, NULL),
('req-tor',       'pkt-001', 'emp-001', 'Transcript of Records', 'Complete Official Transcript of Records (TOR) with school seal / registrar validation.', 'document', 'not_started', 1, 11, 0, NULL, NULL, NULL),
('req-prc',       'pkt-001', 'emp-001', 'PRC License', 'Professional Regulation Commission (PRC) License identification card (front and back).', 'document', 'not_started', 0, 12, 0, NULL, NULL, NULL),
('req-nbi',       'pkt-001', 'emp-001', 'NBI Clearance', 'Valid multi-purpose NBI Clearance certificate issued within the last 6 months.', 'document', 'not_started', 1, 13, 0, NULL, NULL, NULL),
('req-coe',       'pkt-001', 'emp-001', 'Certificate of Employment', 'Certificate of Employment (COE) and clearance from previous employer/s.', 'document', 'not_started', 0, 14, 0, NULL, NULL, NULL),
('task-med-1',    'pkt-001', 'emp-001', 'Medical Examination and Health Clearance', 'Complete Pre-Employment Medical Examination (PEME) at accredited diagnostic clinic.', 'medical', 'not_started', 1, 15, 0, NULL, NULL, NULL),
('task-firstday-1','pkt-001', 'emp-001', 'First Day Readiness and Orientation', 'Review arrival schedule, dress code, office reporting desk, and welcome guide.', 'first_day', 'not_started', 1, 16, 0, NULL, NULL, NULL),
('task-privacy-1','pkt-001', 'emp-001', 'Data Privacy Policy and Consent', 'Read and legally acknowledge the Philkoei Employee Privacy Policy and IP guidelines.', 'privacy', 'not_started', 1, 17, 0, NULL, NULL, NULL);

INSERT INTO task_files (id, task_id, employee_id, file_name, file_path, file_size, mime_type, status, uploaded_by) VALUES
('file-psa-001', 'req-psa-birth', 'emp-001', 'PSA-birth-cert.jpg', 'uploads/emp-001/PSA-birth-cert.jpg', 205926, 'image/jpeg', 'needs_changes', 'employee');

INSERT INTO privacy_policies (id, version, title, content, effective_date, is_current) VALUES
('pol-001', 'PKI-DP-2026-V3', 'Philkoei Employee Data Privacy Notice', 'Philkoei International, Inc. adheres to strict information security standards under Republic Act No. 10173 (Data Privacy Act of 2012). Personal and sensitive data are processed solely for lawful HR administration and held with database-level isolation. Full text ships in-app.', '2026-09-01', 1);

-- Seeded help thread (mirrors current chat: employee Q + HR answer).
INSERT INTO message_threads (id, employee_id, hr_id, subject_type, subject_title, status) VALUES
('thr-help-001', 'emp-001', 'hr-001', 'help', 'Accredited clinic branch in Alabang', 'resolved');
INSERT INTO messages (thread_id, sender_id, sender_role, body) VALUES
('thr-help-001', 'emp-001', 'employee', 'Question regarding accredited clinic branch in Alabang: Good day HR team! Is there an accredited branch of Hi-Precision in Alabang/Muntinlupa where I can conduct my medical exam?'),
('thr-help-001', 'hr-001', 'hr', 'Hi John! Yes, you may visit Hi-Precision Diagnostic Alabang branch located along Commerce Avenue. Just present the exact same Philkoei Referral Slip.');

-- Bell seed mirrors the PSA rejection demo (live, the trigger writes this).
INSERT INTO notifications (user_id, type, title, body, link_section, task_id) VALUES
('emp-001', 'rejection', 'PSA Birth Certificate needs changes.', 'The uploaded scan is blurred and the lower portion is cut off. Please re-upload a clear, complete copy.', 'pre_employment', 'req-psa-birth');

INSERT INTO audit_events (id, actor_id, actor_role, action, target_type, target_id, details) VALUES
(UUID(), 'hr-001', 'hr_manager', 'CREATE_EMPLOYEE', 'employee', 'emp-001', JSON_OBJECT('note', 'Created onboarding packet and assigned Standard Engineering Onboarding Template.'));
