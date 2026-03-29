'use client';

import { useEffect, useMemo, useState } from 'react';
import { Agent, AGENTS, AgentType, Task, TaskStatus } from '../lib/agents';

type DailyLogEntry = {
  id: string;
  timestamp: string;
  summary: string;
  tags: string[];
};

type DailyLogDay = {
  date: string; // YYYY-MM-DD
  entries: DailyLogEntry[];
};

const DAILY_LOG_KEY = 'missionControl.dailyLogs.v1';

const todayISO = () => new Date().toISOString().slice(0, 10);

const initialTasks: Task[] = [
  {
    id: 'task-dipper-ai',
    title: 'Phase 6 — Agent Teams',
    description: 'Ship multi-agent coordination for DipperAI',
    assignedAgent: 'coding',
    status: 'running',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    progress: 62,
    checkpoints: [],
  },
  {
    id: 'task-mission-control',
    title: 'Mission Control board redesign',
    description: 'Combine kanban + agent monitoring with mobile-first UI',
    assignedAgent: 'operations',
    status: 'escalated',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
    progress: 45,
    checkpoints: [],
  },
  {
    id: 'task-daily-memory',
    title: 'Daily Memory System',
    description: 'Log summaries for every working session',
    assignedAgent: 'growth',
    status: 'queued',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    progress: 0,
    checkpoints: [],
  },
  {
    id: 'task-plato',
    title: 'Plato voice log prototype',
    description: 'Voice intake flow spike',
    assignedAgent: 'research',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 22),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
    progress: 100,
    result: 'User interviews recorded + action items documented',
    checkpoints: [],
  },
];

const COLUMN_DEFS: { id: string; title: string; status: TaskStatus[]; accent: string; description: string }[] = [
  { id: 'backlog', title: 'Backlog', status: ['queued'], accent: '#4f9deb', description: "Ideas, waiting for pickup" },
  { id: 'inflight', title: 'In Flight', status: ['running'], accent: '#10d9a0', description: 'Actively being worked' },
  { id: 'review', title: 'Needs Input', status: ['escalated', 'failed'], accent: '#f59e0b', description: 'Blocked or reviewing' },
  { id: 'complete', title: 'Complete', status: ['completed'], accent: '#a855f7', description: 'Shipped recently' },
];

const agentAccent: Record<AgentType, string> = {
  coding: '#7c3aed',
  research: '#0ea5e9',
  operations: '#10d9a0',
  growth: '#f97316',
};

export default function MissionControl() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [agents, setAgents] = useState<Agent[]>(
    Object.entries(AGENTS).map(([key, agentConfig]) => ({
      ...agentConfig,
      id: key,
      status: key === 'coding' ? 'working' : 'idle',
      currentTask: key === 'coding' ? 'task-dipper-ai' : undefined,
      memory: [],
    }))
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [dailyLogs, setDailyLogs] = useState<DailyLogDay[]>([
    {
      date: todayISO(),
      entries: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          summary: 'Kickoff: Phase 5 knowledge base delivered, Phase 6 multi-agent orchestration underway, Mission Control board redesign + daily memory system planned.',
          tags: ['DipperAI', 'Mission Control'],
        },
      ],
    },
  ]);
  const [summaryInput, setSummaryInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', agent: 'coding' as AgentType });

  // Load logs from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(DAILY_LOG_KEY);
    if (stored) {
      try {
        const parsed: DailyLogDay[] = JSON.parse(stored);
        setDailyLogs(parsed);
        if (!parsed.find(day => day.date === selectedDate)) {
          setSelectedDate(todayISO());
        }
      } catch (err) {
        console.error('Failed to parse daily logs', err);
      }
    }
  }, []);

  // Persist logs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  // Auto advance fake progress for running tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev =>
        prev.map(task => {
          if (task.status === 'running' && task.progress < 100) {
            const delta = Math.random() * 8;
            const next = Math.min(task.progress + delta, 100);
            if (next >= 100) {
              return { ...task, progress: 100, status: 'completed', completedAt: new Date() };
            }
            return { ...task, progress: next };
          }
          return task;
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Sync agent status to tasks
  useEffect(() => {
    setAgents(prev =>
      prev.map(agent => {
        const liveTask = tasks.find(t => t.assignedAgent === agent.type && t.status === 'running');
        return {
          ...agent,
          status: liveTask ? 'working' : 'idle',
          currentTask: liveTask?.id,
        };
      })
    );
  }, [tasks]);

  const boardColumns = useMemo(() => {
    return COLUMN_DEFS.map(column => ({
      ...column,
      cards: tasks.filter(task => column.status.includes(task.status)),
    }));
  }, [tasks]);

  const todaysLog = dailyLogs.find(day => day.date === selectedDate);

  const recentDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - idx);
      return date.toISOString().slice(0, 10);
    });
  }, []);

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title.trim(),
      description: newTask.description.trim() || 'Quick capture',
      assignedAgent: newTask.agent,
      status: 'queued',
      createdAt: new Date(),
      progress: 0,
      checkpoints: [],
    };
    setTasks(prev => [task, ...prev]);
    setNewTask({ title: '', description: '', agent: newTask.agent });
  };

  const updateTaskStatus = (taskId: string, nextStatus: TaskStatus) => {
    setTasks(prev => prev.map(task => (task.id === taskId ? { ...task, status: nextStatus } : task)));
  };

  const handleAddLogEntry = () => {
    if (!summaryInput.trim()) return;
    const entry: DailyLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      summary: summaryInput.trim(),
      tags: tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    };
    setDailyLogs(prev => {
      const existing = prev.find(day => day.date === selectedDate);
      if (existing) {
        return prev.map(day => (day.date === selectedDate ? { ...day, entries: [entry, ...day.entries] } : day));
      }
      return [{ date: selectedDate, entries: [entry] }, ...prev];
    });
    setSummaryInput('');
    setTagInput('');
  };

  const totalEntries = dailyLogs.reduce((sum, day) => sum + day.entries.length, 0);

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Mission Control</p>
          <h1>Unified Command Board</h1>
          <p className="subtitle">
            Kanban + live agent monitoring + daily memory. Fully responsive, always-on command center.
          </p>
        </div>
        <div className="hero-metrics">
          <div>
            <p>Active Agents</p>
            <strong>{agents.filter(a => a.status === 'working').length}</strong>
          </div>
          <div>
            <p>In-Flight Tasks</p>
            <strong>{tasks.filter(t => t.status === 'running').length}</strong>
          </div>
          <div>
            <p>Daily Entries</p>
            <strong>{totalEntries}</strong>
          </div>
        </div>
      </header>

      <section className="board">
        <div className="kanban">
          <div className="kanban-header">
            <div>
              <h2>Operational Kanban</h2>
              <p>Drag-free workflow — update status inline, optimized for touch.</p>
            </div>
            <div className="new-task">
              <input
                placeholder="New task title"
                value={newTask.title}
                onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              />
              <select value={newTask.agent} onChange={e => setNewTask(prev => ({ ...prev, agent: e.target.value as AgentType }))}>
                {Object.values(AGENTS).map(agent => (
                  <option key={agent.type} value={agent.type}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <button onClick={handleAddTask}>Add</button>
            </div>
          </div>
          <div className="kanban-columns">
            {boardColumns.map(column => (
              <div key={column.id} className="kanban-column">
                <div className="column-heading">
                  <div>
                    <span className="dot" style={{ background: column.accent }} />
                    <h3>{column.title}</h3>
                  </div>
                  <p>{column.description}</p>
                </div>
                <div className="column-body">
                  {column.cards.length === 0 && <p className="empty">No items</p>}
                  {column.cards.map(card => (
                    <article key={card.id} className="card">
                      <div className="card-header">
                        <h4>{card.title}</h4>
                        <span className="agent-pill" style={{ color: agentAccent[card.assignedAgent], borderColor: agentAccent[card.assignedAgent] }}>
                          {AGENTS[card.assignedAgent].name}
                        </span>
                      </div>
                      <p className="card-description">{card.description}</p>
                      <div className="card-meta">
                        <span>
                          Status
                          <select value={card.status} onChange={e => updateTaskStatus(card.id, e.target.value as TaskStatus)}>
                            <option value="queued">Backlog</option>
                            <option value="running">In Flight</option>
                            <option value="escalated">Needs Input</option>
                            <option value="failed">Blocked</option>
                            <option value="completed">Complete</option>
                          </select>
                        </span>
                        <span>{card.progress ? `${Math.round(card.progress)}%` : '0%'}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="agents-panel">
          <div className="panel-card">
            <h3>Live Agent Monitor</h3>
            <p className="panel-subtitle">Touch-friendly grid showing status + assignments.</p>
            <div className="agent-grid">
              {agents.map(agent => (
                <div key={agent.id} className="agent-card">
                  <div className="agent-header">
                    <div className="agent-avatar" style={{ background: agentAccent[agent.type] }}>
                      {agent.name.substring(0, 1)}
                    </div>
                    <div>
                      <p>{agent.name}</p>
                      <span>{agent.description}</span>
                    </div>
                    <span className={`status ${agent.status}`}>
                      {agent.status === 'working' ? 'LIVE' : 'IDLE'}
                    </span>
                  </div>
                  <div className="agent-body">
                    <p>Current</p>
                    <strong>{agent.currentTask ? tasks.find(t => t.id === agent.currentTask)?.title : '—'}</strong>
                  </div>
                  <div className="agent-capabilities">
                    {agent.capabilities.slice(0, 3).map(cap => (
                      <span key={cap}>{cap}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <h3>Focus Checklist</h3>
            <ul className="checklist">
              <li>
                <input type="checkbox" defaultChecked />
                <span>Redeploy DipperAI (commit 8b40e83)</span>
              </li>
              <li>
                <input type="checkbox" />
                <span>Mission Control daily logs populated</span>
              </li>
              <li>
                <input type="checkbox" />
                <span>Prep Splash Signal next sprint</span>
              </li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="memory">
        <header>
          <div>
            <p className="eyebrow">Daily Memory System</p>
            <h2>Session Logs & Summaries</h2>
            <p className="subtitle">Every conversation gets captured here — searchable, chronological, and synced to localStorage.</p>
          </div>
          <div className="date-strip">
            {recentDays.map(date => (
              <button key={date} className={date === selectedDate ? 'active' : ''} onClick={() => setSelectedDate(date)}>
                <span>{new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <strong>{new Date(date).getDate()}</strong>
              </button>
            ))}
          </div>
        </header>

        <div className="memory-grid">
          <div className="memory-form">
            <textarea
              placeholder="Summarize today’s discussions, decisions, blockers..."
              value={summaryInput}
              onChange={e => setSummaryInput(e.target.value)}
            />
            <input
              placeholder="Tags (comma separated — e.g. DipperAI, Mission Control)"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
            />
            <button onClick={handleAddLogEntry}>Save summary</button>
            <p className="help">I’ll reference these logs whenever you ask about a past day or project.</p>
          </div>

          <div className="memory-list">
            {!todaysLog && <p className="empty">No entries for this day yet.</p>}
            {todaysLog &&
              todaysLog.entries.map(entry => (
                <article key={entry.id} className="memory-entry">
                  <p className="time">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="summary">{entry.summary}</p>
                  {entry.tags.length > 0 && (
                    <div className="tags">
                      {entry.tags.map(tag => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: radial-gradient(circle at top, rgba(16, 217, 160, 0.08), transparent 50%), #050817;
          color: #f8fbff;
          padding-bottom: 80px;
        }
        .hero {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 16px;
          padding: 32px 5vw 16px;
        }
        .hero h1 {
          font-size: clamp(32px, 5vw, 48px);
          margin: 4px 0 12px;
        }
        .hero-metrics {
          display: flex;
          gap: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 24px;
          border-radius: 18px;
          backdrop-filter: blur(10px);
        }
        .hero-metrics div p {
          margin: 0;
          color: #a0aec0;
          font-size: 13px;
        }
        .hero-metrics div strong {
          display: block;
          font-size: 24px;
          margin-top: 4px;
        }
        .eyebrow {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #5eead4;
        }
        .subtitle {
          color: #94a3b8;
          max-width: 560px;
        }
        .board {
          display: grid;
          grid-template-columns: 2fr 0.9fr;
          gap: 24px;
          padding: 0 5vw 32px;
        }
        .kanban {
          background: rgba(15, 22, 41, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
        }
        .kanban-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }
        .new-task {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .new-task input,
        .new-task select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px 14px;
          color: inherit;
        }
        .new-task button {
          background: linear-gradient(120deg, #10d9a0, #4f9deb);
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-weight: 600;
          cursor: pointer;
        }
        .kanban-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .kanban-column {
          background: rgba(7, 12, 26, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .column-heading {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .column-heading h3 {
          margin: 0;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-flex;
          margin-right: 8px;
        }
        .column-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .card {
          background: rgba(17, 24, 45, 0.8);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 14px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .agent-pill {
          border: 1px solid;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }
        .card-description {
          color: #94a3b8;
          margin: 8px 0 12px;
        }
        .card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .card-meta select {
          margin-top: 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: inherit;
          border-radius: 8px;
          padding: 4px 8px;
        }
        .agents-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .panel-card {
          background: rgba(12, 16, 33, 0.95);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 20px;
        }
        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .agent-card {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .agent-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .agent-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .agent-header p {
          margin: 0;
          font-weight: 600;
        }
        .agent-header span {
          font-size: 12px;
          color: #a0aec0;
        }
        .status {
          margin-left: auto;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
        }
        .status.working {
          background: rgba(16, 217, 160, 0.15);
          color: #10d9a0;
        }
        .status.idle {
          background: rgba(148, 163, 184, 0.2);
          color: #cbd5f5;
        }
        .agent-body strong {
          display: block;
          margin-top: 4px;
        }
        .agent-capabilities {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .agent-capabilities span {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
        }
        .checklist {
          list-style: none;
          padding: 0;
          margin: 12px 0 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .checklist li {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .memory {
          padding: 32px 5vw;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .memory header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 18px;
        }
        .date-strip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .date-strip button {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 8px 12px;
          color: inherit;
          min-width: 70px;
        }
        .date-strip button.active {
          background: rgba(16, 217, 160, 0.2);
          border-color: #10d9a0;
        }
        .memory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }
        .memory-form,
        .memory-list {
          background: rgba(9, 14, 28, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 22px;
          padding: 20px;
        }
        .memory-form textarea {
          min-height: 140px;
          width: 100%;
          resize: vertical;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px;
          color: inherit;
          margin-bottom: 12px;
        }
        .memory-form input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px;
          color: inherit;
        }
        .memory-form button {
          margin-top: 12px;
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(120deg, #10d9a0, #4f9deb);
          color: #020617;
          font-weight: 700;
        }
        .memory-list .memory-entry {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 12px 0;
        }
        .memory-list .memory-entry:last-child {
          border-bottom: none;
        }
        .memory-entry .time {
          font-size: 12px;
          color: #94a3b8;
          margin: 0 0 4px;
        }
        .memory-entry .summary {
          margin: 0 0 8px;
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tags span {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(79, 157, 235, 0.15);
        }
        .empty {
          color: #475569;
          font-size: 14px;
        }
        .help {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 8px;
        }

        @media (max-width: 1024px) {
          .board {
            grid-template-columns: 1fr;
          }
          .agents-panel {
            flex-direction: row;
            flex-wrap: wrap;
          }
          .panel-card {
            flex: 1 1 280px;
          }
        }

        @media (max-width: 640px) {
          .hero {
            padding: 24px 16px;
          }
          .board,
          .memory {
            padding: 0 16px 24px;
          }
          .kanban-columns {
            grid-template-columns: 1fr;
          }
          .hero-metrics {
            width: 100%;
            justify-content: space-between;
          }
          .kanban,
          .panel-card,
          .memory-form,
          .memory-list {
            border-radius: 18px;
          }
        }
      `}</style>
    </div>
  );
}
