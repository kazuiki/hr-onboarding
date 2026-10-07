import { getSessionUser, jsonError } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError('Not signed in.', 401);
  return Response.json(user);
}
