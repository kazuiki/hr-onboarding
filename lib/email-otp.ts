import { randomInt, timingSafeEqual } from 'crypto';
import { sha256Hex } from './two-factor';

// Email-OTP second factor: a 6-digit code emailed to the user's own address.
// One step at a time — password first, code second. Only the SHA-256 hash
// touches the database; the plaintext lives in the email alone.

/** Code lifetime in minutes. */
export const OTP_MINUTES = 3;
/** Minimum seconds between (re)sends to one challenge. */
export const OTP_RESEND_SECONDS = 120;
/** Wrong guesses before the code row is burned. */
export const OTP_MAX_ATTEMPTS = 5;

/** Zero-padded 6-digit code, crypto-random. */
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashOtpCode(code: string): string {
  return sha256Hex(code.replace(/[\s-]/g, ''));
}

/** Constant-time comparison of a guess against a stored hash. */
export function otpMatches(guess: string, storedHash: string): boolean {
  const a = Buffer.from(hashOtpCode(guess), 'utf8');
  const b = Buffer.from(storedHash, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** j***@gmail.com — enough to recognize, not enough to harvest. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const head = (local || '').slice(0, 1) || '*';
  return `${head}***@${domain}`;
}
