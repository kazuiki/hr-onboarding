# RULES — HR Onboarding Portal Governance

## Role / Authority

- **Role:** Definition of coding standards, engineering principles, and security governance rules.
- **Authority:** All code must conform to these rules. Deviations require an explicit architectural review.

---

## 1. Engineering Principles

- **Security First:** Never expose secrets or administrative database keys in frontend code. Use server-side actions for sensitive tasks.
- **Strict Typing:** All code must use TypeScript with strict mode enabled. Avoid `any`.
- **Modularity:** Keep components small, reusable, and single-purpose.
- **Progressive Enhancement:** Ensure core functionality works (at least basically) if JS interaction fails.

## 2. Coding Standards

- **Next.js:** Prefer Server Components by default. Use `"use client"` only for interactivity-heavy components.
- **Tailwind:** Utilize Tailwind classes for all styling. No CSS modules unless strictly necessary.
- **Organization:** Feature-based directory structure inside `src/`.
- **Validation:** Always validate form inputs (client-side for UX, server-side for security).

## 3. Security Rules
- **No Self-Approval:** Implementation must strictly block an employee from approving their own document submissions.
- **Data Isolation:** Every database query must incorporate RLS-compliant filtering to ensure users can only ever access their own data.
- **Bucket Security:** Files must be stored in private buckets and accessed only via short-lived signed URLs.
- **Audit Logging:** Every sensitive status change (especially approval/rejection) must trigger an `audit_log` event.
