import { query, type Row } from '@/lib/server-db';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';

interface Ctx {
  params: Promise<{ id: string }>;
}

/** HR any hire, or a hire viewing their own record: profile + documents. */
export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  const { id } = await ctx.params;
  if (!isHr(user.role) && user.id !== id) return jsonError('Not allowed.', 403);

  const profile = await query<Row>(
    `SELECT e.id, e.employee_number, e.position, e.department, e.manager_name,
            e.start_date, e.access_window_days, e.status, e.avatar_url,
            e.welcome_message, e.completion_pct, e.orientation_watched,
            u.email, u.full_name
     FROM employees e JOIN users u ON u.id = e.id WHERE e.id = ?`,
    [id]
  );
  if (profile.length === 0) return jsonError('Employee not found.', 404);

  const tasks = await query<Row>(
    `SELECT t.id, t.title, t.description, t.category, t.status, t.required,
            t.display_order, t.has_download, t.template_file_name, t.template_file_path,
            t.file_name, t.feedback, t.submitted_at, t.reviewed_at,
            (SELECT f.file_name FROM task_files f
             WHERE f.task_id = t.id AND f.employee_id = t.employee_id
             ORDER BY f.created_at DESC LIMIT 1) AS latest_file,
            (SELECT f.file_path FROM task_files f
             WHERE f.task_id = t.id AND f.employee_id = t.employee_id
             ORDER BY f.created_at DESC LIMIT 1) AS latest_file_path,
            (SELECT f.mime_type FROM task_files f
             WHERE f.task_id = t.id AND f.employee_id = t.employee_id
             ORDER BY f.created_at DESC LIMIT 1) AS latest_mime
     FROM onboarding_tasks t WHERE t.employee_id = ?
     ORDER BY t.display_order ASC`,
    [id]
  );
  const files = await query<Row>(
    `SELECT id, task_id, file_name, file_path, file_size, mime_type, status,
            uploaded_by, created_at
     FROM task_files WHERE employee_id = ? ORDER BY created_at DESC`,
    [id]
  );
  const shared = await query<Row>(
    `SELECT slot, file_name, file_path, file_size, mime_type, notes, updated_at
     FROM shared_files WHERE employee_id = ?`,
    [id]
  );
  const reviews = await query<Row>(
    `SELECT r.task_id, r.decision, r.comment, r.created_at, u.full_name AS reviewer_name
     FROM review_decisions r LEFT JOIN users u ON u.id = r.reviewer_id
     WHERE r.employee_id = ? ORDER BY r.created_at DESC LIMIT 50`,
    [id]
  );

  return Response.json({ employee: profile[0], tasks, files, sharedFiles: shared, reviews });
}
