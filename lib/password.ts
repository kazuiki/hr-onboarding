import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';

// Server-only password hashing (scrypt, memory-hard, random salt per password).
// Stored format: `scrypt$<saltHex>$<hashHex>`. Legacy school-build rows hold a
// bare 64-char SHA2 hex digest; verifyPassword still accepts those so existing
// accounts keep working, and callers should re-hash to scrypt on success.

const KEYLEN = 64;

function scryptKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    _scrypt(password, salt, KEYLEN, (err, derived) => {
      if (err || typeof derived === 'undefined') reject(err ?? new Error('scrypt failed'));
      else resolve(derived);
    });
  });
}

/** Hash a fresh password for storage. Never store or log the input. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptKey(password, salt);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** True when the stored row is a legacy unsalted SHA2 digest. */
export function isLegacyHash(stored: string): boolean {
  return /^[0-9a-f]{64}$/i.test(stored) && !stored.startsWith('scrypt$');
}

function legacyMatch(password: string, stored: string): boolean {
  const digest = createHash('sha256').update(password).digest('hex');
  const a = Buffer.from(digest, 'hex');
  const b = Buffer.from(stored.toLowerCase(), 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Verify a password against a stored scrypt (or legacy SHA2) hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    if (salt.length !== 16 || expected.length !== KEYLEN) return false;
    const actual = await scryptKey(password, salt);
    return timingSafeEqual(actual, expected);
  }
  if (isLegacyHash(stored)) return legacyMatch(password, stored);
  return false;
}
