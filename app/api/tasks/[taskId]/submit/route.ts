import { query, newId, auditEvent, saveUpload, type Row } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';

interface Ctx {
  params: Promise<{ taskId: string }>;
}

const DOC_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'ppt', 'pptx'];
const PHOTO_EXT = ['jpg', 'jpeg', 'png'];
const DOC_MAX = 10 * 1024 * 1024;
const PHOTO_MAX = 5 * 1024 * 1024;

/** Hire: upload submission files for one of their own requirements. */
export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);
  const { taskId } = await ctx.params;

  const task = await query<Row & { category: string; title: string }>(
    `SELECT id, title, category FROM onboarding_tasks WHERE id = ? AND employee_id = ?`,
    [taskId, user.id]
  );
  if (task.length === 0) return jsonError('Requirement not found.', 404);

  const form = await req.formData();
  const incoming = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (incoming.length === 0) return jsonError('Choose at least one file.');

  const isPhoto = task[0].category === 'photo';
  const allowed = isPhoto ? PHOTO_EXT : DOC_EXT;
  const maxBytes = isPhoto ? PHOTO_MAX : DOC_MAX;
  for (const file of incoming) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!allowed.includes(ext)) return jsonError(`"${file.name}" is not an accepted type.`);
    if (file.size > maxBytes) {
      return jsonError(`"${file.name}" exceeds the ${isPhoto ? '5MB' : '10MB'} limit.`);
    }
  }

  const savedNames: string[] = [];
  for (const file of incoming) {
    const saved = await saveUpload(file, user.id);
    savedNames.push(saved.fileName);
    await query(
      `INSERT INTO task_files (id, task_id, employee_id, file_name, file_path, file_size, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'employee')`,
      [newId(), taskId, user.id, saved.fileName, saved.filePath, saved.fileSize, saved.mimeType]
    );
  }

  await query(
    `UPDATE onboarding_tasks
     SET status = 'submitted', file_name = ?, submitted_at = NOW(), feedback = NULL
     WHERE id = ? AND employee_id = ?`,
    [savedNames[0], taskId, user.id]
  );
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: 'employee',
    action: 'UPLOAD',
    targetType: 'task',
    targetId: taskId,
    details: { files: savedNames },
  });

  return Response.json({ ok: true, files: savedNames });
}
