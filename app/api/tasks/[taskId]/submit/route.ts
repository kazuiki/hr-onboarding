import { unlink } from 'fs/promises';
import { query, newId, auditEvent, notifyHrSubmission, notifyHrRemoval, saveUpload, diskPathForUpload, fileSignatureOk, type Row } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';
import { notifyHrOfDocumentSubmission } from '@/lib/mailer';

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
    const head = new Uint8Array(await file.arrayBuffer());
    if (!fileSignatureOk(file.name, head)) {
      return jsonError(`"${file.name}" content does not match its file type.`);
    }
  }

  // Re-upload replaces the previous submission: drop old rows + disk files
  // (e.g. after an HR rejection) so only the newest files remain.
  const previous = await query<Row & { file_path: string }>(
    `SELECT file_path FROM task_files WHERE task_id = ? AND employee_id = ?`,
    [taskId, user.id]
  );
  await query(`DELETE FROM task_files WHERE task_id = ? AND employee_id = ?`, [taskId, user.id]);
  for (const row of previous) {
    const oldPath = typeof row.file_path === 'string' ? row.file_path : '';
    const abs = diskPathForUpload(oldPath);
    if (!abs) continue;
    try {
      await unlink(abs);
    } catch {
      // Already gone from disk — row is already deleted above.
    }
  }

  const savedNames: string[] = [];
  const savedPaths: { fileName: string; filePath: string }[] = [];
  for (const file of incoming) {
    const saved = await saveUpload(file, user.id);
    savedNames.push(saved.fileName);
    savedPaths.push({ fileName: saved.fileName, filePath: saved.filePath });
    await query(
      `INSERT INTO task_files (id, task_id, employee_id, file_name, file_path, file_size, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'employee')`,
      [newId(), taskId, user.id, saved.fileName, saved.filePath, saved.fileSize, saved.mimeType]
    );
  }
  for (const s of savedPaths) {
    await query(
      `INSERT INTO submission_history (id, employee_id, item_kind, item_key, item_label, category, file_name, file_path, action)
       VALUES (?, ?, 'requirement', ?, ?, ?, ?, ?, 'upload')`,
      [newId(), user.id, taskId, task[0].title, task[0].category, s.fileName, s.filePath]
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

  // Email HR (fire-and-forget safe: mailer never throws, missing
  // credentials just skip). Awaited so serverless doesn't cut it off.
  await notifyHrOfDocumentSubmission({
    employeeName: user.full_name,
    employeeEmail: user.email,
    employeeNumber: user.employee_number,
    documentName: task[0].title,
    fileNames: savedNames,
    kind: 'requirement',
  });

  // One collapsed bell item per hire: newer submissions refresh this single
  // unread row instead of stacking one notif per upload.
  await notifyHrSubmission(user.id, user.full_name, task[0].title, `${savedNames.length} file(s) uploaded`);

  return Response.json({ ok: true, files: savedNames });
}

/** Hire: remove one of their own uploaded files (or all files for the task). */
export async function DELETE(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);
  const { taskId } = await ctx.params;

  const task = await query<Row & { status: string; title: string; category: string }>(
    `SELECT id, title, status, category FROM onboarding_tasks WHERE id = ? AND employee_id = ?`,
    [taskId, user.id]
  );
  if (task.length === 0) return jsonError('Requirement not found.', 404);
  if (task[0].status === 'approved') {
    return jsonError('Already approved by HR. Ask HR to send it back for changes first.', 403);
  }

  const fileId = new URL(req.url).searchParams.get('fileId') || '';
  const existing = await query<Row & { id: string; file_name: string; file_path: string }>(
    fileId
      ? `SELECT id, file_name, file_path FROM task_files WHERE id = ? AND task_id = ? AND employee_id = ?`
      : `SELECT id, file_name, file_path FROM task_files WHERE task_id = ? AND employee_id = ?`,
    fileId ? [fileId, taskId, user.id] : [taskId, user.id]
  );
  if (existing.length === 0) return jsonError('No uploaded file to remove.', 404);

  const ids = existing.map((row) => String(row.id));
  await query(
    `DELETE FROM task_files WHERE id IN (${ids.map(() => '?').join(',')}) AND employee_id = ?`,
    [...ids, user.id] as unknown[]
  );
  for (const row of existing) {
    await query(
      `INSERT INTO submission_history (id, employee_id, item_kind, item_key, item_label, category, file_name, file_path, action)
       VALUES (?, ?, 'requirement', ?, ?, ?, ?, NULL, 'remove')`,
      [newId(), user.id, taskId, task[0].title, task[0].category, String(row.file_name ?? 'file')]
    );
    const oldPath = typeof row.file_path === 'string' ? row.file_path : '';
    const abs = diskPathForUpload(oldPath);
    if (!abs) continue;
    try {
      await unlink(abs);
    } catch {
      // Already gone from disk — row is already deleted above.
    }
  }

  const remaining = await query<Row & { file_name: string }>(
    `SELECT file_name FROM task_files WHERE task_id = ? AND employee_id = ? ORDER BY created_at DESC`,
    [taskId, user.id]
  );
  await query(
    `UPDATE onboarding_tasks
     SET status = CASE WHEN status IN ('submitted', 'needs_changes') THEN 'in_progress' ELSE status END,
         file_name = ?,
         submitted_at = CASE WHEN ? > 0 THEN submitted_at ELSE NULL END
     WHERE id = ? AND employee_id = ?`,
    [remaining.length > 0 ? String(remaining[0].file_name) : null, remaining.length, taskId, user.id]
  );
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: 'employee',
    action: 'REMOVE_UPLOAD',
    targetType: 'task',
    targetId: taskId,
    details: { removed: ids.length, remaining: remaining.length },
  });

  // HR bell: surface the removal on the same collapsed per-hire item so HR
  // knows the document they may have reviewed is gone.
  await notifyHrRemoval(user.id, user.full_name, task[0].title, `${ids.length} file(s) removed`);

  return Response.json({ ok: true, removed: ids.length });
}
