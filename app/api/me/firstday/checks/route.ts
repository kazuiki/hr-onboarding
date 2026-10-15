import { query, type Row } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';
import { FIRST_DAY_CHECKLIST_ITEMS } from '@/lib/onboarding';

const ITEM_KEYS = new Set(FIRST_DAY_CHECKLIST_ITEMS.map((item) => item.key));

/** Hire: read own first-day orientation checks. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);

  const rows = await query<Row & { item_key: string; is_checked: number }>(
    `SELECT item_key, is_checked FROM first_day_checklist WHERE employee_id = ?`,
    [user.id]
  );
  return Response.json({ checks: rows });
}

interface ChecksBody {
  item_key?: unknown;
  checked?: unknown;
}

/** Hire: toggle one orientation check; upserts the row so checks survive refresh. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);

  let body: ChecksBody;
  try {
    body = (await req.json()) as ChecksBody;
  } catch {
    return jsonError('Invalid request body.');
  }
  const itemKey = typeof body.item_key === 'string' ? body.item_key : '';
  if (!ITEM_KEYS.has(itemKey)) return jsonError('Unknown checklist item.');
  if (typeof body.checked !== 'boolean') return jsonError('Checked flag is required.');

  await query(
    `INSERT INTO first_day_checklist (employee_id, item_key, is_checked, checked_at)
     VALUES (?, ?, ?, CASE WHEN ? = 1 THEN NOW() ELSE NULL END)
     ON DUPLICATE KEY UPDATE is_checked = VALUES(is_checked),
       checked_at = CASE WHEN VALUES(is_checked) = 1 THEN NOW() ELSE NULL END`,
    [user.id, itemKey, body.checked ? 1 : 0, body.checked ? 1 : 0]
  );
  return Response.json({ ok: true });
}
