import { query, queryOne, newId, type Row } from './server-db';
import { CHALLENGE_MINUTES, generateDeviceToken, sha256Hex } from './two-factor';
import { OTP_MINUTES, OTP_RESEND_SECONDS, OTP_MAX_ATTEMPTS, generateOtpCode, hashOtpCode, otpMatches } from './email-otp';

// Server-only 2FA persistence: challenges, emailed codes, QR tokens.
// Secrets themselves are verified with lib/two-factor.ts (pure crypto).

export type ChallengePurpose = 'login' | 'enroll';

export interface ChallengeRow {
  id: string;
  user_id: string;
  purpose: ChallengePurpose;
  secret: string | null;
}

/** Short-lived challenge the client presents with its TOTP code. */
export async function createChallenge(
  userId: string,
  purpose: ChallengePurpose,
  secret: string | null = null
): Promise<string> {
  const id = newId();
  await query(
    `INSERT INTO two_factor_challenges (id, user_id, purpose, secret, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [id, userId, purpose, secret, CHALLENGE_MINUTES]
  );
  return id;
}

/**
 * Read-only challenge lookup. Unlike consumeChallenge, this never deletes:
 * a wrong code must NOT burn the challenge, otherwise retry, resend, and
 * switch-to-QR all break after a single failed attempt. The challenge row
 * is deleted explicitly once a proof verifies successfully.
 */
export async function peekChallenge(id: string, purpose: ChallengePurpose): Promise<ChallengeRow | null> {
  const row = await queryOne<
    Row & { id: string; user_id: string; purpose: ChallengePurpose; secret: string | null; expires_at: string }
  >(`SELECT id, user_id, purpose, secret, expires_at FROM two_factor_challenges WHERE id = ?`, [id]);
  if (!row || row.purpose !== purpose) return null;
  if (new Date(String(row.expires_at).replace(' ', 'T')).getTime() < Date.now()) return null;
  return { id: String(row.id), user_id: String(row.user_id), purpose: row.purpose, secret: row.secret ? String(row.secret) : null };
}

/**
 * Fetch + delete a challenge atomically-ish (single-purpose). Returns null
 * when missing, expired, or for the wrong purpose. Expired rows are swept.
 */
export async function consumeChallenge(id: string, purpose: ChallengePurpose): Promise<ChallengeRow | null> {
  const row = await queryOne<
    Row & { id: string; user_id: string; purpose: ChallengePurpose; secret: string | null; expires_at: string }
  >(`SELECT id, user_id, purpose, secret, expires_at FROM two_factor_challenges WHERE id = ?`, [id]);
  await query(`DELETE FROM two_factor_challenges WHERE id = ? OR expires_at <= NOW()`, [id]);
  if (!row || row.purpose !== purpose) return null;
  if (new Date(String(row.expires_at).replace(' ', 'T')).getTime() < Date.now()) return null;
  return { id: String(row.id), user_id: String(row.user_id), purpose: row.purpose, secret: row.secret ? String(row.secret) : null };
}

/** Wipe every 2FA trace for a user ID: secret, challenges, emailed codes. */
export async function resetTwoFactor(userId: string): Promise<void> {
  await query(
    `UPDATE users SET totp_secret = NULL, totp_enabled = 0, totp_enabled_at = NULL WHERE id = ?`,
    [userId]
  );
  await query(`DELETE FROM two_factor_challenges WHERE user_id = ?`, [userId]);
  await query(`DELETE FROM email_otp_codes WHERE user_id = ?`, [userId]);
}

export interface IssuedOtp {
  /** Plaintext code — goes into the email only, never back to the client. */
  code: string;
}

/**
 * Mint a fresh email code for a login challenge. Supersedes (burns) any
 * previous live code on the same challenge so only the newest email works.
 */
export async function issueEmailOtp(userId: string, challengeId: string): Promise<IssuedOtp> {
  const code = generateOtpCode();
  await query(`UPDATE email_otp_codes SET used_at = NOW() WHERE challenge_id = ? AND used_at IS NULL`, [
    challengeId,
  ]);
  await query(
    `INSERT INTO email_otp_codes (id, user_id, challenge_id, code_hash, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [newId(), userId, challengeId, hashOtpCode(code), OTP_MINUTES]
  );
  return { code };
}

/** Seconds until a resend is allowed (0 = send now). Missing row = brand new. */
export async function otpResendWaitSeconds(challengeId: string): Promise<number> {
  const row = await queryOne<Row & { created_at: string }>(
    `SELECT created_at FROM email_otp_codes WHERE challenge_id = ? ORDER BY created_at DESC LIMIT 1`,
    [challengeId]
  );
  if (!row) return 0;
  const ageMs = Date.now() - new Date(String(row.created_at).replace(' ', 'T')).getTime();
  return Math.max(0, OTP_RESEND_SECONDS - Math.floor(ageMs / 1000));
}

export type OtpVerdict = 'ok' | 'mismatch' | 'expired' | 'missing';
/**
 * Check a guess against the newest live code on a challenge. Burns the row
 * on success, on expiry, and after OTP_MAX_ATTEMPTS wrong guesses.
 */
export async function checkEmailOtp(challengeId: string, guess: string): Promise<OtpVerdict> {
  const row = await queryOne<Row & { id: string; code_hash: string; attempts: number; expires_at: string }>(
    `SELECT id, code_hash, attempts, expires_at FROM email_otp_codes
     WHERE challenge_id = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [challengeId]
  );
  if (!row) return 'missing';
  const id = String(row.id);
  if (new Date(String(row.expires_at).replace(' ', 'T')).getTime() < Date.now()) {
    await query(`UPDATE email_otp_codes SET used_at = NOW() WHERE id = ?`, [id]);
    return 'expired';
  }
  if (!otpMatches(guess, String(row.code_hash))) {
    const next = Number(row.attempts) + 1;
    await query(`UPDATE email_otp_codes SET attempts = ?, used_at = CASE WHEN ? >= ? THEN NOW() ELSE NULL END WHERE id = ?`, [
      next,
      next,
      OTP_MAX_ATTEMPTS,
      id,
    ]);
    return 'mismatch';
  }
  await query(`UPDATE email_otp_codes SET used_at = NOW() WHERE id = ?`, [id]);
  return 'ok';
}

export type QrStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'missing';

/** Base URL the phone can reach — proxy headers first, APP_URL fallback. */
export function getAppBaseUrl(req: Request): string {
  const envBase = process.env.APP_URL?.trim().replace(/\/+$/, '');
  if (envBase) return envBase;
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host =
    req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

/** Mint a phone-approval token for a live login challenge. */
export async function createQrToken(userId: string, challengeId: string): Promise<string> {
  const raw = generateDeviceToken();
  await query(`UPDATE qr_login_tokens SET used_at = NOW() WHERE challenge_id = ? AND used_at IS NULL`, [
    challengeId,
  ]);
  await query(
    `INSERT INTO qr_login_tokens (id, user_id, challenge_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [newId(), userId, challengeId, sha256Hex(raw), OTP_MINUTES]
  );
  return raw;
}

function qrExpired(expiresAt: string): boolean {
  return new Date(expiresAt.replace(' ', 'T')).getTime() < Date.now();
}

/** Newest live decision state for a challenge (desktop polling). */
export async function getQrStatus(challengeId: string): Promise<QrStatus> {
  const row = await queryOne<Row & { status: QrStatus; expires_at: string }>(
    `SELECT status, expires_at FROM qr_login_tokens
     WHERE challenge_id = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [challengeId]
  );
  if (!row) return 'missing';
  if (qrExpired(String(row.expires_at))) return 'expired';
  return row.status;
}

export interface QrTokenInfo {
  userId: string;
  maskedHint: string;
  expiresAt: string;
}

/** Phone side: describe a token without leaking identity. Null when unusable. */
export async function getQrTokenInfo(rawToken: string): Promise<QrTokenInfo | null> {
  if (!/^[0-9a-f]{64}$/.test(rawToken)) return null;
  const row = await queryOne<Row & { user_id: string; status: string; expires_at: string; email: string }>(
    `SELECT q.user_id, q.status, q.expires_at, u.email
     FROM qr_login_tokens q JOIN users u ON u.id = q.user_id
     WHERE q.token_hash = ? AND q.used_at IS NULL ORDER BY q.created_at DESC LIMIT 1`,
    [sha256Hex(rawToken)]
  );
  if (!row || row.status !== 'pending' || qrExpired(String(row.expires_at))) return null;
  const email = String(row.email);
  return { userId: String(row.user_id), maskedHint: email.replace(/^(.).*(@.*)$/, '$1***$2'), expiresAt: String(row.expires_at) };
}

/** Phone taps Approve/Deny. Returns false when the token is unusable. */
export async function decideQrToken(rawToken: string, approve: boolean): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/.test(rawToken)) return false;
  const row = await queryOne<Row & { id: string; status: string; expires_at: string }>(
    `SELECT id, status, expires_at FROM qr_login_tokens
     WHERE token_hash = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [sha256Hex(rawToken)]
  );
  if (!row || row.status !== 'pending' || qrExpired(String(row.expires_at))) return false;
  // Record the decision but leave used_at NULL: the desktop polling
  // (getQrStatus) and finalize (consumeQrApproval) both read the newest
  // live row. Setting used_at here would hide the approval from them and
  // the desktop would fall back to the code form as "missing".
  await query(`UPDATE qr_login_tokens SET status = ? WHERE id = ?`, [
    approve ? 'approved' : 'denied',
    String(row.id),
  ]);
  return true;
}

export type QrVerdict = 'ok' | 'denied' | 'expired' | 'missing';

/** Desktop finalize: consume the approved token for a challenge. */
export async function consumeQrApproval(challengeId: string): Promise<QrVerdict> {
  const row = await queryOne<Row & { id: string; status: string; expires_at: string }>(
    `SELECT id, status, expires_at FROM qr_login_tokens
     WHERE challenge_id = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [challengeId]
  );
  if (!row) return 'missing';
  const id = String(row.id);
  if (qrExpired(String(row.expires_at))) {
    await query(`UPDATE qr_login_tokens SET used_at = NOW() WHERE id = ?`, [id]);
    return 'expired';
  }
  if (row.status === 'denied') {
    await query(`UPDATE qr_login_tokens SET used_at = NOW() WHERE id = ?`, [id]);
    return 'denied';
  }
  if (row.status !== 'approved') return 'missing';
  await query(`UPDATE qr_login_tokens SET used_at = NOW() WHERE id = ?`, [id]);
  return 'ok';
}
