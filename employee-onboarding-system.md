---
name: Employee Onboarding System Builder
description: Prompts for designing and implementing a role-based employee onboarding portal backed by Supabase.
---

# Employee Onboarding System Builder

## Primary Build Prompt

Copy the prompt below into Claude Code or another coding agent with access to the application workspace.

```text
Act as a senior product engineer, UX designer, and Supabase architect. Build a complete employee onboarding portal from the requirements below. Work inside the existing repository and follow its current framework, coding conventions, and design system when they exist.

## How to work

1. Inspect the repository before editing anything. Identify the framework, entry points, routing, existing authentication, styling system, test setup, and environment-variable conventions.
2. Do not replace existing architecture without a concrete reason. If the repository is empty, choose a practical web stack and explain the choice briefly.
3. Create a short implementation plan, then implement the smallest complete vertical slice: authentication, roles, onboarding packet, document storage, and employee progress.
4. Use Supabase as the backend:
   - Supabase Auth for sign-in and account identity.
   - Supabase Postgres for employees, onboarding packets, tasks, documents, forms, and progress.
   - Supabase Storage for uploaded files and employee photos.
   - Row Level Security on every user-accessible table.
   - Storage policies that prevent one employee from reading another employee's private files.
5. Never place the Supabase service-role key in browser code. Use the public anonymous key only where appropriate, and keep privileged operations server-side.
6. Use migrations or the repository's established database workflow. Do not rely on undocumented manual dashboard steps.
7. Validate each meaningful slice with the narrowest available test, typecheck, lint, or local run command before moving on.
8. At the end, report changed files, database migrations, environment variables, commands run, and any remaining decisions.

## Product goal

Create a secure onboarding workspace for a company such as Philkoei International, Inc. Company name, office details, branding, and legal-policy text must be configurable rather than hard-coded into business logic.

There are two roles:

- HR Manager or HR Assistant: creates employees, assigns onboarding requirements, uploads or manages onboarding resources, reviews submissions, and tracks completion.
- Employee: signs in, views a personalized welcome page, completes assigned forms, uploads required files, submits an ID photo, watches the company introduction, and sees first-day instructions.

## Employee onboarding experience

The employee landing page must present these sections in a clear, readable order:

1. Welcome
   - Employee name, position, department, manager or supervisor, starting date, and employee number.
   - A short welcome message and a clear indication of what must be completed before the first day.
2. Employment Forms
   - Assigned forms that can be completed online or downloaded as editable PDFs when needed.
   - Per-form status: not started, in progress, submitted, needs changes, or approved.
3. ID Photo
   - Upload an employee photo with file type, size, and basic image validation.
   - Include a sample-photo resource and concise smart-casual or formal photo guidance.
4. Employment Requirements
   - Upload required documents such as government IDs, certificates, clearances, licenses, and other company-defined requirements.
   - Allow HR to configure the requirement list per employee or onboarding template.
   - Show missing, uploaded, under review, approved, and rejected states.
5. Medical
   - Provide the assigned medical or referral form and clinic instructions.
   - Support a clinic schedule and company-defined medical-expense note without hard-coding a particular clinic.
   - Treat medical files as sensitive and restrict them to authorized HR users and the employee.
6. First-Day Preparation
   - Show dress code, office location, arrival time, what to bring, and a short company-introduction video.
   - The reference material uses smart-casual attire, an 8:00 AM arrival, and a corporate-finance office location. Store these as editable onboarding content.
7. Data Privacy
   - Show the company's privacy notice, retention guidance, and a statement explaining why submitted personal data is collected and used.
   - Require acknowledgement where company policy requires it and record the acknowledgement timestamp and policy version.
8. Need Help?
   - Show HR contact details and an easy way to ask a question or request clarification.
9. Completion
   - Show overall progress, outstanding tasks, and a clear completion state once all required items are approved or acknowledged.

Access should be available to new employees within the configured onboarding window, with the default reference requirement being access within one month before or after the start date. Make the window configurable and show a helpful locked or expired state when access is not allowed.

## HR experience

Provide an HR dashboard that supports:

- Employee list with search, filtering, start-date sorting, role, and onboarding status.
- Create and invite an employee, assign department, manager, start date, and employee number.
- Create reusable onboarding templates and assign forms, document requirements, videos, medical instructions, first-day details, and privacy content.
- Upload and version editable PDFs, reference documents, sample photos, and videos.
- Review submissions, approve or reject items, leave feedback, and see an audit history.
- See progress by employee and identify overdue, missing, rejected, or expiring items.
- Disable or archive an onboarding record without deleting legally relevant audit history.

## Data model requirements

Design a normalized schema and create migrations for the entities needed by the workflow. At minimum, cover:

- profiles and roles
- employees
- onboarding records
- onboarding templates and template assignments
- onboarding sections or tasks
- forms and form submissions
- document requirements and employee document submissions
- employee photo submissions
- medical instructions or referrals
- first-day content
- privacy notices and acknowledgements
- help requests
- uploaded asset metadata
- review decisions
- audit events

Include created-at, updated-at, ownership, status, and soft-archive fields where appropriate. Use enums or constrained values for workflow statuses. Store file metadata and storage paths in Postgres; store file contents in Supabase Storage.

## Security and privacy requirements

- Enable RLS for all application tables.
- Employees may read and update only their own onboarding data and may insert only their own submissions.
- Employees may not approve their own submissions, change their role, access other employees, or enumerate private storage paths.
- HR users may access records according to role and organization scope. Keep the policy easy to audit.
- Validate file extension, MIME type, size, and ownership on upload.
- Use private Storage buckets for identity, medical, and employment documents. Use signed URLs with short expiration for downloads and previews.
- Do not log document contents, medical details, access tokens, or personal data unnecessarily.
- Add audit events for invitations, sign-ins where appropriate, uploads, downloads if supported, status changes, approvals, rejections, privacy acknowledgements, and archival.
- Use generic authentication error messages and avoid exposing whether an account exists.
- Include retention and deletion hooks as configurable policy points; do not silently delete records that may be needed for compliance.

## UX and design direction

Use the attached paper references as functional inspiration, not as a pixel-perfect requirement. Preserve the useful structure: a compact employee-information header, clearly separated numbered sections, prominent section labels, short instructions, and visible progress. Improve it for a responsive web interface with:

- A calm, professional HR tone.
- Strong information hierarchy and scan-friendly spacing.
- Responsive layouts for desktop and mobile.
- Accessible labels, focus states, keyboard navigation, and sufficient color contrast.
- Clear empty, loading, error, locked, expired, rejected, and success states.
- File upload progress and retry behavior.
- Confirmation before destructive or irreversible HR actions.
- No fake data in production paths; seed data may be clearly marked for local development.

## Definition of done

- A new employee can be invited, sign in, view the correct onboarding packet, complete a form, upload a file, acknowledge privacy content, and see progress.
- An HR user can create the employee, assign requirements, review the uploaded items, approve or reject them, and see the employee's updated status.
- Unauthorized cross-employee reads and writes are blocked by automated tests or documented local verification.
- Supabase migrations, RLS policies, Storage policies, and environment setup are included in the repository's normal workflow.
- The application handles missing configuration and backend errors without exposing secrets or raw database errors to end users.
- The implementation includes focused tests for role access, onboarding-window rules, submission status transitions, and required-file validation.
- The final response includes setup steps, required environment variables, migration commands, test commands, and any assumptions that still need a product decision.

Begin by inspecting the repository and reporting the detected stack, relevant existing files, and the first implementation slice. Then proceed with the implementation; do not stop at a high-level proposal unless a required secret, permission, or product decision genuinely blocks the work.
```

## Follow-Up Prompt: Supabase Schema and RLS Review

```text
Review the employee onboarding system's Supabase implementation as a database security specialist.

Inspect all migrations, table definitions, foreign keys, enums, indexes, RLS policies, Storage bucket policies, server-side operations, and client-side Supabase usage. Verify that:

- Every application table has RLS enabled.
- Employees can access only their own onboarding records and submissions.
- HR Manager and HR Assistant permissions are explicit and scoped.
- Employees cannot self-approve, alter roles, read other employees' files, or bypass the onboarding access window.
- Private files use private buckets and short-lived signed URLs.
- File metadata ownership is checked against the authenticated user.
- Status transitions and audit events cannot be forged from the browser.
- Medical and identity documents have no accidental public policy.
- Service-role operations are isolated to trusted server code.

Report findings by severity with file and migration references. Fix confirmed issues in the smallest safe change, then rerun the narrowest available database or application validation.
```

## Follow-Up Prompt: UX and Accessibility Review

```text
Review the employee onboarding portal against the attached onboarding references and the requirements in the implementation prompt.

Test the employee and HR workflows on desktop and mobile. Check navigation, section hierarchy, progress visibility, form completion, upload states, review feedback, locked or expired access, loading states, errors, keyboard navigation, focus order, labels, contrast, responsive overflow, and screen-reader semantics.

List concrete issues with the affected route or component and the user impact. Fix the highest-impact issues without changing the underlying permissions model. Then run the focused UI tests or local verification and report what remains.
```

## Follow-Up Prompt: Acceptance Test Review

```text
Act as a QA engineer for the employee onboarding portal. Create and run focused acceptance tests for these journeys:

1. HR creates and invites an employee.
2. The employee signs in and sees only the assigned onboarding packet.
3. The employee completes and submits an assigned form.
4. The employee uploads a valid document and receives a useful validation error for an invalid file.
5. HR reviews, rejects with feedback, and later approves a submission.
6. The employee acknowledges the current privacy notice.
7. The onboarding window blocks access outside its configured dates.
8. A second employee cannot read or modify the first employee's records or private files.
9. Archived employees and audit history behave as specified.

Prefer existing test tools and fixtures. Do not weaken security policies to make a test pass. Report failures with reproduction steps and fix only issues caused by the implementation under review.
```

## Prompt Author Notes

- The paper references are requirements evidence, not a complete technical specification.
- Replace company-specific names, addresses, contact details, legal language, schedules, and policy text with configurable content before production use.
- Medical records, identity documents, and employment records may be regulated or sensitive. Confirm retention, access, export, and deletion requirements with the responsible legal or compliance owner.
- Keep Supabase credentials and policies environment-specific. Never paste secrets into prompts, source control, screenshots, or issue comments.