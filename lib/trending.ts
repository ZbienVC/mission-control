export type Platform = 'x' | 'reddit' | 'youtube';

export type TrendingItem = {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  author: string;
  thumbnail?: string;
  metrics: {
    likes?: number;
    views?: number;
    comments?: number;
    shares?: number;
    upvotes?: number;
    score?: number;
  };
  velocityScore: number; // 0-100, calculated from engagement/time
  spike: boolean;        // true if velocityScore >= 70
  publishedAt: string;
  fetchedAt: string;
  keywords: string[];    // which tracked keywords matched
};

export type TrendingCache = {
  lastScanned: string | null;
  items: TrendingItem[];
};

export const TRACKED_KEYWORDS = [
  'claude code',
  'openclaw',
  'ai agents',
  'ai development',
  'vibe coding',
  'cursor ai',
  'anthropic',
];

export function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return TRACKED_KEYWORDS.filter(kw => lower.includes(kw));
}

export function normalizeAndSort(items: TrendingItem[]): TrendingItem[] {
  if (items.length === 0) return items;
  const max = Math.max(...items.map(i => i.velocityScore), 1);
  const normalized = items.map(i => ({
    ...i,
    velocityScore: Math.round((i.velocityScore / max) * 100),
  }));
  // Re-evaluate spikes after normalization
  const withSpikes = normalized.map(i => ({
    ...i,
    spike: i.velocityScore >= 70,
  }));
  return withSpikes.sort((a, b) => b.velocityScore - a.velocityScore);
}
