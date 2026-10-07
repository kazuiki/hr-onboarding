-- =====================================================================
-- 22_views.sql — ready-made datasets for the HR screens
-- Import: 23rd. Requires: 01_users, 02_employees, 06_onboarding_packets,
--          07_onboarding_tasks, 20_audit_events.
--
-- v_review_queue      -> submitted + needs_changes items with names
-- v_employee_progress -> per-hire required/approved counts and percent
-- v_audit_log         -> newest 10 audit events (audit page, page 1;
--                        the app pages further with LIMIT/OFFSET itself)
-- =====================================================================
USE hr_onboarding;

CREATE OR REPLACE VIEW v_review_queue AS
SELECT t.id, t.title, t.description, t.category, t.status, t.required,
       t.file_name, t.feedback, t.submitted_at, t.reviewed_at,
       e.id AS employee_id, e.employee_number, u.full_name AS employee_name,
       e.department, e.start_date,
       r.full_name AS reviewed_by_name
FROM onboarding_tasks t
JOIN employees e ON e.id = t.employee_id
JOIN users u ON u.id = e.id
LEFT JOIN users r ON r.id = t.reviewed_by
WHERE t.status IN ('submitted', 'needs_changes')
ORDER BY t.updated_at DESC;

CREATE OR REPLACE VIEW v_employee_progress AS
SELECT e.id AS employee_id, e.employee_number, u.full_name AS employee_name,
       e.department, e.status, e.start_date,
       COUNT(CASE WHEN t.required = 1 THEN 1 END) AS required_total,
       COUNT(CASE WHEN t.required = 1 AND t.status = 'approved' THEN 1 END) AS approved_count,
       CASE WHEN COUNT(CASE WHEN t.required = 1 THEN 1 END) = 0 THEN 100
            ELSE ROUND(COUNT(CASE WHEN t.required = 1 AND t.status = 'approved' THEN 1 END) * 100.0
                       / COUNT(CASE WHEN t.required = 1 THEN 1 END)) END AS progress_pct
FROM employees e
JOIN users u ON u.id = e.id
LEFT JOIN onboarding_tasks t ON t.employee_id = e.id
GROUP BY e.id, e.employee_number, u.full_name, e.department, e.status, e.start_date;

CREATE OR REPLACE VIEW v_audit_log AS
SELECT id, actor_name, actor_role, action, target_type, target_id, details, created_at
FROM audit_events
ORDER BY created_at DESC
LIMIT 10;
