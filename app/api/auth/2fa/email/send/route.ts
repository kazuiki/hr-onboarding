import { queryOne, type Row } from '@/lib/server-db';
import { jsonError } from '@/lib/auth';
import { OTP_RESEND_SECONDS } from '@/lib/email-otp';
import { issueEmailOtp, otpResendWaitSeconds } from '@/lib/two-factor-server';
import { sendSignInCode } from '@/lib/mailer';

interface SendBody {
  challengeId?: unknown;
}

/**
 * "Try another way": email a fresh code on the same login challenge.
 * The previous code is burned so only the newest email works. Cooldown
 * enforced so the button cannot be spammed.
 */
export async function POST(req: Request) {
  let body: SendBody;
  try {
    body = (await req.json()) as SendBody;
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

  const wait = await otpResendWaitSeconds(challengeId);
  if (wait > 0) {
    return Response.json(
      { error: `A code was just sent. Try again in ${wait}s.`, retryAfter: wait },
      { status: 429 }
    );
  }

  const user = await queryOne<Row & { id: string; email: string; full_name: string; is_active: number }>(
    `SELECT id, email, full_name, is_active FROM users WHERE id = ?`,
    [String(challenge.user_id)]
  );
  if (!user || !user.is_active) return jsonError('Code session expired. Sign in again.', 401);

  const { code } = await issueEmailOtp(String(user.id), challengeId);
  const sent = await sendSignInCode(String(user.email), String(user.full_name), code);
  if (!sent) {
    return jsonError('Could not send the code. Tell HR the email service is down.', 503);
  }
  return Response.json({ ok: true, cooldown: OTP_RESEND_SECONDS });
}
