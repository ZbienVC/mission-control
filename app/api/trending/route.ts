import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import type { TrendingCache, TrendingItem, Platform } from '../../../lib/trending';

const CACHE_PATH = path.join(process.cwd(), 'data', 'trending-cache.json');

async function readCache(): Promise<TrendingCache> {
  try {
    const raw = await readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(raw) as TrendingCache;
  } catch {
    return { lastScanned: null, items: [] };
  }
}

export async function GET() {
  const cache = await readCache();

  const stats = {
    x: cache.items.filter((i: TrendingItem) => i.platform === ('x' as Platform)).length,
    reddit: cache.items.filter((i: TrendingItem) => i.platform === ('reddit' as Platform)).length,
    youtube: cache.items.filter((i: TrendingItem) => i.platform === ('youtube' as Platform)).length,
    spikes: cache.items.filter((i: TrendingItem) => i.spike).length,
  };

  return NextResponse.json({
    lastScanned: cache.lastScanned,
    items: cache.items,
    stats,
  });
}
