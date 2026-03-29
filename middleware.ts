import { NextRequest, NextResponse } from 'next/server';

const USERNAME = process.env.AUTH_USER ?? 'zach';
const PASSWORD = process.env.AUTH_PASS ?? '';

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (authHeader) {
    const base64 = authHeader.split(' ')[1] ?? '';
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
    if (user === USERNAME && pass === PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Mission Control"',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
