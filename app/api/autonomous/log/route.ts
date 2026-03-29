import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'data', 'autonomous-log.json');

export async function GET() {
  try {
    const raw = await readFile(LOG_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ tasks: [] });
  }
}
