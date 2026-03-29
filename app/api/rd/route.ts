import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import type { RDCache } from '../../../lib/rdteam';

const CACHE_PATH = path.join(process.cwd(), 'data', 'rd-cache.json');

export async function GET() {
  try {
    const raw = await readFile(CACHE_PATH, 'utf-8');
    const cache: RDCache = JSON.parse(raw);
    return NextResponse.json(cache);
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}
