import { NextRequest, NextResponse } from 'next/server';

const VALID_USER = process.env.AUTH_USER || 'zach';
const VALID_PASS = process.env.AUTH_PASS || 'Drfreaky6767Q!123';

export function middleware(req: NextRequest) {
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
