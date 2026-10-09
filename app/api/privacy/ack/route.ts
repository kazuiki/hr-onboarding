import { query, auditEvent, recalcProgress } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';

/** Hire: acknowledge the privacy notice (checklist task only; notice content is static). */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);

  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: 'employee',
    action: 'PRIVACY_ACK',
    targetType: 'policy',
    targetId: 'privacy-notice',
    details: null,
  });
  await query(
    `UPDATE onboarding_tasks SET status = 'submitted', submitted_at = COALESCE(submitted_at, NOW())
     WHERE employee_id = ? AND category = 'privacy' AND status IN ('not_started', 'in_progress', 'needs_changes')`,
    [user.id]
  );
  await recalcProgress(user.id);

  return Response.json({ ok: true });
}
