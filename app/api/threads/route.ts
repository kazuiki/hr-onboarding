import { query, newId, auditEvent, notifyUser, type Row } from '@/lib/server-db';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';

/** Threads: hires see their own, HR sees every conversation. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);

  const threads = isHr(user.role)
    ? await query<Row>(
        `SELECT t.id, t.employee_id, t.hr_id, t.subject_type, t.subject_title,
                t.task_id, t.status, t.updated_at, u.full_name AS employee_name
         FROM message_threads t JOIN users u ON u.id = t.employee_id
         ORDER BY t.updated_at DESC`
      )
    : await query<Row>(
        `SELECT id, employee_id, hr_id, subject_type, subject_title, task_id, status, updated_at
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
  return Response.json({ threads, messages });
}

interface ThreadBody {
  subject?: unknown;
  body?: unknown;
}

/** Hire: open a help thread. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);

  let body: ThreadBody;
  try {
    body = (await req.json()) as ThreadBody;
  } catch {
    return jsonError('Invalid request body.');
  }
  const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 255) : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!subject || !text) return jsonError('Subject and message are required.');

  const threadId = newId();
  await query(
    `INSERT INTO message_threads (id, employee_id, subject_type, subject_title, status)
     VALUES (?, ?, 'help', ?, 'open')`,
    [threadId, user.id, subject]
  );
  await query(
    `INSERT INTO messages (thread_id, sender_id, sender_role, body) VALUES (?, ?, 'employee', ?)`,
    [threadId, user.id, text]
  );
  const hrs = await query<Row & { id: string }>(
    `SELECT id FROM users WHERE role IN ('hr_manager', 'hr_assistant') AND is_active = 1`
  );
  for (const hr of hrs) {
    await notifyUser({
      userId: String(hr.id),
      type: 'chat',
      title: `New help request: ${subject}.`,
      body: text.slice(0, 200),
      linkSection: 'help',
    });
  }
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: 'employee',
    action: 'CHAT_SEND',
    targetType: 'thread',
    targetId: threadId,
    details: { subject },
  });
  return Response.json({ id: threadId }, { status: 201 });
}
