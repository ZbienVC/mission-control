import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { TrendingItem, TrendingCache } from '../../../../lib/trending';
import { detectKeywords, normalizeAndSort } from '../../../../lib/trending';

const CACHE_PATH = path.join(process.cwd(), 'data', 'trending-cache.json');

// ── Helpers ──────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timer));
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── X (Twitter) ──────────────────────────────────────────────────────────────

async function fetchX(): Promise<TrendingItem[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];

  const query = encodeURIComponent(
    '(claude code OR openclaw OR "ai agents" OR "vibe coding" OR anthropic OR "cursor ai") -is:retweet lang:en'
  );
  const url =
    `https://api.twitter.com/2/tweets/search/recent` +
    `?query=${query}` +
    `&max_results=20` +
    `&tweet.fields=public_metrics,created_at,author_id` +
    `&expansions=author_id` +
    `&user.fields=username`;

  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];

  const data = await res.json() as {
    data?: Array<{
      id: string;
      text: string;
      created_at: string;
      author_id: string;
      public_metrics: {
        like_count: number;
        retweet_count: number;
        reply_count: number;
        impression_count?: number;
      };
    }>;
    includes?: { users?: Array<{ id: string; username: string }> };
  };

  if (!data.data) return [];

  const usersMap = new Map<string, string>();
  (data.includes?.users ?? []).forEach(u => usersMap.set(u.id, u.username));

  const fetchedAt = new Date().toISOString();

  return data.data.map(tweet => {
    const m = tweet.public_metrics;
    const rawScore = Math.min(100, (m.like_count * 2 + m.retweet_count * 5 + m.reply_count * 3) / 10);
    const keywords = detectKeywords(tweet.text);
    return {
      id: `x-${tweet.id}`,
      platform: 'x' as const,
      title: tweet.text.slice(0, 280),
      url: `https://twitter.com/i/web/status/${tweet.id}`,
      author: usersMap.get(tweet.author_id) ?? tweet.author_id,
      metrics: {
        likes: m.like_count,
        comments: m.reply_count,
        shares: m.retweet_count,
        views: m.impression_count,
      },
      velocityScore: rawScore,
      spike: rawScore > 70,
      publishedAt: tweet.created_at,
      fetchedAt,
      keywords: keywords.length ? keywords : ['twitter'],
    };
  });
}

// ── Reddit ────────────────────────────────────────────────────────────────────

async function fetchRedditToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetchWithTimeout('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MissionControl/1.0',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string };
  return data.access_token ?? null;
}

type RedditPost = {
  data: {
    id: string;
    title: string;
    url: string;
    permalink: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: number;
    thumbnail?: string;
    selftext?: string;
    subreddit: string;
  };
};

type RedditListing = {
  data?: { children?: RedditPost[] };
};

async function fetchRedditPosts(token: string, url: string): Promise<TrendingItem[]> {
  const res = await fetchWithTimeout(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'MissionControl/1.0',
    },
  });
  if (!res.ok) return [];

  const data = await res.json() as RedditListing;
  const posts = data.data?.children ?? [];
  const fetchedAt = new Date().toISOString();

  return posts.map((post: RedditPost) => {
    const d = post.data;
    const rawScore = Math.min(100, d.score / 100 + d.num_comments / 5);
    const text = `${d.title} ${d.selftext ?? ''}`;
    const keywords = detectKeywords(text);
    return {
      id: `reddit-${d.id}`,
      platform: 'reddit' as const,
      title: d.title,
      url: `https://www.reddit.com${d.permalink}`,
      author: d.author,
      thumbnail: d.thumbnail?.startsWith('http') ? d.thumbnail : undefined,
      metrics: {
        upvotes: d.score,
        comments: d.num_comments,
        score: d.score,
      },
      velocityScore: rawScore,
      spike: rawScore > 70 && d.score > 500,
      publishedAt: new Date(d.created_utc * 1000).toISOString(),
      fetchedAt,
      keywords: keywords.length ? keywords : [d.subreddit.toLowerCase()],
    };
  });
}

async function fetchReddit(): Promise<TrendingItem[]> {
  const token = await fetchRedditToken();
  if (!token) return [];

  const searchUrl =
    `https://oauth.reddit.com/search.json` +
    `?q=claude+code+OR+openclaw+OR+ai+agents+OR+vibe+coding+OR+anthropic` +
    `&sort=hot&limit=20&t=day`;

  const subreddits = ['ClaudeAI', 'artificial', 'MachineLearning'];
  const subredditUrls = subreddits.map(
    s => `https://oauth.reddit.com/r/${s}/hot.json?limit=10`
  );

  const all = await Promise.allSettled([
    fetchRedditPosts(token, searchUrl),
    ...subredditUrls.map(u => fetchRedditPosts(token, u)),
  ]);

  const items: TrendingItem[] = [];
  const seen = new Set<string>();
  for (const result of all) {
    if (result.status === 'fulfilled') {
      for (const item of result.value) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }
    }
  }
  return items;
}

// ── YouTube ───────────────────────────────────────────────────────────────────

async function fetchYouTube(): Promise<TrendingItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const publishedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet` +
    `&q=claude+code+ai+agents+openclaw+anthropic+vibe+coding` +
    `&type=video` +
    `&order=date` +
    `&publishedAfter=${encodeURIComponent(publishedAfter)}` +
    `&maxResults=20` +
    `&key=${apiKey}`;

  const searchRes = await fetchWithTimeout(searchUrl);
  if (!searchRes.ok) return [];

  const searchData = await searchRes.json() as {
    items?: Array<{
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails?: { medium?: { url?: string } };
        description?: string;
      };
    }>;
  };

  const videos = searchData.items ?? [];
  if (videos.length === 0) return [];

  const ids = videos.map(v => v.id.videoId).join(',');
  const statsUrl =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=statistics,snippet` +
    `&id=${ids}` +
    `&key=${apiKey}`;

  const statsRes = await fetchWithTimeout(statsUrl);
  if (!statsRes.ok) return [];

  const statsData = await statsRes.json() as {
    items?: Array<{
      id: string;
      snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails?: { medium?: { url?: string } }; description?: string };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
    }>;
  };

  const fetchedAt = new Date().toISOString();
  return (statsData.items ?? []).map(v => {
    const stats = v.statistics;
    const viewCount = parseInt(stats.viewCount ?? '0', 10);
    const likeCount = parseInt(stats.likeCount ?? '0', 10);
    const commentCount = parseInt(stats.commentCount ?? '0', 10);
    const rawScore = Math.min(100, viewCount / 1000 + likeCount / 100 + commentCount / 50);
    const text = `${v.snippet.title} ${v.snippet.description ?? ''}`;
    const keywords = detectKeywords(text);
    return {
      id: `youtube-${v.id}`,
      platform: 'youtube' as const,
      title: v.snippet.title,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      author: v.snippet.channelTitle,
      thumbnail: v.snippet.thumbnails?.medium?.url,
      metrics: {
        views: viewCount,
        likes: likeCount,
        comments: commentCount,
      },
      velocityScore: rawScore,
      spike: rawScore > 70,
      publishedAt: v.snippet.publishedAt,
      fetchedAt,
      keywords: keywords.length ? keywords : ['youtube'],
    };
  });
}

// ── Telegram alert ────────────────────────────────────────────────────────────

async function sendTelegramAlert(spikes: TrendingItem[]): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || spikes.length === 0) return;

  const platforms = [...new Set(spikes.map(i => i.platform))].join(', ');
  const lines = spikes.slice(0, 10).map(i => {
    const title = i.title.slice(0, 80);
    return `• <b>${title}</b> — ${i.platform} · score ${i.velocityScore}\n  ${i.url}`;
  });

  const text =
    `🔥 <b>Trending Spike Alert</b>\n\n` +
    `${spikes.length} item${spikes.length !== 1 ? 's' : ''} spiking on ${platforms}:\n\n` +
    lines.join('\n\n');

  await fetchWithTimeout(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    }
  );
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST() {
  const results = await Promise.allSettled([
    withTimeout(fetchX()),
    withTimeout(fetchReddit()),
    withTimeout(fetchYouTube()),
  ]);

  let items: TrendingItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      items = items.concat(result.value);
    }
  }

  // Normalize + sort
  items = normalizeAndSort(items);

  const cache: TrendingCache = {
    lastScanned: new Date().toISOString(),
    items,
  };

  // Write cache
  try {
    await mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // non-fatal — still return data
  }

  // Telegram alert for spikes
  const spikes = items.filter(i => i.spike);
  if (spikes.length > 0) {
    await sendTelegramAlert(spikes).catch(() => {/* ignore alert failures */});
  }

  const stats = {
    x: items.filter(i => i.platform === 'x').length,
    reddit: items.filter(i => i.platform === 'reddit').length,
    youtube: items.filter(i => i.platform === 'youtube').length,
    spikes: spikes.length,
  };

  return NextResponse.json({
    lastScanned: cache.lastScanned,
    items,
    stats,
  });
}
