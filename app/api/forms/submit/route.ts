import { query, newId, auditEvent, notifyHrSubmission, saveUpload, fileSignatureOk, type Row } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';
import { notifyHrOfDocumentSubmission } from '@/lib/mailer';

const FORM_TYPES = [
  'personal-data',
  'data-privacy',
  'manual-conforme',
  'id-conforme',
  'code-conduct',
  'comprehension',
  'form-data-privacy',
  'form-manual-conforme',
  'form-id-conforme',
  'form-code-conduct',
  'form-comprehension',
];

const DOC_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'ppt', 'pptx'];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Hire: submit a structured online form (JSON) or upload filled form
 * files (multipart). Rows anchor on the hire's privacy task so history
 * stays queryable per employee.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);

  // Employment forms unlock on the hire's start date.
  const hire = await query<Row & { start_date: string }>(
    `SELECT start_date FROM employees WHERE id = ?`,
    [user.id]
  );
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  if (hire.length === 0 || String(hire[0].start_date) > todayKey) {
    return jsonError('Employment forms unlock on your first day.', 403);
  }

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    let body: { formType?: unknown; formData?: unknown };
    try {
      body = (await req.json()) as { formType?: unknown; formData?: unknown };
    } catch {
      return jsonError('Invalid request body.');
    }
    const formType = typeof body.formType === 'string' ? body.formType : '';
    if (!FORM_TYPES.includes(formType)) return jsonError('Unknown form type.');
    if (!body.formData || typeof body.formData !== 'object') {
      return jsonError('Form answers are required.');
    }
    await query(
      `INSERT INTO form_submissions (id, task_id, employee_id, form_type, form_data)
       VALUES (?, 'task-privacy-1', ?, ?, ?)`,
      [newId(), user.id, formType, JSON.stringify(body.formData)]
    );
    await query(
      `INSERT INTO submission_history (id, employee_id, item_kind, item_key, item_label, category, file_name, file_path, action)
       VALUES (?, ?, 'form', ?, ?, 'form', NULL, NULL, 'upload')`,
      [newId(), user.id, formType, formType]
    );
    await auditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: 'employee',
      action: 'UPLOAD',
      targetType: 'form',
      targetId: formType,
      details: { mode: 'online-answers' },
    });
    await notifyHrOfDocumentSubmission({
      employeeName: user.full_name,
      employeeEmail: user.email,
      employeeNumber: user.employee_number,
      documentName: formType,
      fileNames: ['Online form answers (no file attachment)'],
      kind: 'form',
    });
    await notifyHrSubmission(user.id, user.full_name, formType, 'online answers');
    return Response.json({ ok: true }, { status: 201 });
  }

  const form = await req.formData();
  const formType = String(form.get('formType') ?? '');
  if (!FORM_TYPES.includes(formType)) return jsonError('Unknown form type.');
  const incoming = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (incoming.length === 0) return jsonError('Choose at least one file.');
  for (const file of incoming) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!DOC_EXT.includes(ext)) return jsonError(`"${file.name}" is not an accepted type.`);
    if (file.size > MAX_BYTES) return jsonError(`"${file.name}" exceeds the 10MB limit.`);
    const head = new Uint8Array(await file.arrayBuffer());
    if (!fileSignatureOk(file.name, head)) {
      return jsonError(`"${file.name}" content does not match its file type.`);
    }
  }

  const saved = [];
  for (const file of incoming) {
    const up = await saveUpload(file, user.id);
    saved.push({ file_name: up.fileName, file_path: up.filePath, file_size: up.fileSize, mime_type: up.mimeType });
  }
  await query(
    `INSERT INTO form_submissions (id, task_id, employee_id, form_type, form_data)
     VALUES (?, 'task-privacy-1', ?, ?, ?)`,
    [newId(), user.id, formType, JSON.stringify({ files: saved })]
  );
  for (const s of saved) {
    await query(
      `INSERT INTO submission_history (id, employee_id, item_kind, item_key, item_label, category, file_name, file_path, action)
       VALUES (?, ?, 'form', ?, ?, 'form', ?, ?, 'upload')`,
      [newId(), user.id, formType, formType, s.file_name, s.file_path]
    );
  }
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: 'employee',
    action: 'UPLOAD',
    targetType: 'form',
    targetId: formType,
    details: { files: saved.map((s) => s.file_name) },
  });
  await notifyHrOfDocumentSubmission({
    employeeName: user.full_name,
    employeeEmail: user.email,
    employeeNumber: user.employee_number,
    documentName: formType,
    fileNames: saved.map((s) => s.file_name),
    kind: 'form',
  });
  await notifyHrSubmission(user.id, user.full_name, formType, `${saved.length} file(s) uploaded`);
  return Response.json({ ok: true, files: saved.map((s) => s.file_name) }, { status: 201 });
}
