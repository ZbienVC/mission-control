export type AgentRole = 'strategist' | 'engineer' | 'growth' | 'contrarian' | 'editor';

export type RDMessage = {
  role: AgentRole;
  content: string;
  round: number; // 1=initial analysis, 2=debate, 3=final memo
};

export type RDSession = {
  id: string;
  topic: string;
  project?: string;
  status: 'running' | 'complete' | 'error';
  messages: RDMessage[];
  memo?: string;
  createdAt: string;
  completedAt?: string;
};

export type RDCache = {
  sessions: RDSession[];
};

export const AGENT_NAMES: Record<AgentRole, string> = {
  strategist: 'The Strategist',
  engineer:   'The Engineer',
  growth:     'The Growth Hacker',
  contrarian: 'The Contrarian',
  editor:     'The Editor',
};

export const AGENT_COLORS: Record<AgentRole, string> = {
  strategist: '#7c3aed',
  engineer:   '#10d9a0',
  growth:     '#f97316',
  contrarian: '#ef4444',
  editor:     '#4f9deb',
};

export const AGENT_ICONS: Record<AgentRole, string> = {
  strategist: '♟️',
  engineer:   '⚙️',
  growth:     '🚀',
  contrarian: '🔥',
  editor:     '📝',
};

export function getPersonaPrompt(role: AgentRole): string {
  const map: Record<AgentRole, string> = {
    strategist: 'You think in terms of market positioning, competitive moats, and revenue leverage. You focus on the highest-impact strategic moves.',
    engineer:   'You think about technical feasibility, build complexity, architecture quality, and speed to working software.',
    growth:     'You think about user acquisition, viral loops, pricing psychology, conversion rates, and getting the first 100 paying customers.',
    contrarian: 'You challenge assumptions, identify risks, poke holes in plans, and ask uncomfortable questions.',
    editor:     'You synthesize multiple perspectives into clear, actionable recommendations.',
  };
  return map[role];
}

export const BUSINESS_CONTEXT = `Zach's business context:
- DipperAI: AI agent builder SaaS. Current features: agent creation wizard, Telegram/SMS/Discord integrations, activity logs, embed widget, agent memory, automation builder, knowledge base, multi-agent teams. Goal: first paying users, $1k MRR.
- Plato: AI nutrition/meal planning app. Phase 1 UI complete. Phase 2 needs: voice log, backend wiring, restaurant mode. Goal: production launch in 4-5 weeks.
- Splash Signal: Crypto intelligence dashboard. Features: alpha hunter, dump/risk detection, smart wallet intelligence. Goal: trading edge tool.
- Reflect Medical: Premium NJ dermatology SaaS. Features: membership tiers (Core/Evolve/Transform), Beauty Bank points, referral program, treatment catalog. Goal: production launch.
- Overall goal: Replace employment salary with product revenue + crypto advisory income.`;
