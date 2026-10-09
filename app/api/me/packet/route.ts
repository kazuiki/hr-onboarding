import { query, type Row } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';

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
  const shared = await query<Row>(
    `SELECT slot, file_name, file_path, file_size, mime_type, notes, updated_at
     FROM shared_files WHERE employee_id = ?`,
    [user.id]
  );
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
    sharedFiles: shared,
    notifications,
    unreadCount: Number(unread[0]?.n ?? 0),
    threads,
    messages,
  });
}
