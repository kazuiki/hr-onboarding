import { query, type Row } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';
import { medicalClinicFromRow } from '@/lib/onboarding';

/** Signed-in hire: everything the dashboard needs in one call. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);

  const profile = await query<Row>(
    `SELECT e.id, e.employee_number, e.position, e.department, e.manager_name,
            e.start_date, e.access_window_days, e.status, e.avatar_url,
            e.welcome_message, e.completion_pct, e.orientation_watched, e.created_at,
            u.email, u.full_name
     FROM employees e JOIN users u ON u.id = e.id WHERE e.id = ?`,
    [user.id]
  );
  if (profile.length === 0) return jsonError('Onboarding record not found.', 404);

  const tasks = await query<Row>(
    `SELECT t.id, t.title, t.description, t.category, t.status, t.required,
            t.display_order, t.has_download, t.template_file_name, t.template_file_path,
            t.file_name, t.feedback, t.submitted_at, t.reviewed_at
     FROM onboarding_tasks t WHERE t.employee_id = ? ORDER BY t.display_order ASC`,
    [user.id]
  );
  const files = await query<Row>(
    `SELECT id, task_id, file_name, file_path, file_size, mime_type, status, created_at
     FROM task_files WHERE employee_id = ? ORDER BY created_at DESC`,
    [user.id]
  );
  const formSubmissions = await query<Row>(
    `SELECT id, form_type, form_data, status, submitted_at
     FROM form_submissions WHERE employee_id = ? ORDER BY submitted_at DESC`,
    [user.id]
  );
  const submissionHistory = await query<Row>(
    `SELECT h.id, h.item_kind, h.item_key, h.item_label, h.category,
            h.file_name, h.file_path, h.action, h.created_at,
            (tf.id IS NOT NULL OR h.item_kind = 'form') AS file_present
     FROM submission_history h
     LEFT JOIN task_files tf
       ON tf.employee_id = h.employee_id AND tf.file_path = h.file_path AND h.file_path IS NOT NULL
     WHERE h.employee_id = ? ORDER BY h.created_at DESC`,
    [user.id]
  );
  const shared = await query<Row>(
    `SELECT slot, file_name, file_path, file_size, mime_type, notes, updated_at
     FROM shared_files WHERE employee_id = ?`,
    [user.id]
  );
  const firstDayChecks = await query<Row>(
    `SELECT item_key, is_checked FROM first_day_checklist WHERE employee_id = ?`,
    [user.id]
  );
  // Per-hire clinic override; null until HR saves one (or the table is
  // not imported yet) — the dashboard then shows the built-in defaults.
  let medicalClinic = null;
  try {
    const rows = await query<Row>(
      `SELECT clinic_name, clinic_address, clinic_phone, clinic_hours
       FROM employee_medical_content WHERE employee_id = ?`,
      [user.id]
    );
    medicalClinic = medicalClinicFromRow(rows[0] ?? null);
  } catch {
    medicalClinic = null;
  }
  const notifications = await query<Row>(
    `SELECT id, type, title, body, link_section, task_id, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    [user.id]
  );
  const unread = await query<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0`,
    [user.id]
  );
  const threads = await query<Row>(
    `SELECT id, subject_type, subject_title, task_id, status, updated_at
     FROM message_threads WHERE employee_id = ? ORDER BY updated_at DESC`,
    [user.id]
  );
  let messages: Row[] = [];
  if (threads.length > 0) {
    const ids = threads.map((t) => t.id);
    messages = await query<Row>(
      `SELECT id, thread_id, sender_id, sender_role, body, created_at FROM messages
       WHERE thread_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`,
      ids as unknown[]
    );
  }

  return Response.json({
    employee: profile[0],
    tasks,
    files,
    formSubmissions,
    submissionHistory,
    sharedFiles: shared,
    firstDayChecks,
    medicalClinic,
    notifications,
    unreadCount: Number(unread[0]?.n ?? 0),
    threads,
    messages,
  });
}
