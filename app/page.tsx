'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Agent, AGENTS, AgentType, Task, TaskStatus } from '../lib/agents';
import type { RDSession, RDMessage, AgentRole } from '../lib/rdteam';
import { AGENT_NAMES, AGENT_COLORS as RD_AGENT_COLORS, AGENT_ICONS } from '../lib/rdteam';

// ─── Types ──────────────────────────────────────────────────────────────────

type DailyLogEntry = { id: string; timestamp: string; summary: string; tags: string[] };
type DailyLogDay   = { date: string; entries: DailyLogEntry[] };
type NavSection    = 'overview' | 'kanban' | 'agents' | 'memory' | 'trends' | 'rd';

const DAILY_LOG_KEY = 'missionControl.dailyLogs.v1';
const todayISO = () => new Date().toISOString().slice(0, 10);

// ─── Seed data ───────────────────────────────────────────────────────────────

const SEED_TASKS: Task[] = [
  { id: 'task-1', title: 'DipperAI Phase 6 — Agent Teams', description: 'Multi-agent coordination system', assignedAgent: 'coding',     status: 'running',   createdAt: new Date(Date.now() - 1e3*60*90), startedAt: new Date(Date.now() - 1e3*60*60), progress: 72, checkpoints: [] },
  { id: 'task-2', title: 'Mission Control redesign',       description: 'Mobile-first board + daily memory', assignedAgent: 'operations', status: 'running',   createdAt: new Date(Date.now() - 1e3*60*30), progress: 50, checkpoints: [] },
  { id: 'task-3', title: 'Splash Signal sprint prep',      description: 'Plan next round of features',       assignedAgent: 'research',   status: 'queued',    createdAt: new Date(Date.now() - 1e3*60*20), progress: 0,  checkpoints: [] },
  { id: 'task-4', title: 'Plato voice log prototype',      description: 'Voice intake spike + user tests',   assignedAgent: 'growth',     status: 'completed', createdAt: new Date(Date.now() - 1e3*60*60*24), completedAt: new Date(Date.now() - 1e3*60*60*20), progress: 100, result: 'Done', checkpoints: [] },
];

const AGENT_COLORS: Record<AgentType, string> = {
  coding:     '#7c3aed',
  research:   '#0ea5e9',
  operations: '#10d9a0',
  growth:     '#f97316',
};

const COLUMNS = [
  { id: 'queued',    label: 'Backlog',     color: '#4f9deb' },
  { id: 'running',   label: 'In Flight',   color: '#10d9a0' },
  { id: 'escalated', label: 'Needs Input', color: '#f59e0b' },
  { id: 'completed', label: 'Done',        color: '#a855f7' },
] as const;

const NAV_ITEMS: { id: NavSection; label: string; icon: string; description: string }[] = [
  { id: 'overview', label: 'Overview',   icon: '⚡', description: 'Metrics + quick glance' },
  { id: 'kanban',   label: 'Kanban',     icon: '📋', description: 'Task board + workflow' },
  { id: 'agents',   label: 'Agents',     icon: '🤖', description: 'Live agent monitor' },
  { id: 'memory',   label: 'Daily Log',  icon: '🧠', description: 'Session memory + summaries' },
  { id: 'trends',   label: 'Trends',     icon: '📡', description: 'Live trending monitor' },
  { id: 'rd',       label: 'R&D Team',   icon: '🧬', description: 'AI research team + autonomous work log' },
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function MissionControl() {
  const [section, setSection]         = useState<NavSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks]             = useState<Task[]>(SEED_TASKS);
  const [agents, setAgents]           = useState<Agent[]>(
    Object.entries(AGENTS).map(([key, cfg]) => ({
      ...cfg, id: key, status: key === 'coding' ? 'working' : 'idle', memory: [],
      currentTask: key === 'coding' ? 'task-1' : undefined,
    }))
  );

  const [dailyLogs, setDailyLogs] = useState<DailyLogDay[]>([{
    date: todayISO(),
    entries: [{
      id: '1', timestamp: new Date().toISOString(),
      summary: 'DipperAI Phases 1–6 shipped. Mission Control board rebuilt with daily memory, mobile sidebar, clean nav.',
      tags: ['DipperAI', 'Mission Control'],
    }],
  }]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [summaryInput, setSummaryInput] = useState('');
  const [tagInput, setTagInput]         = useState('');
  const [newTask, setNewTask]           = useState({ title: '', agent: 'coding' as AgentType });

  // Load logs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(DAILY_LOG_KEY);
    if (stored) { try { setDailyLogs(JSON.parse(stored)); } catch {} }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  // Fake progress
  useEffect(() => {
    const id = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.status !== 'running' || t.progress >= 100) return t;
        const next = Math.min(t.progress + Math.random() * 6, 100);
        if (next >= 100) return { ...t, progress: 100, status: 'completed', completedAt: new Date() };
        return { ...t, progress: next };
      }));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Sync agents
  useEffect(() => {
    setAgents(prev => prev.map(a => {
      const live = tasks.find(t => t.assignedAgent === a.type && t.status === 'running');
      return { ...a, status: live ? 'working' : 'idle', currentTask: live?.id };
    }));
  }, [tasks]);

  const navigate = (s: NavSection) => { setSection(s); setSidebarOpen(false); };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    setTasks(prev => [{ id: crypto.randomUUID(), title: newTask.title.trim(), description: 'Quick capture', assignedAgent: newTask.agent, status: 'queued', createdAt: new Date(), progress: 0, checkpoints: [] }, ...prev]);
    setNewTask(p => ({ ...p, title: '' }));
  };

  const addLog = () => {
    if (!summaryInput.trim()) return;
    const entry: DailyLogEntry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), summary: summaryInput.trim(), tags: tagInput.split(',').map(t => t.trim()).filter(Boolean) };
    setDailyLogs(prev => {
      const existing = prev.find(d => d.date === selectedDate);
      if (existing) return prev.map(d => d.date === selectedDate ? { ...d, entries: [entry, ...d.entries] } : d);
      return [{ date: selectedDate, entries: [entry] }, ...prev];
    });
    setSummaryInput(''); setTagInput('');
  };

  const todaysLog  = dailyLogs.find(d => d.date === selectedDate);
  const recentDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
  const inFlight   = tasks.filter(t => t.status === 'running').length;
  const working    = agents.filter(a => a.status === 'working').length;
  const doneCount  = tasks.filter(t => t.status === 'completed').length;
  const totalLogs  = dailyLogs.reduce((s, d) => s + d.entries.length, 0);

  return (
    <div style={S.root}>
      {/* ── Sidebar backdrop ── */}
      {sidebarOpen && <div style={S.backdrop} onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside style={{ ...S.sidebar, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div style={S.sidebarHeader}>
          <div style={S.sidebarBrand}>
            <span style={S.brandIcon}>🎛️</span>
            <div>
              <div style={S.brandTitle}>Mission Control</div>
              <div style={S.brandSub}>Zach's Command Board</div>
            </div>
          </div>
          <button style={S.closeBtn} onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav style={S.nav}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} style={{ ...S.navItem, ...(section === item.id ? S.navActive : {}) }} onClick={() => navigate(item.id)}>
              <span style={S.navIcon}>{item.icon}</span>
              <div style={S.navText}>
                <span style={S.navLabel}>{item.label}</span>
                <span style={S.navDesc}>{item.description}</span>
              </div>
              {section === item.id && <span style={S.navDot} />}
            </button>
          ))}
        </nav>

        <div style={S.sidebarFooter}>
          <div style={S.statPill}>
            <span style={{ color: '#10d9a0' }}>●</span> {working} agent{working !== 1 ? 's' : ''} active
          </div>
          <div style={S.statPill}>
            <span style={{ color: '#4f9deb' }}>●</span> {inFlight} task{inFlight !== 1 ? 's' : ''} in flight
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={S.main}>
        {/* ── Top bar ── */}
        <header style={S.topbar}>
          <button style={S.menuBtn} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            🎛️
          </button>
          <div style={S.topbarTitle}>
            <span>{NAV_ITEMS.find(n => n.id === section)?.icon} </span>
            {NAV_ITEMS.find(n => n.id === section)?.label}
          </div>
          <div style={S.topbarMeta}>
            <span style={{ ...S.badge, background: 'rgba(16,217,160,0.15)', color: '#10d9a0' }}>{working} live</span>
            <span style={{ ...S.badge, background: 'rgba(79,157,235,0.15)', color: '#4f9deb' }}>{inFlight} tasks</span>
          </div>
        </header>

        <div style={S.content}>
          {section === 'overview' && <Overview tasks={tasks} agents={agents} totalLogs={totalLogs} doneCount={doneCount} navigate={navigate} />}
          {section === 'kanban'   && <Kanban   tasks={tasks} setTasks={setTasks} newTask={newTask} setNewTask={setNewTask} addTask={addTask} />}
          {section === 'agents'   && <AgentMonitor agents={agents} tasks={tasks} />}
          {section === 'memory'   && <Memory dailyLogs={dailyLogs} selectedDate={selectedDate} setSelectedDate={setSelectedDate} recentDays={recentDays} todaysLog={todaysLog} summaryInput={summaryInput} setSummaryInput={setSummaryInput} tagInput={tagInput} setTagInput={setTagInput} addLog={addLog} />}
          {section === 'trends'   && <Trends />}
          {section === 'rd'       && <RDTeam />}
        </div>
      </div>
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function Overview({ tasks, agents, totalLogs, doneCount, navigate }: any) {
  const inFlight = tasks.filter((t: Task) => t.status === 'running');
  return (
    <div style={S.section}>
      <SectionHeader title="Overview" subtitle="At-a-glance status across all systems" />

      <div style={S.metricGrid}>
        {[
          { label: 'Agents Active',   value: agents.filter((a: Agent) => a.status === 'working').length, color: '#10d9a0', icon: '🤖' },
          { label: 'In Flight',       value: inFlight.length, color: '#4f9deb', icon: '✈️' },
          { label: 'Completed Today', value: doneCount,       color: '#a855f7', icon: '✅' },
          { label: 'Daily Entries',   value: totalLogs,       color: '#f97316', icon: '🧠' },
        ].map(m => (
          <div key={m.label} style={{ ...S.metricCard, borderColor: m.color + '33' }}>
            <span style={S.metricIcon}>{m.icon}</span>
            <div style={{ ...S.metricValue, color: m.color }}>{m.value}</div>
            <div style={S.metricLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>In-Flight Tasks</span>
          <button style={S.linkBtn} onClick={() => navigate('kanban')}>View board →</button>
        </div>
        {inFlight.length === 0 && <p style={S.empty}>No tasks in flight right now.</p>}
        {inFlight.map((t: Task) => (
          <div key={t.id} style={S.taskRow}>
            <div style={{ ...S.agentDot, background: AGENT_COLORS[t.assignedAgent] }} />
            <div style={{ flex: 1 }}>
              <div style={S.taskTitle}>{t.title}</div>
              <div style={S.progressBar}>
                <div style={{ ...S.progressFill, width: `${t.progress}%`, background: AGENT_COLORS[t.assignedAgent] }} />
              </div>
            </div>
            <span style={S.pct}>{Math.round(t.progress)}%</span>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>Agent Status</span>
          <button style={S.linkBtn} onClick={() => navigate('agents')}>Monitor →</button>
        </div>
        <div style={S.agentMiniGrid}>
          {agents.map((a: Agent) => (
            <div key={a.id} style={S.agentMini}>
              <div style={{ ...S.agentAvatar, background: AGENT_COLORS[a.type] }}>{a.name[0]}</div>
              <div>
                <div style={S.agentMiniName}>{a.name}</div>
                <span style={{ ...S.statusPill, ...(a.status === 'working' ? S.pillLive : S.pillIdle) }}>{a.status === 'working' ? 'LIVE' : 'IDLE'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kanban({ tasks, setTasks, newTask, setNewTask, addTask }: any) {
  return (
    <div style={S.section}>
      <SectionHeader title="Kanban Board" subtitle="Manage tasks across all projects" />

      <div style={S.addTaskRow}>
        <input style={S.input} placeholder="New task…" value={newTask.title} onChange={(e: any) => setNewTask((p: any) => ({ ...p, title: e.target.value }))} onKeyDown={(e: any) => e.key === 'Enter' && addTask()} />
        <select style={S.select} value={newTask.agent} onChange={(e: any) => setNewTask((p: any) => ({ ...p, agent: e.target.value }))}>
          {Object.values(AGENTS).map((a: any) => <option key={a.type} value={a.type}>{a.name}</option>)}
        </select>
        <button style={S.primaryBtn} onClick={addTask}>Add</button>
      </div>

      {COLUMNS.map(col => {
        const cards = tasks.filter((t: Task) => t.status === col.id || (col.id === 'escalated' && t.status === 'failed'));
        return (
          <div key={col.id} style={S.kanbanSection}>
            <div style={S.kanbanColHeader}>
              <span style={{ ...S.colDot, background: col.color }} />
              <span style={S.colLabel}>{col.label}</span>
              <span style={S.colCount}>{cards.length}</span>
            </div>
            {cards.length === 0 && <p style={S.emptyCol}>Nothing here</p>}
            {cards.map((card: Task) => (
              <div key={card.id} style={S.kanbanCard}>
                <div style={S.kanbanCardTop}>
                  <span style={S.kanbanTitle}>{card.title}</span>
                  <span style={{ ...S.agentChip, borderColor: AGENT_COLORS[card.assignedAgent], color: AGENT_COLORS[card.assignedAgent] }}>{AGENTS[card.assignedAgent].name}</span>
                </div>
                <p style={S.kanbanDesc}>{card.description}</p>
                {card.status === 'running' && (
                  <div style={S.progressBar}>
                    <div style={{ ...S.progressFill, width: `${card.progress}%`, background: AGENT_COLORS[card.assignedAgent] }} />
                  </div>
                )}
                <div style={S.kanbanCardBot}>
                  <select style={S.selectSm} value={card.status} onChange={(e: any) => setTasks((prev: Task[]) => prev.map(t => t.id === card.id ? { ...t, status: e.target.value } : t))}>
                    <option value="queued">Backlog</option>
                    <option value="running">In Flight</option>
                    <option value="escalated">Needs Input</option>
                    <option value="completed">Done</option>
                  </select>
                  {card.status === 'running' && <span style={S.pct}>{Math.round(card.progress)}%</span>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function AgentMonitor({ agents, tasks }: any) {
  return (
    <div style={S.section}>
      <SectionHeader title="Agent Monitor" subtitle="Live view of all agents and their work" />
      {agents.map((a: Agent) => {
        const currentTask = tasks.find((t: Task) => t.id === a.currentTask);
        return (
          <div key={a.id} style={{ ...S.agentCard, borderLeftColor: AGENT_COLORS[a.type] }}>
            <div style={S.agentCardTop}>
              <div style={{ ...S.agentAvatar, background: AGENT_COLORS[a.type], width: 48, height: 48, fontSize: 20 }}>{a.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={S.agentName}>{a.name}</div>
                <div style={S.agentDesc}>{a.description}</div>
              </div>
              <span style={{ ...S.statusPill, ...(a.status === 'working' ? S.pillLive : S.pillIdle) }}>{a.status === 'working' ? '● LIVE' : '○ IDLE'}</span>
            </div>

            <div style={S.agentSection}>
              <span style={S.agentSectionLabel}>Current task</span>
              <span style={S.agentSectionVal}>{currentTask?.title ?? '—'}</span>
            </div>
            {currentTask && (
              <div style={S.progressBar}>
                <div style={{ ...S.progressFill, width: `${currentTask.progress}%`, background: AGENT_COLORS[a.type] }} />
              </div>
            )}

            <div style={S.capList}>
              {a.capabilities.map((c: string) => <span key={c} style={S.cap}>{c}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Memory({ dailyLogs, selectedDate, setSelectedDate, recentDays, todaysLog, summaryInput, setSummaryInput, tagInput, setTagInput, addLog }: any) {
  const allEntries = dailyLogs.flatMap((d: DailyLogDay) => d.entries).length;
  return (
    <div style={S.section}>
      <SectionHeader title="Daily Memory" subtitle={`${allEntries} entries stored · I reference these logs whenever you ask about a past day or project`} />

      <div style={S.dateStrip}>
        {recentDays.map((date: string) => {
          const hasEntries = dailyLogs.find((d: DailyLogDay) => d.date === date)?.entries.length > 0;
          return (
            <button key={date} style={{ ...S.dateBtn, ...(date === selectedDate ? S.dateBtnActive : {}) }} onClick={() => setSelectedDate(date)}>
              <span style={S.dayLabel}>{new Date(date + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' })}</span>
              <strong style={S.dayNum}>{new Date(date + 'T12:00').getDate()}</strong>
              {hasEntries && <span style={S.dateDot} />}
            </button>
          );
        })}
      </div>

      <div style={S.card}>
        <div style={S.cardHeader}><span style={S.cardTitle}>Add entry for {selectedDate}</span></div>
        <textarea style={S.textarea} placeholder="Summarize today's work, decisions, blockers, highlights…" value={summaryInput} onChange={(e: any) => setSummaryInput(e.target.value)} />
        <input style={{ ...S.input, marginTop: 10 }} placeholder="Tags (comma-separated: DipperAI, Plato, Fix)" value={tagInput} onChange={(e: any) => setTagInput(e.target.value)} />
        <button style={{ ...S.primaryBtn, width: '100%', marginTop: 12 }} onClick={addLog}>Save Entry</button>
      </div>

      <div style={S.card}>
        <div style={S.cardHeader}><span style={S.cardTitle}>Log for {selectedDate}</span></div>
        {!todaysLog || todaysLog.entries.length === 0
          ? <p style={S.empty}>No entries yet for this day.</p>
          : todaysLog.entries.map((e: DailyLogEntry) => (
              <div key={e.id} style={S.logEntry}>
                <div style={S.logTime}>{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div style={S.logSummary}>{e.summary}</div>
                {e.tags.length > 0 && (
                  <div style={S.tagRow}>{e.tags.map(tag => <span key={tag} style={S.tag}>{tag}</span>)}</div>
                )}
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ─── Trends ───────────────────────────────────────────────────────────────────

type TrendingPlatform = 'x' | 'reddit' | 'youtube';

type TrendingItem = {
  id: string;
  platform: TrendingPlatform;
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
  velocityScore: number;
  spike: boolean;
  publishedAt: string;
  fetchedAt: string;
  keywords: string[];
};

type TrendingData = {
  lastScanned: string | null;
  items: TrendingItem[];
  stats: { x: number; reddit: number; youtube: number; spikes: number };
};

const PLATFORM_COLORS: Record<TrendingPlatform, string> = {
  x:       '#e2e8f0',
  reddit:  '#ff4500',
  youtube: '#ff0000',
};

const PLATFORM_LABELS: Record<TrendingPlatform, string> = {
  x:       'X',
  reddit:  'Reddit',
  youtube: 'YouTube',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TrendingCard({ item }: { item: TrendingItem }) {
  const pc = PLATFORM_COLORS[item.platform];
  const m = item.metrics;
  const metricParts: string[] = [];
  if (m.likes)    metricParts.push(`👍 ${m.likes.toLocaleString()}`);
  if (m.upvotes)  metricParts.push(`👍 ${m.upvotes.toLocaleString()}`);
  if (m.comments) metricParts.push(`💬 ${m.comments.toLocaleString()}`);
  if (m.views)    metricParts.push(`👁 ${m.views.toLocaleString()}`);
  if (m.shares)   metricParts.push(`🔁 ${m.shares.toLocaleString()}`);

  return (
    <div style={{
      ...TS.card,
      borderLeft: item.spike ? '3px solid rgba(249,115,22,0.6)' : '3px solid rgba(255,255,255,0.07)',
    }}>
      <div style={TS.cardTop}>
        <span style={{ ...TS.platformBadge, background: pc + '22', color: pc, borderColor: pc + '44' }}>
          {PLATFORM_LABELS[item.platform]}
        </span>
        {item.spike && <span style={TS.spikeBadge}>🔥 Spike</span>}
      </div>

      <a href={item.url} target="_blank" rel="noopener noreferrer" style={TS.titleLink}>
        {item.title.length > 80 ? item.title.slice(0, 80) + '…' : item.title}
      </a>

      <div style={TS.metaRow}>
        <span style={TS.author}>@{item.author}</span>
        <span style={TS.dot}>·</span>
        <span style={TS.timeAgo}>{timeAgo(item.publishedAt)}</span>
      </div>

      <div style={TS.velRow}>
        <span style={TS.velLabel}>Velocity</span>
        <div style={TS.velTrack}>
          <div style={{
            ...TS.velFill,
            width: `${item.velocityScore}%`,
            background: `linear-gradient(90deg, ${pc}88, ${pc})`,
          }} />
        </div>
        <span style={TS.velNum}>{item.velocityScore}</span>
      </div>

      {metricParts.length > 0 && (
        <div style={TS.metricsRow}>{metricParts.join(' · ')}</div>
      )}

      {item.keywords.length > 0 && (
        <div style={TS.keywordRow}>
          {item.keywords.map(kw => (
            <span key={kw} style={TS.keyword}>{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function SetupNotice({ hasX, hasReddit, hasYouTube }: { hasX: boolean; hasReddit: boolean; hasYouTube: boolean }) {
  if (hasX && hasReddit && hasYouTube) return null;
  return (
    <div style={TS.setupCard}>
      <div style={TS.setupTitle}>🔌 Connect your APIs to start monitoring</div>
      <div style={TS.setupList}>
        <div style={TS.setupItem}>
          <span>{hasX ? '✅' : '❌'}</span>
          <span>X API — add <code style={TS.code}>X_BEARER_TOKEN</code> to .env.local</span>
        </div>
        <div style={TS.setupItem}>
          <span>{hasReddit ? '✅' : '❌'}</span>
          <span>Reddit API — add <code style={TS.code}>REDDIT_CLIENT_ID</code> + <code style={TS.code}>REDDIT_CLIENT_SECRET</code></span>
        </div>
        <div style={TS.setupItem}>
          <span>{hasYouTube ? '✅' : '❌'}</span>
          <span>YouTube API — add <code style={TS.code}>YOUTUBE_API_KEY</code></span>
        </div>
      </div>
    </div>
  );
}

function Trends() {
  const [data, setData]           = useState<TrendingData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [filter, setFilter]       = useState<TrendingPlatform | 'all' | 'spikes'>('all');
  const [apiStatus, setApiStatus] = useState<{ x: boolean; reddit: boolean; youtube: boolean } | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/trending');
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
  };

  const scan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trending/scan', { method: 'POST' });
      if (res.ok) {
        const d: TrendingData = await res.json();
        setData(d);
        setApiStatus({
          x:       d.stats.x > 0,
          reddit:  d.stats.reddit > 0,
          youtube: d.stats.youtube > 0,
        });
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const items = data?.items ?? [];
  const filtered = items.filter(item => {
    if (filter === 'all')    return true;
    if (filter === 'spikes') return item.spike;
    return item.platform === filter;
  });

  const lastScannedStr = data?.lastScanned
    ? timeAgo(data.lastScanned)
    : 'Never';

  return (
    <div style={S.section}>
      <SectionHeader title="📡 Trends" subtitle="Real-time spike monitor" />

      {/* Top bar */}
      <div style={TS.topBar}>
        <button style={{ ...S.primaryBtn, opacity: loading ? 0.7 : 1 }} onClick={scan} disabled={loading}>
          {loading ? '⏳ Scanning…' : '🔍 Scan Now'}
        </button>
        <span style={TS.lastScan}>Last scanned: {lastScannedStr}</span>
      </div>

      {/* Stats */}
      {data && (
        <div style={TS.statsRow}>
          <span style={TS.statItem}>𝕏 <strong>{data.stats.x}</strong></span>
          <span style={TS.statItem}>Reddit <strong>{data.stats.reddit}</strong></span>
          <span style={TS.statItem}>YouTube <strong>{data.stats.youtube}</strong></span>
          {data.stats.spikes > 0 && (
            <span style={{ ...TS.statItem, color: '#f97316' }}>🔥 <strong>{data.stats.spikes}</strong> spike{data.stats.spikes !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {/* API setup notice */}
      {apiStatus && (
        <SetupNotice hasX={apiStatus.x} hasReddit={apiStatus.reddit} hasYouTube={apiStatus.youtube} />
      )}

      {/* Filters */}
      <div style={TS.filterRow}>
        {(['all', 'x', 'reddit', 'youtube', 'spikes'] as const).map(f => (
          <button
            key={f}
            style={{ ...TS.filterBtn, ...(filter === f ? TS.filterBtnActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f === 'all'    ? 'All'       :
             f === 'x'      ? '𝕏'         :
             f === 'reddit' ? 'Reddit'    :
             f === 'youtube'? 'YouTube'   :
             '🔥 Spikes'}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div style={TS.emptyState}>
          {items.length === 0
            ? 'No trending content yet. Hit Scan Now to fetch the latest.'
            : 'No items match this filter.'}
        </div>
      ) : (
        <div style={TS.cardList}>
          {filtered.map(item => <TrendingCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

// ─── Trends styles ────────────────────────────────────────────────────────────

const TS: Record<string, React.CSSProperties> = {
  topBar:     { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  lastScan:   { fontSize: 12, color: '#64748b' },
  statsRow:   { display: 'flex', gap: 16, flexWrap: 'wrap', padding: '12px 16px', background: 'rgba(255,255,255,0.025)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' },
  statItem:   { fontSize: 13, color: '#94a3b8' },
  filterRow:  { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterBtn:  { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  filterBtnActive: { background: 'rgba(16,217,160,0.12)', borderColor: 'rgba(16,217,160,0.4)', color: '#e2e8f0' },
  cardList:   { display: 'flex', flexDirection: 'column', gap: 10 },
  card:       { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTop:    { display: 'flex', alignItems: 'center', gap: 8 },
  platformBadge: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, border: '1px solid' },
  spikeBadge: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' },
  titleLink:  { fontSize: 14, fontWeight: 600, color: '#e2e8f0', textDecoration: 'none', lineHeight: 1.4 },
  metaRow:    { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' },
  author:     { color: '#94a3b8' },
  dot:        { color: '#334155' },
  timeAgo:    { color: '#64748b' },
  velRow:     { display: 'flex', alignItems: 'center', gap: 8 },
  velLabel:   { fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: 56, flexShrink: 0 } as React.CSSProperties,
  velTrack:   { flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' },
  velFill:    { height: '100%', borderRadius: 4, transition: 'width 0.5s ease' },
  velNum:     { fontSize: 12, color: '#94a3b8', width: 28, textAlign: 'right', flexShrink: 0 } as React.CSSProperties,
  metricsRow: { fontSize: 12, color: '#64748b' },
  keywordRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  keyword:    { fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(79,157,235,0.12)', color: '#7dd3fc', border: '1px solid rgba(79,157,235,0.2)' },
  emptyState: { color: '#475569', fontSize: 14, textAlign: 'center', padding: '32px 0' } as React.CSSProperties,
  setupCard:  { background: 'rgba(255,200,0,0.04)', border: '1px solid rgba(255,200,0,0.15)', borderRadius: 14, padding: 16 },
  setupTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#e2e8f0' },
  setupList:  { display: 'flex', flexDirection: 'column', gap: 10 },
  setupItem:  { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 },
  code:       { background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, fontSize: 12, color: '#7dd3fc', fontFamily: 'monospace' },
};

// ─── R&D Team ─────────────────────────────────────────────────────────────────

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

const TASK_TYPE_LABELS: Record<string, string> = {
  feature_spec:    'Feature Spec',
  market_analysis: 'Market Analysis',
  growth_strategy: 'Growth Strategy',
  technical_review:'Tech Review',
  content_brief:   'Content Brief',
  revenue_analysis:'Revenue Analysis',
};

const TASK_TYPE_COLORS: Record<string, string> = {
  feature_spec:    '#7c3aed',
  market_analysis: '#0ea5e9',
  growth_strategy: '#10d9a0',
  technical_review:'#f97316',
  content_brief:   '#a855f7',
  revenue_analysis:'#f59e0b',
};

const RD_PROJECTS = ['All Projects', 'DipperAI', 'Plato', 'Splash Signal', 'Reflect Medical', 'Portfolio'];

const ROUND_LABELS: Record<number, string> = {
  1: 'Round 1 · Analysis',
  2: 'Round 2 · Debate',
  3: 'Final Memo',
};

function AgentMessage({ msg }: { msg: RDMessage }) {
  const color = RD_AGENT_COLORS[msg.role];
  const icon = AGENT_ICONS[msg.role];
  const name = AGENT_NAMES[msg.role];
  const roundLabel = ROUND_LABELS[msg.round] ?? `Round ${msg.round}`;

  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      padding: '12px 14px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '0 10px 10px 0',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 13, color }}>{name}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
          background: `${color}22`, color, border: `1px solid ${color}44`,
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{roundLabel}</span>
      </div>
      <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
        {msg.content}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: RDSession }) {
  const [expanded, setExpanded] = useState(false);
  const [showDebate, setShowDebate] = useState(false);

  const statusColor: Record<string, string> = {
    complete: '#10d9a0',
    running:  '#f59e0b',
    error:    '#ef4444',
  };
  const statusLabel: Record<string, string> = {
    complete: 'Complete',
    running:  'Running',
    error:    'Error',
  };

  const debateMessages = session.messages.filter(m => m.round < 3);
  const memoMsg = session.messages.find(m => m.round === 3 && m.role === 'editor');

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <button
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: 16, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{session.topic}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {session.project && session.project !== 'All Projects' && (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(79,157,235,0.15)', color: '#7dd3fc',
                border: '1px solid rgba(79,157,235,0.25)',
              }}>{session.project}</span>
            )}
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: `${statusColor[session.status]}22`,
              color: statusColor[session.status],
              border: `1px solid ${statusColor[session.status]}44`,
            }}>{statusLabel[session.status]}</span>
            <span style={{ fontSize: 11, color: '#475569' }}>
              {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <span style={{ color: '#475569', fontSize: 16, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Final memo */}
          {(session.memo || memoMsg) && (
            <div style={{
              background: 'rgba(79,157,235,0.06)',
              border: '1px solid rgba(79,157,235,0.2)',
              borderRadius: 12, padding: 16, marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span>📝</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#4f9deb' }}>Editor&apos;s Memo</span>
              </div>
              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {session.memo ?? memoMsg?.content}
              </div>
            </div>
          )}

          {/* Show debate toggle */}
          {debateMessages.length > 0 && (
            <>
              <button
                style={{
                  background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8', borderRadius: 8, padding: '6px 14px',
                  fontSize: 12, cursor: 'pointer', marginBottom: 12, fontWeight: 600,
                }}
                onClick={() => setShowDebate(d => !d)}
              >
                {showDebate ? 'Hide debate ▲' : `Show full debate (${debateMessages.length} messages) ▼`}
              </button>

              {showDebate && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {debateMessages.map((msg, i) => (
                    <AgentMessage key={i} msg={msg} />
                  ))}
                </div>
              )}
            </>
          )}

          {session.status === 'error' && (
            <div style={{ color: '#ef4444', fontSize: 13, padding: '8px 0' }}>
              ⚠️ Session encountered an error. Partial results may be available above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AutonomousTaskCard({ task }: { task: AutonomousTask }) {
  const [expanded, setExpanded] = useState(false);
  const color = TASK_TYPE_COLORS[task.taskType] ?? '#94a3b8';
  const label = TASK_TYPE_LABELS[task.taskType] ?? task.taskType;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      <button
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: 16, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{task.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
              background: `${color}22`, color, border: `1px solid ${color}44`,
            }}>{label}</span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: 'rgba(79,157,235,0.12)', color: '#7dd3fc',
              border: '1px solid rgba(79,157,235,0.25)',
            }}>{task.project}</span>
            <span style={{ fontSize: 11, color: '#475569' }}>
              {new Date(task.executedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {!expanded && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
              {task.rationale.slice(0, 100)}{task.rationale.length > 100 ? '…' : ''}
            </div>
          )}
        </div>
        <span style={{ color: '#475569', fontSize: 16, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: 12, marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Why I chose this</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{task.rationale}</div>
          </div>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {task.output}
          </div>
        </div>
      )}
    </div>
  );
}

function RDTeam() {
  const [tab, setTab] = useState<'sessions' | 'autonomous'>('sessions');
  const [sessions, setSessions] = useState<RDSession[]>([]);
  const [autonomousTasks, setAutonomousTasks] = useState<AutonomousTask[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [project, setProject] = useState('All Projects');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Load sessions
  const loadSessions = async () => {
    try {
      const res = await fetch('/api/rd');
      if (res.ok) {
        const data = await res.json() as { sessions: RDSession[] };
        setSessions(data.sessions ?? []);
      }
    } catch { /* silent */ }
  };

  // Load autonomous log
  const loadAutonomous = async () => {
    try {
      const res = await fetch('/api/autonomous/log');
      if (res.ok) {
        const data = await res.json() as { tasks: AutonomousTask[] };
        setAutonomousTasks(data.tasks ?? []);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    loadSessions();
    loadAutonomous();
  }, []);

  const startSession = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setFetchError('');

    // Simulate phase labels
    const phases = [
      '🧬 Round 1: Analysis...',
      '⚔️ Round 2: Debate...',
      '📝 Finalizing memo...',
    ];
    let phaseIndex = 0;
    setLoadingPhase(phases[0]);
    const phaseInterval = setInterval(() => {
      phaseIndex = Math.min(phaseIndex + 1, phases.length - 1);
      setLoadingPhase(phases[phaseIndex]);
    }, 8000);

    try {
      const res = await fetch('/api/rd/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), project: project === 'All Projects' ? undefined : project }),
      });

      clearInterval(phaseInterval);

      if (!res.ok) {
        setFetchError('Session failed. Check ANTHROPIC_API_KEY.');
      } else {
        const session = await res.json() as RDSession;
        setSessions(prev => [session, ...prev.filter(s => s.id !== session.id)]);
        setShowModal(false);
        setTopic('');
        setProject('All Projects');
      }
    } catch (err) {
      clearInterval(phaseInterval);
      setFetchError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setLoadingPhase('');
    }
  };

  const lastSessionTime = sessions[0]
    ? new Date(sessions[0].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={S.section}>
      <SectionHeader title="🧬 R&D Team" subtitle="AI research team debates your business and produces strategic memos" />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
        {(['sessions', 'autonomous'] as const).map(t => (
          <button
            key={t}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: tab === t ? 'rgba(16,217,160,0.15)' : 'transparent',
              color: tab === t ? '#10d9a0' : '#64748b',
              transition: 'all 0.15s',
            }}
            onClick={() => setTab(t)}
          >
            {t === 'sessions' ? '🧪 Research Sessions' : '🤖 Autonomous Log'}
          </button>
        ))}
      </div>

      {/* ── Research Sessions tab ── */}
      {tab === 'sessions' && (
        <>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button style={S.primaryBtn} onClick={() => setShowModal(true)}>
              + New Research Session
            </button>
            <div style={{ fontSize: 12, color: '#475569' }}>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              {lastSessionTime && ` · Last: ${lastSessionTime}`}
            </div>
          </div>

          {/* Sessions list */}
          {sessions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 0', color: '#334155', fontSize: 14,
            }}>
              No research sessions yet. Start one to get your team working!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map(s => <SessionCard key={s.id} session={s} />)}
            </div>
          )}
        </>
      )}

      {/* ── Autonomous Log tab ── */}
      {tab === 'autonomous' && (
        <>
          <div style={{ fontSize: 12, color: '#475569' }}>
            {autonomousTasks.length} task{autonomousTasks.length !== 1 ? 's' : ''} · Runs nightly at 2am EDT
          </div>
          {autonomousTasks.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px', color: '#334155', fontSize: 14,
              background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)',
            }}>
              🤖 No autonomous tasks yet.<br />
              <span style={{ fontSize: 12, color: '#1e293b', marginTop: 4, display: 'block' }}>
                First run at 2am tonight.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {autonomousTasks.map(t => <AutonomousTaskCard key={t.id} task={t} />)}
            </div>
          )}
        </>
      )}

      {/* ── New Session Modal ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#0d1126', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: 24, width: '100%', maxWidth: 480,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0' }}>🧬 New Research Session</span>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
                onClick={() => { setShowModal(false); setFetchError(''); }}
              >✕</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🧬</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>{loadingPhase}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>This takes 30-60 seconds. Hang tight…</div>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Research Topic *
                  </label>
                  <input
                    style={{ ...S.input, width: '100%' }}
                    placeholder="What should the team research?"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startSession()}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Project Focus
                  </label>
                  <select
                    style={{ ...S.select, width: '100%' }}
                    value={project}
                    onChange={e => setProject(e.target.value)}
                  >
                    {RD_PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {fetchError && (
                  <div style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                    {fetchError}
                  </div>
                )}

                <button
                  style={{ ...S.primaryBtn, width: '100%', opacity: !topic.trim() ? 0.5 : 1 }}
                  onClick={startSession}
                  disabled={!topic.trim()}
                >
                  🚀 Start Research
                </button>

                <div style={{ fontSize: 11, color: '#334155', textAlign: 'center' }}>
                  5 agents · 3 rounds · ~45 seconds
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={S.sectionHeader}>
      <h2 style={S.sectionTitle}>{title}</h2>
      <p style={S.sectionSub}>{subtitle}</p>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  root:        { minHeight: '100dvh', background: '#060918', color: '#eef2ff', display: 'flex', position: 'relative', overflowX: 'hidden' },
  backdrop:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(2px)' },
  sidebar:     { position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, background: 'rgba(8,13,32,0.98)', borderRight: '1px solid rgba(255,255,255,0.07)', zIndex: 50, display: 'flex', flexDirection: 'column', transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)', backdropFilter: 'blur(20px)' },
  sidebarHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  sidebarBrand:  { display: 'flex', alignItems: 'center', gap: 12 },
  brandIcon:     { fontSize: 28 },
  brandTitle:    { fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' },
  brandSub:      { fontSize: 11, color: '#64748b', marginTop: 1 },
  closeBtn:      { background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  nav:           { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 },
  navItem:       { width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  navActive:     { background: 'rgba(16,217,160,0.1)', color: '#f8fbff', border: '1px solid rgba(16,217,160,0.2)' },
  navIcon:       { fontSize: 20, width: 24, textAlign: 'center' },
  navText:       { flex: 1, display: 'flex', flexDirection: 'column', gap: 1 },
  navLabel:      { fontSize: 14, fontWeight: 600 },
  navDesc:       { fontSize: 11, color: '#475569', lineHeight: 1.3 },
  navDot:        { width: 6, height: 6, borderRadius: '50%', background: '#10d9a0' },
  sidebarFooter: { padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 },
  statPill:      { fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 },

  main:    { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar:  { position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(6,9,24,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' },
  menuBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,rgba(16,217,160,0.18),rgba(79,157,235,0.18))', border: '1px solid rgba(16,217,160,0.25)', padding: '0', width: 44, height: 44, borderRadius: 13, cursor: 'pointer', flexShrink: 0, fontSize: 22 } as any,
  topbarTitle:  { flex: 1, fontWeight: 700, fontSize: 16 },
  topbarMeta:   { display: 'flex', gap: 8 },
  badge:        { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 },

  content: { flex: 1, overflow: 'auto' },
  section: { padding: '20px 16px 40px', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 },

  sectionHeader: { marginBottom: 4 },
  sectionTitle:  { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' },
  sectionSub:    { color: '#64748b', fontSize: 13, marginTop: 4, lineHeight: 1.5 },

  metricGrid:  { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
  metricCard:  { background: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 },
  metricIcon:  { fontSize: 22 },
  metricValue: { fontSize: 32, fontWeight: 800, lineHeight: 1 },
  metricLabel: { fontSize: 12, color: '#64748b', fontWeight: 500 },

  card:       { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 18 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle:  { fontSize: 14, fontWeight: 700, color: '#e2e8f0' },
  linkBtn:    { background: 'none', border: 'none', color: '#4f9deb', fontSize: 13, cursor: 'pointer', fontWeight: 600 },

  taskRow:     { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' },
  taskTitle:   { fontSize: 13, fontWeight: 600, marginBottom: 6 },
  progressBar: { height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden', marginTop: 2 },
  progressFill:{ height: '100%', borderRadius: 4, transition: 'width 0.8s ease' },
  pct:         { fontSize: 12, color: '#94a3b8', flexShrink: 0 },
  agentDot:    { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },

  agentMiniGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
  agentMini:     { display: 'flex', alignItems: 'center', gap: 10 },
  agentAvatar:   { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  agentMiniName: { fontSize: 13, fontWeight: 600, marginBottom: 3 },
  statusPill:    { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999 },
  pillLive:      { background: 'rgba(16,217,160,0.15)', color: '#10d9a0' },
  pillIdle:      { background: 'rgba(148,163,184,0.12)', color: '#64748b' },

  addTaskRow:  { display: 'flex', gap: 10, flexWrap: 'wrap' },
  input:       { flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '11px 14px', color: '#eef2ff', outline: 'none' },
  select:      { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '11px 12px', color: '#eef2ff', cursor: 'pointer' },
  primaryBtn:  { background: 'linear-gradient(120deg,#10d9a0,#4f9deb)', border: 'none', borderRadius: 12, padding: '11px 20px', fontWeight: 700, color: '#03071e', cursor: 'pointer', fontSize: 14 },

  kanbanSection:   { display: 'flex', flexDirection: 'column', gap: 10 },
  kanbanColHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 8px' },
  colDot:          { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  colLabel:        { fontWeight: 700, fontSize: 14 },
  colCount:        { marginLeft: 'auto', fontSize: 12, background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 999 },
  emptyCol:        { color: '#334155', fontSize: 13, padding: '10px 0' },
  kanbanCard:      { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 },
  kanbanCardTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  kanbanTitle:     { fontWeight: 600, fontSize: 14, flex: 1 },
  kanbanDesc:      { color: '#64748b', fontSize: 12 },
  kanbanCardBot:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  agentChip:       { fontSize: 11, fontWeight: 600, border: '1px solid', padding: '2px 8px', borderRadius: 999, flexShrink: 0 },
  selectSm:        { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#eef2ff', borderRadius: 8, padding: '4px 8px', fontSize: 12 },

  agentCard:      { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 },
  agentCardTop:   { display: 'flex', alignItems: 'center', gap: 14 },
  agentName:      { fontWeight: 700, fontSize: 15 },
  agentDesc:      { color: '#64748b', fontSize: 12, marginTop: 2 },
  agentSection:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  agentSectionLabel: { fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  agentSectionVal:   { fontSize: 13, color: '#cbd5e1', maxWidth: '65%', textAlign: 'right' },
  capList:        { display: 'flex', flexWrap: 'wrap', gap: 6 },
  cap:            { fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '3px 9px', borderRadius: 999, color: '#94a3b8' },

  dateStrip:    { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 },
  dateBtn:      { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px', color: '#94a3b8', cursor: 'pointer', minWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative' },
  dateBtnActive:{ background: 'rgba(16,217,160,0.12)', borderColor: '#10d9a0', color: '#eef2ff' },
  dayLabel:     { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  dayNum:       { fontSize: 18, fontWeight: 800 },
  dateDot:      { width: 5, height: 5, borderRadius: '50%', background: '#10d9a0', position: 'absolute', top: 6, right: 6 },

  textarea:   { width: '100%', minHeight: 120, resize: 'vertical', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, color: '#eef2ff', lineHeight: 1.6, outline: 'none' },

  logEntry:   { paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.05)' },
  logTime:    { fontSize: 11, color: '#475569', marginBottom: 4 },
  logSummary: { fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' },
  tagRow:     { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag:        { fontSize: 11, padding: '3px 9px', borderRadius: 999, background: 'rgba(79,157,235,0.15)', color: '#7dd3fc' },

  empty:      { color: '#334155', fontSize: 13, padding: '8px 0' },
};
