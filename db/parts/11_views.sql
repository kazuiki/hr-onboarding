-- =========================================================================
-- PART 11 : views (drop-in datasets for existing pages)
-- v_review_queue      -> /hr/reviews (submitted + needs_changes, joined names)
-- v_employee_progress -> /hr overview KPIs + employee directory bars
-- Requires: parts 01, 02, 04.
-- =========================================================================
USE hr_onboarding;

CREATE OR REPLACE VIEW v_review_queue AS
SELECT t.id, t.title, t.description, t.category, t.status, t.required,
       t.file_name, t.feedback, t.submitted_at, t.reviewed_at,
       e.id AS employee_id, e.employee_number, u.full_name AS employee_name,
       r.full_name AS reviewed_by_name
FROM onboarding_tasks t
JOIN employees e ON e.id = t.employee_id
JOIN users u ON u.id = e.id
LEFT JOIN users r ON r.id = t.reviewed_by
WHERE t.status IN ('submitted', 'needs_changes')
ORDER BY t.updated_at DESC;

CREATE OR REPLACE VIEW v_employee_progress AS
SELECT e.id AS employee_id, e.employee_number, u.full_name AS employee_name,
       COUNT(CASE WHEN t.required = 1 THEN 1 END) AS required_total,
       COUNT(CASE WHEN t.required = 1 AND t.status = 'approved' THEN 1 END) AS approved_count,
       CASE WHEN COUNT(CASE WHEN t.required = 1 THEN 1 END) = 0 THEN 100
            ELSE ROUND(COUNT(CASE WHEN t.required = 1 AND t.status = 'approved' THEN 1 END) * 100.0
                       / COUNT(CASE WHEN t.required = 1 THEN 1 END)) END AS progress_pct
FROM employees e
JOIN users u ON u.id = e.id
LEFT JOIN onboarding_tasks t ON t.employee_id = e.id
GROUP BY e.id, e.employee_number, u.full_name;
