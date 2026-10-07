import { unlink } from 'fs/promises';
import path from 'path';
import { query, newId, auditEvent, notifyUser, type Row } from '@/lib/server-db';
import { saveUpload } from '@/lib/server-db';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';
import { UPLOAD_DOC_TYPES } from '@/lib/onboarding';

interface Ctx {
  params: Promise<{ id: string }>;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'ppt', 'pptx'];

/** HR: share a company file — attaches to a requirement or fills a slot. */
export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || !isHr(user.role)) return jsonError('HR sign-in required.', 403);
  const { id: employeeId } = await ctx.params;

  const exists = await query(`SELECT id FROM employees WHERE id = ?`, [employeeId]);
  if (exists.length === 0) return jsonError('Employee not found.', 404);

  const form = await req.formData();
  const docTypeValue = String(form.get('docType') ?? '');
  const notes = String(form.get('notes') ?? '').trim().slice(0, 500);
  const file = form.get('file');
  const docType = UPLOAD_DOC_TYPES.find((t) => t.value === docTypeValue);
  if (!docType) return jsonError('Unknown document type.');
  if (!(file instanceof File) || file.size === 0) return jsonError('A file is required.');

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return jsonError('File type not allowed. Use PDF, DOC, DOCX, JPG, PNG or PPT.');
  if (file.size > MAX_BYTES) return jsonError('File exceeds the 10MB limit.');

  const saved = await saveUpload(file, employeeId);
  const target = docType.target;

  if (target.kind === 'task') {
    const match = await query<Row & { id: string; title: string }>(
      `SELECT id, title FROM onboarding_tasks
       WHERE employee_id = ? AND LOWER(title) LIKE ? ORDER BY display_order ASC LIMIT 1`,
      [employeeId, `%${target.keyword}%`]
    );
    if (match.length === 0) return jsonError('No matching requirement found for this hire.', 404);
    await query(
      `UPDATE onboarding_tasks SET has_download = 1, template_file_name = ?, template_file_path = ?
       WHERE id = ? AND employee_id = ?`,
      [saved.fileName, saved.filePath, match[0].id, employeeId]
    );
    await notifyUser({
      userId: employeeId,
      type: 'general',
      title: `New downloadable file: ${match[0].title}.`,
      body: notes || 'HR shared a new document with you.',
      linkSection: 'pre_employment',
      taskId: String(match[0].id),
    });
    await auditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'UPLOAD',
      targetType: 'task',
      targetId: String(match[0].id),
      details: { file_name: saved.fileName, notes: notes || null },
    });
    return Response.json({ ok: true, taskId: match[0].id, fileName: saved.fileName, filePath: saved.filePath });
  }

  await query(
    `INSERT INTO shared_files (id, employee_id, slot, file_name, file_path, file_size, mime_type, notes, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_path = VALUES(file_path),
       file_size = VALUES(file_size), mime_type = VALUES(mime_type), notes = VALUES(notes),
       uploaded_by = VALUES(uploaded_by), updated_at = NOW()`,
    [newId(), employeeId, target.slot, saved.fileName, saved.filePath, saved.fileSize, saved.mimeType, notes || null, user.id]
  );
  await notifyUser({
    userId: employeeId,
    type: 'general',
    title: `New downloadable file: ${docType.label}.`,
    body: notes || 'HR shared a new document with you.',
    linkSection: target.section,
    taskId: target.slot,
  });
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: user.role,
    action: 'UPLOAD',
    targetType: 'file',
    targetId: target.slot,
    details: { file_name: saved.fileName, notes: notes || null },
  });
  return Response.json({ ok: true, slot: target.slot, fileName: saved.fileName, filePath: saved.filePath });
}

/** HR: remove a shared slot file (its Download button greys again). */
export async function DELETE(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || !isHr(user.role)) return jsonError('HR sign-in required.', 403);
  const { id: employeeId } = await ctx.params;
  const slot = new URL(req.url).searchParams.get('slot') || '';
  if (!slot) return jsonError('Slot is required.');

  const rows = await query<Row & { file_path: string }>(
    `SELECT file_path FROM shared_files WHERE employee_id = ? AND slot = ?`,
    [employeeId, slot]
  );
  if (rows.length > 0 && typeof rows[0].file_path === 'string' && rows[0].file_path.startsWith('/uploads/')) {
    try {
      await unlink(path.join(process.cwd(), 'public', String(rows[0].file_path).replace(/^\/+/, '')));
    } catch {
      // File already gone from disk — the row still needs deleting.
    }
  }
  await query(`DELETE FROM shared_files WHERE employee_id = ? AND slot = ?`, [employeeId, slot]);
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: user.role,
    action: 'REMOVE_UPLOAD',
    targetType: 'file',
    targetId: slot,
    details: { employee_id: employeeId },
  });
  return Response.json({ ok: true });
}
