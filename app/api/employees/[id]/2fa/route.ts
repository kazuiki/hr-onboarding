import { queryOne, auditEvent, type Row } from '@/lib/server-db';
import { getSessionUser, isHrManager, jsonError } from '@/lib/auth';
import { resetTwoFactor } from '@/lib/two-factor-server';

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * HR manager: reset a user's 2FA (lost authenticator).
 * Clears the secret and pending challenges.
 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (!isHrManager(user.role)) return jsonError('HR manager sign-in required.', 403);
  const { id } = await ctx.params;

  const target = await queryOne<Row & { id: string; full_name: string }>(
    `SELECT id, full_name FROM users WHERE id = ?`,
    [id]
  );
  if (!target) return jsonError('Account not found.', 404);

  await resetTwoFactor(String(target.id));
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: user.role,
    action: '2FA_RESET',
    targetType: 'user',
    targetId: String(target.id),
    details: { account: String(target.full_name) },
  });
  return Response.json({ ok: true });
}
