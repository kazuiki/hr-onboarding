import { query, auditEvent, notifyUser, type Row } from '@/lib/server-db';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';

interface Ctx {
  params: Promise<{ threadId: string }>;
}

interface MessageBody {
  body?: unknown;
}

/** Post a reply. Hires may write only in their own threads. */
export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  const { threadId } = await ctx.params;

  const thread = await query<Row & { id: string; employee_id: string; subject_title: string; status: string }>(
    `SELECT id, employee_id, subject_title, status FROM message_threads WHERE id = ?`,
    [threadId]
  );
  if (thread.length === 0) return jsonError('Conversation not found.', 404);
  if (!isHr(user.role) && String(thread[0].employee_id) !== user.id) {
    return jsonError('Not allowed.', 403);
  }

  let body: MessageBody;
  try {
    body = (await req.json()) as MessageBody;
  } catch {
    return jsonError('Invalid request body.');
  }
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return jsonError('Message is required.');

  const senderRole = isHr(user.role) ? 'hr' : 'employee';
  await query(`INSERT INTO messages (thread_id, sender_id, sender_role, body) VALUES (?, ?, ?, ?)`, [
    threadId,
    user.id,
    senderRole,
    text,
  ]);
  await query(
    `UPDATE message_threads SET updated_at = NOW(),
       status = CASE WHEN status = 'resolved' THEN 'in_progress' ELSE status END
     WHERE id = ?`,
    [threadId]
  );

  if (senderRole === 'hr') {
    await notifyUser({
      userId: String(thread[0].employee_id),
      type: 'chat',
      title: `HR replied: ${String(thread[0].subject_title)}.`,
      body: text.slice(0, 200),
      linkSection: 'help',
    });
  } else {
    const hrs = await query<Row & { id: string }>(
      `SELECT id FROM users WHERE role IN ('hr_manager', 'hr_assistant') AND is_active = 1`
    );
    for (const hr of hrs) {
      await notifyUser({
        userId: String(hr.id),
        type: 'chat',
        title: `New message: ${String(thread[0].subject_title)}.`,
        body: text.slice(0, 200),
        linkSection: 'help',
      });
    }
  }
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: user.role,
    action: senderRole === 'hr' ? 'CHAT_REPLY' : 'CHAT_SEND',
    targetType: 'thread',
    targetId: threadId,
    details: { preview: text.slice(0, 120) },
  });

  return Response.json({ ok: true }, { status: 201 });
}
