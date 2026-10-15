import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CSRF guard for API mutations. SameSite=lax cookies already block most
 * cross-site POSTs; this rejects any mutating request whose Origin/Referer
 * host differs from the app host. Requests without either header
 * (non-browser clients) pass through.
 */
export function proxy(req: NextRequest) {
  // Matcher runs broad (basePath-proof); only API routes get checked.
  if (!req.nextUrl.pathname.includes('/api/')) return NextResponse.next();
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return NextResponse.next();
  }
  const claimed = req.headers.get('origin') ?? req.headers.get('referer');
  if (!claimed) return NextResponse.next();
  let claimedHost = '';
  try {
    claimedHost = new URL(claimed).host;
  } catch {
    return NextResponse.json({ error: 'Bad origin.' }, { status: 403 });
  }
  const reqHost = req.headers.get('host') ?? req.nextUrl.host;
  if (claimedHost !== reqHost) {
    return NextResponse.json({ error: 'Bad origin.' }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
