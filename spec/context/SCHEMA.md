# SCHEMA — HR Onboarding Portal Database

## Role / Authority

- **Role:** Definition of the database schema, storage structure, and security policies.
- **Authority:** All Supabase migrations must strictly adhere to this schema. Changes require updating this document and validation against existing RLS policies.

---

## 1. Entity Relationship Overview

The system is built on a normalized Postgres schema within Supabase.

*   `profiles`: Extends `auth.users` for role/metadata.
*   `employees`: Core employee data linked to `profiles`.
*   `onboarding_templates` & `assignments`: Configurable packets of work.
*   `submissions` (Forms, Documents, Photos, Medical): Linked to tasks.
*   `audit_log`: System-wide immutable history of events.

---

## 2. Table Definitions

### profiles
- Holds user roles (`hr`, `employee`) and basic metadata.

### employees
- Linked to `profiles.id`. Contains `employee_number`, `department`, `manager_id`, `start_date`, `status` (active/archived).

### onboarding_tasks
- Defines required items within a template (type: `form`, `document`, `photo`, `medical`, `privacy`, `video`).

### submissions
- Stores status of an employee task (`not_started`, `in_progress`, `pending_review`, `approved`, `rejected`).
- Stores `file_path` for uploaded documents.

---

## 3. Row-Level Security (RLS) Policies

All tables have RLS enabled.

- **Employees:**
    - `SELECT`: `auth.uid() = id`, or `is_hr()`.
- **Submissions:**
    - `SELECT`: `(auth.uid() = employee_id)`, or `is_hr()`.
    - `INSERT`: `(auth.uid() = employee_id)`.
    - `UPDATE`: `(auth.uid() = employee_id)` (submit), or `is_hr()` (approve/reject).

---

## 4. Supabase Storage Structure

- **Bucket: `onboarding_private`**
    - Stores identity, medical, and employment documents.
    - Security: Private bucket. Access requires server-side generation of signed URLs.
- **Bucket: `public_assets`**
    - Stores introduction videos, template forms, sample photos.
    - Security: Authenticated read access.

---

## 5. Security Rules

1.  **HR Role:** Determined by `profiles.role = 'hr'`.
2.  **Strict Isolation:** Employees can only see their own `submissions`.
3.  **Audit:** An `audit_events` table captures all status transitions and sensitive actions, preventing data tampering.
