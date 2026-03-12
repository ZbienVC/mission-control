import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ ok: false, status: null, error: 'No URL provided' }, { status: 400 });
  }

  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'MissionControl/1.0 health-checker' },
    });
    const ms = Date.now() - start;
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      ms,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, status: null, error: msg });
  }
}
