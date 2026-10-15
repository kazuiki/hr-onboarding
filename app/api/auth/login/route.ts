import { query, queryOne, auditEvent, checkAndVoidExpiredAccess, type Row } from '@/lib/server-db';
import { createSession, INVALID_LOGIN_MESSAGE, jsonError } from '@/lib/auth';
import { hashPassword, isLegacyHash, verifyPassword } from '@/lib/password';
import { createChallenge, issueEmailOtp } from '@/lib/two-factor-server';
import { maskEmail } from '@/lib/email-otp';
import { sendSignInCode } from '@/lib/mailer';

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

// Brute-force guard (single-instance LAN deploy): 5 failures lock an
// email for 15 minutes. Counters reset on success. Response stays generic
// so lockouts never confirm that an email exists.
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const attempts = new Map<string, { fails: number; lockedUntil: number }>();

function locked(email: string): boolean {
  const entry = attempts.get(email);
  if (!entry) return false;
  if (entry.fails < MAX_ATTEMPTS) return false;
  if (Date.now() >= entry.lockedUntil) {
    attempts.delete(email);
    return false;
  }
  return true;
}

function recordFailure(email: string): void {
  const entry = attempts.get(email) ?? { fails: 0, lockedUntil: 0 };
  entry.fails += 1;
  if (entry.fails >= MAX_ATTEMPTS) entry.lockedUntil = Date.now() + LOCK_MS;
  attempts.set(email, entry);
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
  if (!email || !password || locked(email)) return jsonError(INVALID_LOGIN_MESSAGE, 401);

  const user = await queryOne<
    Row & { id: string; email: string; role: 'hr_manager' | 'hr_assistant' | 'employee'; full_name: string; is_active: number; password_hash: string; totp_enabled: number }
  >(
    `SELECT id, email, role, full_name, is_active, password_hash, totp_enabled FROM users WHERE email = ?`,
    [email]
  );
  if (!user || !user.is_active) return jsonError(INVALID_LOGIN_MESSAGE, 401);
  const hash = String(user.password_hash ?? '');
  if (!(await verifyPassword(password, hash))) {
    recordFailure(email);
    return jsonError(INVALID_LOGIN_MESSAGE, 401);
  }
  attempts.delete(email);
  if (isLegacyHash(hash)) {
    // One-time upgrade: legacy SHA2 rows become scrypt on next successful login.
    // Best-effort so a not-yet-migrated column never blocks sign-in.
    try {
      await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [await hashPassword(password), user.id]);
    } catch {
      // Schema still on CHAR(64): import 24_password_hashes.sql, upgrade retries next login.
    }
  }

  // 30-day onboarding window: incomplete hires past the window are voided.
  if (user.role === 'employee') {
    const window = await checkAndVoidExpiredAccess(String(user.id));
    if (window.expired) return jsonError(INVALID_LOGIN_MESSAGE, 401);
  }

  await query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [user.id]);

  // Step 2 — every employee sign-in needs a code: password alone never
  // creates a session. TOTP users get the authenticator step, everyone
  // else gets the emailed code. The login page offers "try another way"
  // to switch between email code and QR approval.
  if (user.role === 'employee') {
    const challengeId = await createChallenge(String(user.id), 'login');
    if (Number(user.totp_enabled) === 1) {
      return Response.json({ requiresCode: true, method: 'totp', challengeId });
    }
    const { code } = await issueEmailOtp(String(user.id), challengeId);
    const sent = await sendSignInCode(String(user.email), String(user.full_name), code);
    if (!sent) {
      await query(`DELETE FROM two_factor_challenges WHERE id = ?`, [challengeId]);
      await query(`UPDATE email_otp_codes SET used_at = NOW() WHERE challenge_id = ?`, [challengeId]);
      return jsonError('Could not send the sign-in code. Tell HR the email service is down.', 503);
    }
    return Response.json({ requiresCode: true, method: 'email', challengeId, maskedEmail: maskEmail(String(user.email)) });
  }

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
