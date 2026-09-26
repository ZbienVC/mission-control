import { NextRequest, NextResponse } from 'next/server';

// No default login: the username and password come only from Vercel's environment settings.
// If they're missing, the site stays locked rather than falling back to a known password.
const VALID_USER = process.env.AUTH_USER;
const VALID_PASS = process.env.AUTH_PASS;

export function middleware(req: NextRequest) {
  if (!VALID_USER || !VALID_PASS) {
    return new NextResponse('Login is not configured: set AUTH_USER and AUTH_PASS in Vercel.', { status: 503 });
  }

  const auth = req.headers.get('authorization') ?? '';

  if (auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const colon = decoded.indexOf(':');
      const user = decoded.slice(0, colon);
      const pass = decoded.slice(colon + 1);
      if (user === VALID_USER && pass === VALID_PASS) {
        return NextResponse.next();
      }
    } catch {}
  }

  return new NextResponse('Access denied', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Mission Control"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
