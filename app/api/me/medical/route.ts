import { query, auditEvent, recalcProgress } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';

/** Hire: mark the medical section as reviewed (checklist task only; section content is static). */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);

  await query(
    `UPDATE onboarding_tasks SET status = 'submitted', submitted_at = COALESCE(submitted_at, NOW())
     WHERE employee_id = ? AND category = 'medical' AND status IN ('not_started', 'in_progress', 'needs_changes')`,
    [user.id]
  );
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: 'employee',
    action: 'MEDICAL_REVIEWED',
    targetType: 'task',
    targetId: 'medical',
  });
  await recalcProgress(user.id);
  return Response.json({ ok: true });
}
