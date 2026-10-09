import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { query, queryOne, checkAndVoidExpiredAccess, type Row } from './server-db';

export const SESSION_COOKIE = 'pki_session';
const SESSION_HOURS = 12;

export interface SessionUser {
  id: string;
  email: string;
  role: 'hr_manager' | 'hr_assistant' | 'employee';
  full_name: string;
  employee_number: string | null;
}

export function isHr(role: string | undefined): boolean {
  return role === 'hr_manager' || role === 'hr_assistant';
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await query(`DELETE FROM sessions WHERE user_id = ?`, [userId]);
  await query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
    [token, userId, SESSION_HOURS]
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Company LAN serves plain http, so Secure must stay off or the
    // browser drops the session cookie and /dashboard bounces to /login.
    secure: false,
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await query(`DELETE FROM sessions WHERE token = ?`, [token]);
  }
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await queryOne<
    Row & {
      id: string;
      email: string;
      role: SessionUser['role'];
      full_name: string;
      is_active: number;
      employee_number: string | null;
    }
  >(
    `SELECT u.id, u.email, u.role, u.full_name, u.is_active, e.employee_number
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN employees e ON e.id = u.id
     WHERE s.token = ? AND s.expires_at > NOW() AND u.is_active = 1`,
    [token]
  );
  if (!row) return null;
  // Kicks expired hires out on their next request even with a live cookie.
  if (row.role === 'employee') {
    const window = await checkAndVoidExpiredAccess(String(row.id));
    if (window.expired) return null;
  }
  return {
    id: String(row.id),
    email: String(row.email),
    role: row.role,
    full_name: String(row.full_name),
    employee_number: row.employee_number ? String(row.employee_number) : null,
  };
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/** Generic sign-in failure message — never reveals which field was wrong. */
export const INVALID_LOGIN_MESSAGE = 'Invalid email or password.';
