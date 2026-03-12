'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getItem, setItem } from '@/lib/storage';

const statusCards = [
  { name: 'Plato', url: 'https://eatplato.app', status: 'LIVE', lastDeploy: 'Today', icon: '🥗' },
  { name: 'Splash Signal', url: 'https://splash-signal-production.up.railway.app', status: 'LIVE', lastDeploy: 'Yesterday', icon: '📊' },
  { name: 'DipperAI', url: 'https://github.com/ZbienVC/dipper-ai', status: 'BUILDING', lastDeploy: '2d ago', icon: '🤿' },
  { name: 'Portfolio', url: 'https://github.com/ZbienVC/portfolio', status: 'LIVE', lastDeploy: '3d ago', icon: '💼' },
];

const recentActivity = [
  { time: '09:14', event: 'Plato deployment successful → eatplato.app', color: '#10d9a0' },
  { time: '08:52', event: 'DipperAI: pushed new auth module to main', color: '#4f9deb' },
  { time: '08:30', event: 'Market Brief: SOL +4.2%, BTC flat overnight', color: '#f97316' },
  { time: 'Yesterday', event: 'Splash Signal: DexScreener integration tested', color: '#4f9deb' },
  { time: 'Yesterday', event: 'Portfolio page: added new project cards', color: '#10d9a0' },
  { time: '2d ago', event: 'Goal updated: Splash Signal v2 → 60% complete', color: '#94a3b8' },
];

const quickActions = [
  { label: '🚀 Projects', href: '/projects', desc: 'Track all builds' },
  { label: '🎯 Goals', href: '/goals', desc: 'View progress' },
  { label: '🔧 Tools', href: '/tools', desc: 'Open toolkit' },
  { label: '🤖 Agents', href: '/agents', desc: 'Agent control' },
  { label: '📊 Token Check', href: '/tools#crypto', desc: 'Analyze tokens' },
  { label: '⚙️ Settings', href: '/settings', desc: 'Configure' },
];

const DEFAULT_GOALS = [
  { id: '1', title: 'Ship DipperAI', category: 'Work', priority: 'High', progress: 35 },
  { id: '2', title: 'Splash Signal v2', category: 'Work', priority: 'High', progress: 60 },
  { id: '3', title: 'Grow Plato Users', category: 'Work', priority: 'Med', progress: 15 },
];

export default function Dashboard() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [focus, setFocus] = useState('');
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  useEffect(() => {
    const savedFocus = getItem<string>('mc:focus', '');
    setFocus(savedFocus);

    const savedGoals = getItem<typeof DEFAULT_GOALS>('mc:goals', DEFAULT_GOALS);
    setGoals(savedGoals.slice(0, 3));

    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const saveFocus = (val: string) => {
    setFocus(val);
    setItem('mc:focus', val);
  };

  const getBadgeClass = (status: string) => {
    if (status === 'LIVE') return 'badge-live';
    if (status === 'BUILDING') return 'badge-building';
    return 'badge-planned';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'LIVE') return '✅';
    if (status === 'BUILDING') return '🔨';
    return '📋';
  };

  const getPriorityColor = (p: string) => p === 'High' ? '#f97316' : p === 'Med' ? '#4f9deb' : '#94a3b8';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent)' }}>⚡ Mission Control</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{date}</div>
        </div>
        <div className="mono" style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--accent)',
          letterSpacing: '2px',
        }}>
          {time}
        </div>
      </div>

      {/* Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '28px',
      }}>
        {statusCards.map(card => (
          <a
            key={card.name}
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div className="card" style={{ padding: '16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{card.icon}</span>
                <span className={`badge-${card.status.toLowerCase()} mono`} style={{
                  fontSize: '10px',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontWeight: '600',
                }}>
                  {getStatusIcon(card.status)} {card.status}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>{card.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last deploy: {card.lastDeploy}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Two-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Active Goals */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>🎯 Active Goals</div>
            <Link href="/goals" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goals.map(goal => (
              <div key={goal.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{goal.title}</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: getPriorityColor(goal.priority), fontWeight: '600' }}>{goal.priority}</span>
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700' }}>{goal.progress}%</span>
                  </div>
                </div>
                <div className="progress-bar" style={{ height: '5px' }}>
                  <div className="progress-fill" style={{ width: `${goal.progress}%`, height: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Focus */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px' }}>
            🎯 Today&apos;s Focus
          </div>
          <textarea
            value={focus}
            onChange={e => saveFocus(e.target.value)}
            placeholder="What's your #1 priority today? Write it here..."
            style={{
              width: '100%',
              height: '100px',
              resize: 'none',
              fontSize: '14px',
              lineHeight: '1.6',
              background: 'rgba(16, 217, 160, 0.04)',
              borderColor: 'rgba(16, 217, 160, 0.2)',
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Auto-saved to localStorage</div>
        </div>
      </div>

      {/* Activity + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Activity */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '14px' }}>
            📟 Recent Activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentActivity.map((log, i) => (
              <div key={i} className="terminal-line">
                <span className="mono" style={{ color: log.color, marginRight: '8px', fontSize: '11px' }}>[{log.time}]</span>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{log.event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '14px' }}>
            ⚡ Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {quickActions.map(action => (
              <Link key={action.href + action.label} href={action.href} style={{ textDecoration: 'none' }}>
                <div
                  className="card"
                  style={{ padding: '12px', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(16,217,160,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(16,217,160,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{action.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
