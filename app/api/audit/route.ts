import { query, type Row } from '@/lib/server-db';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';

const PAGE_SIZE = 10;

/** HR: audit trail, 10 rows per page. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || !isHr(user.role)) return jsonError('HR sign-in required.', 403);

  const page = Math.max(1, Number(new URL(req.url).searchParams.get('page') || 1) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const total = await query<Row & { n: number }>(`SELECT COUNT(*) AS n FROM audit_events`);
  const items = await query<Row>(
    `SELECT id, actor_name, actor_role, action, target_type, target_id, details, created_at
     FROM audit_events ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [PAGE_SIZE, offset]
  );
  return Response.json({
    items,
    page,
    pageSize: PAGE_SIZE,
    total: Number(total[0]?.n ?? 0),
    totalPages: Math.max(1, Math.ceil(Number(total[0]?.n ?? 0) / PAGE_SIZE)),
  });
}
