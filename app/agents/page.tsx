'use client';

import { useEffect, useState } from 'react';
import { getItem, setItem } from '@/lib/storage';

interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  schedule: string;
  status: 'ACTIVE' | 'PAUSED';
  lastRun: string;
  lastOutput: string;
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'crypto-scout',
    name: 'Crypto Scout',
    icon: '🔍',
    description: 'Monitors token signals, new launches, and trending pairs on Solana',
    schedule: 'Every 2 hours',
    status: 'PAUSED',
    lastRun: '2h ago',
    lastOutput: 'Found 3 trending tokens: $BONK (+42%), $WIF (+18%), $MYRO (+11%). No rug signals detected.',
  },
  {
    id: 'project-health',
    name: 'Project Health',
    icon: '📊',
    description: 'Checks deployment status of all live projects and reports issues',
    schedule: 'Every 6 hours',
    status: 'PAUSED',
    lastRun: '6h ago',
    lastOutput: 'All systems nominal. eatplato.app: 200ms avg. splash-signal: 340ms avg. No errors in last 6h.',
  },
  {
    id: 'inbox-triage',
    name: 'Inbox Triage',
    icon: '📧',
    description: 'Summarizes important emails and flags action items',
    schedule: '3x daily (8am, 1pm, 6pm)',
    status: 'PAUSED',
    lastRun: '1h ago',
    lastOutput: 'Found 2 important emails: [1] Investor reply from JK Capital — needs response. [2] Plato user feedback — positive, feature request for meal sharing.',
  },
  {
    id: 'goal-tracker',
    name: 'Goal Tracker',
    icon: '🎯',
    description: 'Reviews goal progress and sends daily digest with priorities',
    schedule: 'Daily at 9am',
    status: 'PAUSED',
    lastRun: 'Today 9:00am',
    lastOutput: 'Daily review: DipperAI (35%) — needs push. Splash Signal (60%) — on track. Portfolio (80%) — almost done. Top priority: complete DipperAI auth today.',
  },
  {
    id: 'market-brief',
    name: 'Market Brief',
    icon: '💰',
    description: 'Generates daily crypto & stock market summary with key moves',
    schedule: 'Daily at 8am',
    status: 'PAUSED',
    lastRun: 'Today 8:00am',
    lastOutput: 'SOL: $142.30 (+4.2%). BTC: $68,450 (-0.3%). ETH: $3,210 (+1.1%). Top mover: $JUP +22% on governance vote. Fear & Greed: 72 (Greed).',
  },
];

const MOCK_ACTIVITY = [
  { time: 'Today 09:01', agent: 'Goal Tracker', event: 'Ran daily review — 5 goals analyzed', color: '#10d9a0' },
  { time: 'Today 08:01', agent: 'Market Brief', event: 'Generated morning market summary', color: '#4f9deb' },
  { time: 'Yesterday 18:00', agent: 'Inbox Triage', event: 'Found 1 urgent email flagged', color: '#f97316' },
  { time: 'Yesterday 13:00', agent: 'Inbox Triage', event: 'No actionable emails', color: '#64748b' },
  { time: 'Yesterday 12:00', agent: 'Crypto Scout', event: 'Detected 2 new token launches', color: '#10d9a0' },
  { time: 'Yesterday 09:01', agent: 'Goal Tracker', event: 'Ran daily review', color: '#10d9a0' },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = getItem<Agent[]>('mc:agents', DEFAULT_AGENTS);
    setAgents(saved);
  }, []);

  const save = (updated: Agent[]) => {
    setAgents(updated);
    setItem('mc:agents', updated);
  };

  const toggleStatus = (id: string) => {
    save(agents.map(a =>
      a.id === id ? { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : a
    ));
  };

  const runNow = async (id: string) => {
    setRunningId(id);
    await new Promise(r => setTimeout(r, 2000));
    save(agents.map(a => a.id === id ? { ...a, lastRun: 'Just now' } : a));
    setRunningId(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>🤖 Agents</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Autonomous agent control center — all paused until configured</p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Agents', value: agents.length, color: '#10d9a0' },
          { label: 'Active', value: agents.filter(a => a.status === 'ACTIVE').length, color: '#4f9deb' },
          { label: 'Paused', value: agents.filter(a => a.status === 'PAUSED').length, color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 20px' }}>
            <div className="mono" style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Agent cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
        {agents.map(agent => {
          const isRunning = runningId === agent.id;
          const isExpanded = expandedId === agent.id;
          const isActive = agent.status === 'ACTIVE';

          return (
            <div key={agent.id} className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{agent.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>{agent.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Toggle */}
                      <div
                        className="toggle-track"
                        style={{ background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}
                        onClick={() => toggleStatus(agent.id)}
                      >
                        <div className="toggle-thumb" style={{ transform: isActive ? 'translateX(18px)' : 'translateX(0)' }} />
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '4px',
                        background: isActive ? 'rgba(16,217,160,0.15)' : 'rgba(255,255,255,0.08)',
                        color: isActive ? '#10d9a0' : 'var(--text-muted)',
                        border: isActive ? '1px solid rgba(16,217,160,0.3)' : '1px solid var(--border)',
                      }}>
                        {isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{agent.description}</div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--blue)' }}>🕐 {agent.schedule}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last: {agent.lastRun}</span>

                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                      <button className="btn btn-secondary" onClick={() => setExpandedId(isExpanded ? null : agent.id)}
                        style={{ padding: '4px 10px', fontSize: '11px' }}>
                        {isExpanded ? 'Hide Log' : 'Show Log'}
                      </button>
                      <button className="btn btn-primary" onClick={() => runNow(agent.id)} disabled={isRunning}
                        style={{ padding: '4px 10px', fontSize: '11px', minWidth: '70px' }}>
                        {isRunning ? '⟳ Running...' : '▶ Run Now'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{
                      marginTop: '12px', padding: '12px', borderRadius: '6px',
                      background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>LAST OUTPUT</div>
                      <div className="mono" style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                        {agent.lastOutput}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Log */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '14px' }}>
          📟 Activity Log
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MOCK_ACTIVITY.map((log, i) => (
            <div key={i} className="terminal-line" style={{ display: 'flex', gap: '10px' }}>
              <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '11px', minWidth: '130px' }}>[{log.time}]</span>
              <span style={{ color: log.color, fontSize: '12px', fontWeight: '500', minWidth: '120px' }}>{log.agent}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{log.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
