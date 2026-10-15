import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

// Server-only two-factor core (authenticator-app TOTP, RFC 6238).
// No dependencies: HMAC-SHA1 + dynamic truncation over Node crypto.
// Secrets are per-user (per ID); each user enrolls their own authenticator
// app. Every sign-in asks for a code: emailed (3-minute expiry) or TOTP.

export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
/** Clock-skew tolerance: accept previous, current and next step. */
export const TOTP_WINDOW = 1;
/** Login / enrollment challenges expire after 10 minutes. */
export const CHALLENGE_MINUTES = 10;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** 160-bit random secret, base32 (no padding) — what goes into the QR code. */
export function generateSecret(): string {
  const bytes = randomBytes(20);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.trim().replace(/=+$/, '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', secret).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

/** Current authenticator code for a secret (used by tests / enrollment check). */
export function totpCode(secretBase32: string, atMs: number = Date.now()): string {
  const secret = base32Decode(secretBase32);
  if (secret.length === 0) return '';
  const counter = Math.floor(atMs / 1000 / TOTP_STEP_SECONDS);
  return hotp(secret, counter);
}

/** True when `code` matches the secret within the clock-skew window. */
export function verifyTotp(secretBase32: string, code: string, atMs: number = Date.now()): boolean {
  const clean = code.replace(/[\s-]/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const secret = base32Decode(secretBase32);
  if (secret.length === 0) return false;
  const counter = Math.floor(atMs / 1000 / TOTP_STEP_SECONDS);
  const candidate = Buffer.from(clean, 'utf8');
  for (let step = counter - TOTP_WINDOW; step <= counter + TOTP_WINDOW; step += 1) {
    const expected = Buffer.from(hotp(secret, step), 'utf8');
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return true;
  }
  return false;
}

const TOTP_ISSUER = 'PKII Onboarding';

/** otpauth:// URI encoded in the enrollment QR code. */
export function otpauthUrl(secretBase32: string, accountEmail: string): string {
  const label = `${encodeURIComponent(TOTP_ISSUER)}:${encodeURIComponent(accountEmail)}`;
  return (
    `otpauth://totp/${label}` +
    `?secret=${secretBase32}&issuer=${encodeURIComponent(TOTP_ISSUER)}` +
    `&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`
  );
}

/** Manual-entry grouping shown under the QR code, e.g. "ABCD EFGH ...". */
export function formatManualKey(secretBase32: string): string {
  return (secretBase32.toUpperCase().match(/.{1,4}/g) ?? []).join(' ');
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Opaque device token stored hashed in DB; raw value lives in the cookie. */
export function generateDeviceToken(): string {
  return randomBytes(32).toString('hex');
}
