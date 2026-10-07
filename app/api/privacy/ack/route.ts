import { query, newId, auditEvent, recalcProgress } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';

/** Hire: acknowledge the current privacy notice (one row per version). */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);

  let policyId = '';
  try {
    const body = (await req.json()) as { policyId?: unknown };
    policyId = typeof body.policyId === 'string' ? body.policyId : '';
  } catch {
    return jsonError('Invalid request body.');
  }
  if (!policyId) return jsonError('Policy is required.');

  const policy = await query<{ id: string; version: string }>(
    `SELECT id, version FROM privacy_policies WHERE id = ? AND is_current = 1`,
    [policyId]
  );
  if (policy.length === 0) return jsonError('This notice is no longer current.', 409);

  const existing = await query(
    `SELECT id FROM privacy_acknowledgements WHERE employee_id = ? AND policy_id = ?`,
    [user.id, policyId]
  );
  if (existing.length === 0) {
    await query(
      `INSERT INTO privacy_acknowledgements (id, employee_id, policy_id, policy_version)
       VALUES (?, ?, ?, ?)`,
      [newId(), user.id, policyId, policy[0].version]
    );
    await auditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: 'employee',
      action: 'PRIVACY_ACK',
      targetType: 'policy',
      targetId: policyId,
      details: { version: policy[0].version },
    });
  }
  await query(
    `UPDATE onboarding_tasks SET status = 'submitted', submitted_at = COALESCE(submitted_at, NOW())
     WHERE employee_id = ? AND category = 'privacy' AND status IN ('not_started', 'in_progress', 'needs_changes')`,
    [user.id]
  );
  await recalcProgress(user.id);

  return Response.json({ ok: true });
}
