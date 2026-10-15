import QRCode from 'qrcode';
import { queryOne, type Row } from '@/lib/server-db';
import { jsonError } from '@/lib/auth';
import { createQrToken, getAppBaseUrl } from '@/lib/two-factor-server';

interface StartBody {
  challengeId?: unknown;
}

/**
 * "Try it in another way" → QR edition. Validates the live login challenge
 * (read-only; it stays alive for the final verify), mints a phone-approval
 * token, and returns a QR of the approve link. No code typing involved:
 * the phone scans, taps Approve, the desktop auto-continues.
 */
export async function POST(req: Request) {
  let body: StartBody;
  try {
    body = (await req.json()) as StartBody;
  } catch {
    return jsonError('Invalid request body.');
  }
  const challengeId = typeof body.challengeId === 'string' ? body.challengeId : '';
  if (!challengeId) return jsonError('Challenge is required.');

  const challenge = await queryOne<Row & { user_id: string; expires_at: string }>(
    `SELECT user_id, expires_at FROM two_factor_challenges WHERE id = ? AND purpose = 'login'`,
    [challengeId]
  );
  if (!challenge || new Date(String(challenge.expires_at).replace(' ', 'T')).getTime() < Date.now()) {
    return jsonError('Code session expired. Sign in again.', 401);
  }
  const active = await queryOne<Row & { is_active: number }>(
    `SELECT is_active FROM users WHERE id = ?`,
    [String(challenge.user_id)]
  );
  if (!active || !active.is_active) return jsonError('Code session expired. Sign in again.', 401);

  const raw = await createQrToken(String(challenge.user_id), challengeId);
  const approveUrl = `${getAppBaseUrl(req)}/approve?token=${raw}`;
  return Response.json({
    qrDataUrl: await QRCode.toDataURL(approveUrl, { margin: 1, width: 220 }),
  });
}
