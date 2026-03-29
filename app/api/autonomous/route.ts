import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { BUSINESS_CONTEXT } from '../../../lib/rdteam';

const LOG_PATH = path.join(process.cwd(), 'data', 'autonomous-log.json');
const MAX_TASKS = 30;

type AutonomousTask = {
  id: string;
  date: string;
  taskType: string;
  project: string;
  title: string;
  rationale: string;
  output: string;
  executedAt: string;
};

type AutonomousLog = {
  tasks: AutonomousTask[];
};

async function callClaude(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1024,
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
      max_tokens: maxTokens,
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

function getTaskExecutionPrompt(taskType: string, project: string, title: string): string {
  const base = `You are producing a deliverable for: "${title}" — Project: ${project}\n\nBusiness context:\n${BUSINESS_CONTEXT}\n\n`;

  const prompts: Record<string, string> = {
    feature_spec: `${base}Write a detailed feature spec for ${project} including: user story, acceptance criteria, technical approach, API endpoints needed, UI components, and estimated complexity (S/M/L). Be specific to the current state of the project.\n\nAlso include:\n- Feature Overview (what it is, why it matters now)\n- 3-5 User Stories with acceptance criteria\n- Technical Requirements (APIs, data models, key logic)\n- Implementation Phases (step-by-step plan)\n- Success Metrics\n- Edge Cases & Risks\n\nBe specific, actionable, and developer-ready. 600-800 words.`,

    growth_strategy: `${base}Write a specific growth strategy for getting DipperAI's first 10 paying customers. Include: target user persona, acquisition channels, outreach scripts, pricing psychology, and a 2-week action plan.\n\nAlso include:\n- Primary Acquisition Channel (and why this one first)\n- Exact outreach messages (DMs, emails, cold scripts ready to copy-paste)\n- Pricing tier recommendations with psychological anchoring\n- Viral/Referral Mechanics to build on early traction\n- Key Metrics to Track week-over-week\n\nBe specific and immediately actionable. 600-800 words.`,

    market_analysis: `${base}Analyze the competitive landscape for ${project}. Include: 3 direct competitors with their pricing and weaknesses, 2 market opportunities, and a specific positioning recommendation.\n\nAlso include:\n- Market Opportunity (size, growth, timing)\n- Target Customer Profile (who to sell to first)\n- Key Differentiators (what makes this product win)\n- Go-To-Market Angle\n\nBe specific and data-informed. 600-800 words.`,

    revenue_analysis: `${base}Analyze revenue opportunities across all of Zach's projects. Rank them by estimated MRR potential in 90 days, with specific action steps for each.\n\nAlso include:\n- Current Revenue Model Assessment per project\n- Pricing Tier Recommendations (with psychological anchoring)\n- Highest-Leverage Revenue Actions (ranked by effort/impact)\n- Upsell / Expansion Opportunities\n- Churn Risk Factors & Retention Plays\n- Concrete 90-Day Revenue Target & Path to hit it\n\nBe specific with numbers where possible. 600-800 words.`,

    technical_review: `${base}Review the architecture of ${project} and identify: 3 technical risks, 2 performance improvements, and 1 refactor that would meaningfully improve developer velocity.\n\nAlso include:\n- Current State Assessment (tech stack, what's built, what's missing)\n- Architecture Strengths (what to keep)\n- Scaling Considerations (what breaks at 100x users)\n- Recommended Next Engineering Steps in priority order\n\nBe specific and pragmatic. 600-800 words.`,

    content_brief: `${base}Write a content brief for a Twitter/LinkedIn post about ${project} that would resonate with indie hackers and startup founders. Include: hook, main insight, call to action, and 3 hashtags.\n\nAlso produce:\n- 3 ready-to-post tweet/LinkedIn drafts (different angles: insight, story, controversial take)\n- Content Pillars (3-4 core themes to own for this project)\n- Distribution strategy: where to post and why\n- Brand Voice Guidelines specific to ${project}\n\nBe specific and immediately executable. 600-800 words.`,
  };

  return prompts[taskType] ?? prompts.feature_spec;
}

async function sendTelegram(task: AutonomousTask): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const preview = task.output.slice(0, 200);
  const text = `🤖 <b>Autonomous Employee — Nightly Report</b>\n\nI worked while you slept.\n\n<b>Task:</b> ${task.title}\n<b>Project:</b> ${task.project}\n<b>Type:</b> ${task.taskType}\n\n<b>Why I chose this:</b> ${task.rationale}\n\nFull report available in Mission Control → R&amp;D → Autonomous Log\n\n<i>${preview}...</i>`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  }).catch(() => { /* ignore telegram errors */ });
}

async function loadLog(): Promise<AutonomousLog> {
  try {
    const raw = await readFile(LOG_PATH, 'utf-8');
    return JSON.parse(raw) as AutonomousLog;
  } catch {
    return { tasks: [] };
  }
}

async function saveLog(task: AutonomousTask): Promise<void> {
  const log = await loadLog();
  const tasks = [task, ...log.tasks].slice(0, MAX_TASKS);
  await mkdir(path.join(process.cwd(), 'data'), { recursive: true });
  await writeFile(LOG_PATH, JSON.stringify({ tasks }, null, 2), 'utf-8');
}

export async function POST() {
  // Step 1: Situation assessment
  const assessmentSystem = `You are Zach's autonomous AI employee. You work while he sleeps. Your job is to analyze his business and execute one high-value task.`;
  const assessmentUser = `Business context:\n${BUSINESS_CONTEXT}\n\nCurrent date/time: ${new Date().toISOString()}\n\nBased on Zach's goals and current project status, decide ONE task to do right now that will bring him closer to his goals.\n\nChoose from these task types:\n1. "feature_spec" — Write a detailed feature specification for a new feature\n2. "market_analysis" — Analyze a market opportunity or competitor\n3. "growth_strategy" — Write a specific growth/acquisition strategy\n4. "technical_review" — Review architecture and suggest improvements\n5. "content_brief" — Write a content/marketing brief\n6. "revenue_analysis" — Analyze revenue opportunities and pricing\n\nRespond with JSON only:\n{\n  "taskType": string,\n  "project": string,\n  "title": string,\n  "rationale": string\n}`;

  let taskMeta: { taskType: string; project: string; title: string; rationale: string };

  try {
    const assessmentRaw = await callClaude('claude-haiku-4-5', assessmentSystem, assessmentUser, 512);
    // Extract JSON from response (handle possible markdown code blocks)
    const jsonMatch = assessmentRaw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in assessment response');
    taskMeta = JSON.parse(jsonMatch[0]) as typeof taskMeta;
  } catch (err) {
    console.error('Assessment failed:', err);
    return NextResponse.json({ error: 'Assessment step failed' }, { status: 500 });
  }

  // Step 2: Execute the task
  let output = '';
  try {
    const execSystem = `You are an elite consultant producing high-quality strategic work for a startup founder.`;
    const execUser = getTaskExecutionPrompt(taskMeta.taskType, taskMeta.project, taskMeta.title);
    output = await callClaude('claude-sonnet-4-5', execSystem, execUser, 2048);
  } catch (err) {
    console.error('Execution failed:', err);
    output = `Task execution failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Step 3: Save and notify
  const task: AutonomousTask = {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    taskType: taskMeta.taskType,
    project: taskMeta.project,
    title: taskMeta.title,
    rationale: taskMeta.rationale,
    output,
    executedAt: new Date().toISOString(),
  };

  await saveLog(task);
  await sendTelegram(task);

  return NextResponse.json(task);
}
