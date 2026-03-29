import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { RDSession, RDMessage, RDCache, AgentRole } from '../../../../lib/rdteam';
import { AGENT_NAMES, BUSINESS_CONTEXT, getPersonaPrompt } from '../../../../lib/rdteam';

const CACHE_PATH = path.join(process.cwd(), 'data', 'rd-cache.json');
const MAX_SESSIONS = 20;

async function callClaude(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    content: Array<{ type: string; text: string }>;
  };

  return data.content.find(c => c.type === 'text')?.text ?? '';
}

async function loadCache(): Promise<RDCache> {
  try {
    const raw = await readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(raw) as RDCache;
  } catch {
    return { sessions: [] };
  }
}

async function saveCache(session: RDSession): Promise<void> {
  const cache = await loadCache();
  const sessions = [session, ...cache.sessions.filter(s => s.id !== session.id)];
  const trimmed = sessions.slice(0, MAX_SESSIONS);
  await mkdir(path.join(process.cwd(), 'data'), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify({ sessions: trimmed }, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { topic: string; project?: string };
  const { topic, project } = body;

  if (!topic?.trim()) {
    return NextResponse.json({ error: 'topic required' }, { status: 400 });
  }

  const session: RDSession = {
    id: crypto.randomUUID(),
    topic: topic.trim(),
    project,
    status: 'running',
    messages: [],
    createdAt: new Date().toISOString(),
  };

  const nonEditorRoles: AgentRole[] = ['strategist', 'engineer', 'growth', 'contrarian'];
  const model = 'claude-haiku-4-5';

  try {
    // ── Round 1: Initial analysis ───────────────────────────────────────────
    for (const role of nonEditorRoles) {
      const systemPrompt = `You are ${AGENT_NAMES[role]}, a member of Zach's elite R&D team. ${getPersonaPrompt(role)}`;
      const userPrompt = `Research topic: "${topic}"${project ? ` (focus: ${project})` : ''}\n\nBusiness context:\n${BUSINESS_CONTEXT}\n\nProvide your analysis in 3-5 concise bullet points. Be specific and actionable. Max 200 words.`;

      const content = await callClaude(model, systemPrompt, userPrompt);
      session.messages.push({ role, content, round: 1 });
    }

    // ── Round 2: Debate ─────────────────────────────────────────────────────
    const round1Summaries = nonEditorRoles.map(r => {
      const msg = session.messages.find(m => m.role === r && m.round === 1);
      return `**${AGENT_NAMES[r]}:**\n${msg?.content ?? ''}`;
    }).join('\n\n');

    for (const role of nonEditorRoles) {
      const systemPrompt = `You are ${AGENT_NAMES[role]}, a member of Zach's elite R&D team. ${getPersonaPrompt(role)}`;
      const userPrompt = `Here are the other team members' analyses:\n\n${round1Summaries}\n\nNow respond to the group. Challenge one idea you disagree with and build on one you agree with. Max 150 words.`;

      const content = await callClaude(model, systemPrompt, userPrompt);
      session.messages.push({ role, content, round: 2 });
    }

    // ── Round 3: Final memo (Editor) ────────────────────────────────────────
    const fullTranscript = session.messages.map(m => {
      const roundLabel = m.round === 1 ? 'Round 1 · Analysis' : 'Round 2 · Debate';
      return `**${AGENT_NAMES[m.role]} [${roundLabel}]:**\n${m.content}`;
    }).join('\n\n');

    const editorSystem = `You are The Editor. Your job is to synthesize the team's debate into a clean strategic memo for Zach.`;
    const editorUser = `Full debate transcript:\n\n${fullTranscript}\n\nWrite a final strategic memo with:\n1. Executive Summary (2 sentences)\n2. Top 3 Recommendations (ranked by impact, with rationale)\n3. Biggest Risk to Watch\n4. Suggested Next Action (the single most important thing Zach should do this week)\n\nBe direct, specific, and actionable. Max 400 words.`;

    const memo = await callClaude('claude-haiku-4-5', editorSystem, editorUser);
    session.messages.push({ role: 'editor', content: memo, round: 3 });
    session.memo = memo;
    session.status = 'complete';
    session.completedAt = new Date().toISOString();
  } catch (err) {
    session.status = 'error';
    console.error('R&D session error:', err);
  }

  await saveCache(session);
  return NextResponse.json(session);
}
