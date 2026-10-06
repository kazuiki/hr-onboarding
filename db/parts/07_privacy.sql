-- =========================================================================
-- PART 07 : privacy_policies + privacy_acknowledgements
-- Relationship: acknowledgements -> employees.id + policies.id (CASCADE).
-- Flow: bottom button "I Have Read and Understood..." INSERTs one row
--       pinning the exact policy version (UNIQUE per employee+policy).
-- Requires: 02_employees.sql
-- =========================================================================
USE hr_onboarding;

CREATE TABLE IF NOT EXISTS privacy_policies (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  version        VARCHAR(32) NOT NULL UNIQUE COMMENT 'e.g. PKI-DP-2026-V3',
  title          VARCHAR(255) NOT NULL,
  content        MEDIUMTEXT NOT NULL,
  effective_date DATE NOT NULL,
  is_current     TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS privacy_acknowledgements (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  employee_id     CHAR(36) NOT NULL,
  policy_id       CHAR(36) NOT NULL,
  policy_version  VARCHAR(32) NOT NULL,
  acknowledged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address      VARCHAR(64) NULL,
  user_agent      VARCHAR(255) NULL,
  CONSTRAINT fk_ack_emp FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_ack_policy FOREIGN KEY (policy_id)
    REFERENCES privacy_policies (id) ON DELETE CASCADE,
  UNIQUE KEY uq_ack_emp_policy (employee_id, policy_id)
) ENGINE=InnoDB;
