import { getQrStatus } from '@/lib/two-factor-server';

/** Desktop polling: has the phone approved, denied, or let it expire? */
export async function GET(req: Request) {
  const challengeId = new URL(req.url).searchParams.get('challengeId') || '';
  if (!challengeId) return Response.json({ status: 'missing' });
  return Response.json({ status: await getQrStatus(challengeId) });
}
