# HR Onboarding — MySQL Database (phpMyAdmin)

One schema, one file per table. Import in numeric order — every file runs
`USE hr_onboarding;` so everything lands in the same schema.

## Import order (phpMyAdmin > Import > Go, one file at a time)

| # | File | Contains |
|---|------|----------|
| 00 | `00_database.sql` | `hr_onboarding` schema |
| 01 | `01_users.sql` | Login accounts (employees + HR admins) |
| 02 | `02_employees.sql` | Employment profiles (1:1 with users) |
| 03 | `03_company_settings.sql` | Editable company configuration |
| 04 | `04_onboarding_templates.sql` | Reusable requirement sets |
| 05 | `05_template_tasks.sql` | Template line items |
| 06 | `06_onboarding_packets.sql` | One onboarding instance per hire |
| 07 | `07_onboarding_tasks.sql` | Checklist + review queue |
| 08 | `08_task_files.sql` | Upload metadata (paths only, never blobs) |
| 09 | `09_form_submissions.sql` | Online form answers (JSON) |
| 14 | `14_hr_assets.sql` | HR resource library |
| 15 | `15_shared_files.sql` | HR→employee download slots |
| 16 | `16_message_threads.sql` | Help + file threads |
| 17 | `17_messages.sql` | Chat rows |
| 18 | `18_notifications.sql` | Bell feed |
| 19 | `19_review_decisions.sql` | Approve/reject history |
| 20 | `20_audit_events.sql` | Append-only compliance log |
| 21 | `21_sessions.sql` | Login sessions |
| 22 | `22_views.sql` | `v_review_queue`, `v_employee_progress`, `v_audit_log` |
| 99 | `99_seed.sql` | Admin account + settings + template (no demo hires) |

Medical, First Day and Data Privacy sections are static design content —
they have no tables. Their checklist tasks (`task-med-1`, `task-firstday-1`,
`task-privacy-1` in `onboarding_tasks`) still carry the database state.

Requires MySQL 5.7+ / MariaDB 10.2+ (JSON columns), InnoDB.

## First login

- Email: `hr.admin@philkoei.com.ph` — Password: `ChangeMe123!`
- Change it immediately after first sign-in (or in phpMyAdmin):
  `UPDATE users SET password_hash = SHA2('your-new-password', 256) WHERE email = 'hr.admin@philkoei.com.ph';`
- Passwords are SHA2-256 digests for this school build. For production,
  hash with bcrypt/argon2 in the app and store that string instead.

## App database user (least privilege)

Run once as root in phpMyAdmin > SQL (replace the password with a strong one,
then put the same values in the app's `.env.local` as `DB_*`):

```sql
CREATE USER IF NOT EXISTS 'hr_app'@'localhost' IDENTIFIED BY 'change-this-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON hr_onboarding.* TO 'hr_app'@'localhost';
FLUSH PRIVILEGES;
```

The app never connects as root and never receives the root password.

## Security notes

- The app connects with a limited MySQL user (see `.env`: `DB_USER`),
  never root from the app. Grant it only
  `SELECT, INSERT, UPDATE, DELETE` on `hr_onboarding.*`.
- File bytes are never in the database — only paths under
  `public/uploads/<employee_id>/`. The API validates extension, MIME type
  and size before saving; the audit log never records file contents,
  medical details or passwords.
- `audit_events` is append-only by convention: the app user has no
  UPDATE/DELETE need on it outside of account removal cascades.
- Keep `.env.local` (database credentials) out of git — it is already
  covered by `.gitignore` (`DB_*` variables live there, not in code).
