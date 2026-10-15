import { query, type Row } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';

/** Own 2FA state: authenticator flag. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);

  const rows = await query<Row & { totp_enabled: number; totp_enabled_at: string | null }>(
    `SELECT totp_enabled, totp_enabled_at FROM users WHERE id = ?`,
    [user.id]
  );
  const enabled = rows.length > 0 && Number(rows[0].totp_enabled) === 1;

  return Response.json({
    enabled,
    enabledAt: enabled ? (rows[0]?.totp_enabled_at ?? null) : null,
  });
}
