import { query, queryOne, auditEvent, checkAndVoidExpiredAccess, type Row } from '@/lib/server-db';
import { createSession, INVALID_LOGIN_MESSAGE, jsonError } from '@/lib/auth';
import { verifyTotp } from '@/lib/two-factor';
import {
  peekChallenge,
  checkEmailOtp,
  consumeQrApproval,
} from '@/lib/two-factor-server';

interface VerifyBody {
  challengeId?: unknown;
  code?: unknown;
  /** 'email' (default) | 'totp' (paired authenticator) | 'qr' (phone approval). */
  method?: unknown;
}

// Code-guessing guard (single-instance LAN deploy): 5 failures lock a
// challenge for 15 minutes. Responses stay generic.
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const attempts = new Map<string, { fails: number; lockedUntil: number }>();

function locked(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() >= entry.lockedUntil) {
    attempts.delete(key);
    return false;
  }
  return entry.fails >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const entry = attempts.get(key) ?? { fails: 0, lockedUntil: 0 };
  entry.fails += 1;
  if (entry.fails >= MAX_ATTEMPTS) entry.lockedUntil = Date.now() + LOCK_MS;
  attempts.set(key, entry);
}

/** Second step of login: trade a login challenge + proof for a session. */
export async function POST(req: Request) {
  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return jsonError(INVALID_LOGIN_MESSAGE, 401);
  }
  const challengeId = typeof body.challengeId === 'string' ? body.challengeId : '';
  const code = typeof body.code === 'string' ? body.code : '';
  const method = body.method === 'totp' || body.method === 'qr' ? body.method : 'email';
  if (!challengeId || locked(challengeId)) return jsonError(INVALID_LOGIN_MESSAGE, 401);
  if (method !== 'qr' && !code) return jsonError(INVALID_LOGIN_MESSAGE, 401);

  const challenge = await peekChallenge(challengeId, 'login');
  if (!challenge) {
    recordFailure(challengeId);
    return jsonError('Code session expired. Sign in again.', 401);
  }

  const user = await queryOne<
    Row & { id: string; email: string; role: 'hr_manager' | 'hr_assistant' | 'employee'; full_name: string; is_active: number; totp_secret: string | null; totp_enabled: number }
  >(
    `SELECT id, email, role, full_name, is_active, totp_secret, totp_enabled FROM users WHERE id = ?`,
    [challenge.user_id]
  );
  if (!user || !user.is_active) {
    recordFailure(challengeId);
    return jsonError(INVALID_LOGIN_MESSAGE, 401);
  }

  let via = 'email_code';
  if (method === 'qr') {
    // Phone-approval path: no typing, the tapped Approve is the proof.
    const verdict = await consumeQrApproval(challengeId);
    if (verdict !== 'ok') {
      recordFailure(challengeId);
      if (verdict === 'denied') return jsonError('Denied from your phone. Sign in again.', 401);
      if (verdict === 'expired') return jsonError('QR expired. Sign in again.', 401);
      return jsonError('Not approved yet. Scan the QR and tap Approve on your phone.', 401);
    }
    via = 'qr_approval';
  } else if (method === 'totp') {
    if (Number(user.totp_enabled) !== 1 || !user.totp_secret || !verifyTotp(String(user.totp_secret), code)) {
      recordFailure(challengeId);
      return jsonError('That code did not match. Try again.', 401);
    }
    via = 'authenticator';
  } else {
    const verdict = await checkEmailOtp(challengeId, code);
    if (verdict !== 'ok') {
      recordFailure(challengeId);
      if (verdict === 'expired') return jsonError('That code expired. Ask for a new one.', 401);
      if (verdict === 'missing') return jsonError('That code is no longer valid. Ask for a new one.', 401);
      return jsonError('That code did not match. Try again.', 401);
    }
  }
  attempts.delete(challengeId);
  // Single-use proof: burn the challenge only now that a proof verified.
  // Wrong guesses above return early, leaving the challenge alive for
  // retries, resends, and QR switching.
  await query(`DELETE FROM two_factor_challenges WHERE id = ?`, [challengeId]);

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
    details: { via },
  });

  return Response.json({
    id: String(user.id),
    email: String(user.email),
    role: user.role,
    full_name: String(user.full_name),
  });
}
