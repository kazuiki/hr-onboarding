import { query } from '@/lib/server-db';
import { getSessionUser, jsonError } from '@/lib/auth';

/**
 * Signed-in hire marks the mandatory orientation video watched.
 * First-login gate is server-side: once set, later logins on any
 * browser skip /orientation for good.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return jsonError('Sign-in required.', 401);
  if (user.role !== 'employee') return jsonError('Employee sign-in required.', 403);
  await query(`UPDATE employees SET orientation_watched = 1 WHERE id = ?`, [user.id]);
  await query(`UPDATE onboarding_packets SET orientation_watched = 1 WHERE employee_id = ?`, [user.id]);
  return Response.json({ ok: true });
}
