import { jsonError } from '@/lib/auth';
import { decideQrToken, getQrTokenInfo } from '@/lib/two-factor-server';

interface DecideBody {
  token?: unknown;
  approve?: unknown;
}

/** Phone side, step 1: describe the pending approval (masked identity). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') || '';
  const info = await getQrTokenInfo(token);
  if (!info) return Response.json({ error: 'This link is expired or already used.' }, { status: 410 });
  return Response.json({ maskedHint: info.maskedHint, expiresAt: info.expiresAt });
}

/** Phone side, step 2: Approve or Deny the desktop sign-in. */
export async function POST(req: Request) {
  let body: DecideBody;
  try {
    body = (await req.json()) as DecideBody;
  } catch {
    return jsonError('Invalid request body.');
  }
  const token = typeof body.token === 'string' ? body.token : '';
  const approve = body.approve === true;
  if (!token) return jsonError('Token is required.');
  const ok = await decideQrToken(token, approve);
  if (!ok) return Response.json({ error: 'This link is expired or already used.' }, { status: 410 });
  return Response.json({ ok: true, approved: approve });
}
