import { query, type Row } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';

/** Own bell feed: newest first with an unread count. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);

  const items = await query<Row>(
    `SELECT id, type, title, body, link_section, task_id, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    [user.id]
  );
  const unread = await query<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0`,
    [user.id]
  );
  return Response.json({ items, unreadCount: Number(unread[0]?.n ?? 0) });
}

interface ReadBody {
  id?: unknown;
  ids?: unknown;
}

/** Mark one alert, a batch of alerts, or every alert as read. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);

  let body: ReadBody = {};
  try {
    body = (await req.json()) as ReadBody;
  } catch {
    // Empty body means "mark all".
  }
  if (Array.isArray(body.ids)) {
    const ids = body.ids
      .filter((v): v is number | string => typeof v === 'number' || typeof v === 'string')
      .slice(0, 50);
    if (ids.length > 0) {
      await query(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
        [user.id, ...ids]
      );
    }
  } else if (typeof body.id === 'number' || typeof body.id === 'string') {
    await query(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [body.id, user.id]);
  } else {
    await query(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [user.id]);
  }
  return Response.json({ ok: true });
}
