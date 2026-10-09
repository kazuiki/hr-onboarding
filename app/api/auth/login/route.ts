import { query, queryOne, auditEvent, checkAndVoidExpiredAccess, type Row } from '@/lib/server-db';
import { createSession, INVALID_LOGIN_MESSAGE, jsonError } from '@/lib/auth';

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(req: Request) {
  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return jsonError(INVALID_LOGIN_MESSAGE, 401);
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) return jsonError(INVALID_LOGIN_MESSAGE, 401);

  const user = await queryOne<
    Row & { id: string; email: string; role: 'hr_manager' | 'hr_assistant' | 'employee'; full_name: string; is_active: number }
  >(
    `SELECT id, email, role, full_name, is_active FROM users
     WHERE email = ? AND password_hash = SHA2(?, 256)`,
    [email, password]
  );
  if (!user || !user.is_active) return jsonError(INVALID_LOGIN_MESSAGE, 401);

  // 30-day onboarding window: incomplete hires past the window are voided.
  if (user.role === 'employee') {
    const window = await checkAndVoidExpiredAccess(String(user.id));
    if (window.expired) return jsonError(INVALID_LOGIN_MESSAGE, 401);
  }

  await query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [user.id]);
  await createSession(String(user.id));
  await auditEvent({
    actorId: String(user.id),
    actorName: String(user.full_name),
    actorRole: user.role,
    action: 'LOGIN',
    targetType: 'user',
    targetId: String(user.id),
  });

  return Response.json({
    id: String(user.id),
    email: String(user.email),
    role: user.role,
    full_name: String(user.full_name),
  });
}
