-- =====================================================================
-- 13_privacy_acknowledgements.sql — legal proof of consent
-- Import: 14th. Requires: 02_employees.sql, 12_privacy_policies.sql
--
-- One row per (employee, policy version), never updated — a new policy
-- version means a new row. Kept as evidence; never edited or deleted by
-- the app.
-- =====================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS privacy_acknowledgements (
  id              CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
  employee_id     CHAR(36) NOT NULL COMMENT 'FK -> employees.id',
  policy_id       CHAR(36) NOT NULL COMMENT 'FK -> privacy_policies.id, exact version read',
  policy_version  VARCHAR(32) NOT NULL COMMENT 'Denormalized version stamp',
  acknowledged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address      VARCHAR(64) NULL,
  user_agent      VARCHAR(255) NULL,
  CONSTRAINT fk_privacy_ack_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_privacy_ack_policy FOREIGN KEY (policy_id)
    REFERENCES privacy_policies (id) ON DELETE CASCADE,
  UNIQUE KEY uq_privacy_ack_emp_policy (employee_id, policy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
