import { NextRequest, NextResponse } from 'next/server';

const USERNAME = process.env.AUTH_USER ?? 'zach';
const PASSWORD = process.env.AUTH_PASS ?? '';

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);
    const colon = decoded.indexOf(':');
    const user = decoded.slice(0, colon);
    const pass = decoded.slice(colon + 1);

    if (user === USERNAME && pass === PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Mission Control", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
