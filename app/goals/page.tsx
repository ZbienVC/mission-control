'use client';

import { useEffect, useState } from 'react';
import { getItem, setItem } from '@/lib/storage';

interface SubTask {
  id: string;
  label: string;
  done: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'Work' | 'Finance' | 'Personal' | 'Health';
  priority: 'High' | 'Med' | 'Low';
  progress: number;
  dueDate: string;
  subtasks: SubTask[];
  notes: string;
}

const DEFAULT_GOALS: Goal[] = [
  {
    id: '1', title: 'Ship DipperAI', description: 'Deploy full platform to production with agent builder, auth, and payment',
    category: 'Work', priority: 'High', progress: 35, dueDate: '2026-04-01',
    subtasks: [
      { id: 's1', label: 'Auth system complete', done: true },
      { id: 's2', label: 'Agent builder UI', done: false },
      { id: 's3', label: 'Payment integration', done: false },
      { id: 's4', label: 'Deploy to production', done: false },
    ],
    notes: '',
  },
  {
    id: '2', title: 'Splash Signal v2', description: 'Add more token intelligence features, improve alerts and wallet tracking',
    category: 'Work', priority: 'High', progress: 60, dueDate: '2026-03-25',
    subtasks: [
      { id: 's1', label: 'DexScreener deep integration', done: true },
      { id: 's2', label: 'Dev wallet tracker', done: true },
      { id: 's3', label: 'Bundle detection', done: false },
      { id: 's4', label: 'Alert system', done: false },
    ],
    notes: '',
  },
  {
    id: '3', title: 'Grow Plato Users', description: 'Get first 100 active daily users on eatplato.app',
    category: 'Work', priority: 'Med', progress: 15, dueDate: '2026-05-01',
    subtasks: [
      { id: 's1', label: 'SEO improvements', done: false },
      { id: 's2', label: 'Social media launch', done: false },
      { id: 's3', label: 'Voice Log feature', done: false },
    ],
    notes: '',
  },
  {
    id: '4', title: 'Deploy Portfolio', description: 'Get portfolio live with custom domain and all projects showcased',
    category: 'Work', priority: 'Med', progress: 80, dueDate: '2026-03-20',
    subtasks: [
      { id: 's1', label: 'Base design complete', done: true },
      { id: 's2', label: 'Projects section', done: true },
      { id: 's3', label: 'Custom domain setup', done: false },
    ],
    notes: '',
  },
  {
    id: '5', title: 'Crypto KOL Growth', description: 'Grow crypto advisor presence, land 3+ new advisory deals',
    category: 'Finance', priority: 'Med', progress: 20, dueDate: '2026-06-01',
    subtasks: [
      { id: 's1', label: 'Update Twitter/X profile', done: true },
      { id: 's2', label: 'Post 3x weekly analysis', done: false },
      { id: 's3', label: 'Land 1st advisory deal', done: false },
    ],
    notes: '',
  },
];

const CATEGORIES = ['Work', 'Finance', 'Personal', 'Health'] as const;
const PRIORITIES = ['High', 'Med', 'Low'] as const;

const priorityColor = (p: string) => p === 'High' ? '#f97316' : p === 'Med' ? '#4f9deb' : '#94a3b8';
const categoryColor = (c: string) => {
  if (c === 'Work') return '#10d9a0';
  if (c === 'Finance') return '#f97316';
  if (c === 'Personal') return '#a78bfa';
  return '#34d399';
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('All');
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '', description: '', category: 'Work', priority: 'Med',
    progress: 0, dueDate: '', subtasks: [], notes: '',
  });
  const [newTaskLabel, setNewTaskLabel] = useState('');

  useEffect(() => {
    const saved = getItem<Goal[]>('mc:goals', DEFAULT_GOALS);
    setGoals(saved);
  }, []);

  const save = (updated: Goal[]) => {
    setGoals(updated);
    setItem('mc:goals', updated);
  };

  const updateGoal = (id: string, patch: Partial<Goal>) => {
    save(goals.map(g => g.id === id ? { ...g, ...patch } : g));
  };

  const toggleSubtask = (goalId: string, taskId: string) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      return { ...g, subtasks: g.subtasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) };
    });
    save(updated);
  };

  const addSubtask = (goalId: string, label: string) => {
    if (!label.trim()) return;
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      return { ...g, subtasks: [...g.subtasks, { id: Date.now().toString(), label: label.trim(), done: false }] };
    });
    save(updated);
  };

  const deleteSubtask = (goalId: string, taskId: string) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      return { ...g, subtasks: g.subtasks.filter(t => t.id !== taskId) };
    });
    save(updated);
  };

  const deleteGoal = (id: string) => {
    save(goals.filter(g => g.id !== id));
  };

  const addGoal = () => {
    if (!newGoal.title) return;
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title || '',
      description: newGoal.description || '',
      category: newGoal.category as Goal['category'] || 'Work',
      priority: newGoal.priority as Goal['priority'] || 'Med',
      progress: newGoal.progress || 0,
      dueDate: newGoal.dueDate || '',
      subtasks: [],
      notes: '',
    };
    save([...goals, goal]);
    setShowModal(false);
    setNewGoal({ title: '', description: '', category: 'Work', priority: 'Med', progress: 0, dueDate: '', subtasks: [], notes: '' });
  };

  const filtered = filterCat === 'All' ? goals : goals.filter(g => g.category === filterCat);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>🎯 Goals</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {goals.filter(g => g.progress === 100).length}/{goals.length} complete
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Goal</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {['All', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="btn"
            style={{
              padding: '5px 12px', fontSize: '12px',
              background: filterCat === cat ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)',
              color: filterCat === cat ? 'var(--accent)' : 'var(--text-dim)',
              border: filterCat === cat ? '1px solid rgba(16,217,160,0.3)' : '1px solid var(--border)',
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {filtered.map(goal => {
          const isExpanded = expandedId === goal.id;
          const doneCount = goal.subtasks.filter(t => t.done).length;
          return (
            <div key={goal.id} className="card" style={{ padding: '18px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '5px' }}>{goal.title}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px', padding: '2px 7px', borderRadius: '3px', fontWeight: '600',
                      background: `${categoryColor(goal.category)}15`, color: categoryColor(goal.category),
                      border: `1px solid ${categoryColor(goal.category)}30`,
                    }}>{goal.category}</span>
                    <span style={{
                      fontSize: '10px', padding: '2px 7px', borderRadius: '3px', fontWeight: '600',
                      color: priorityColor(goal.priority),
                      background: `${priorityColor(goal.priority)}15`,
                      border: `1px solid ${priorityColor(goal.priority)}30`,
                    }}>{goal.priority}</span>
                    {goal.dueDate && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '2px 0' }}>
                        Due {new Date(goal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                    className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '11px' }}>
                    {isExpanded ? '▲' : '▼'}
                  </button>
                  <button onClick={() => deleteGoal(goal.id)}
                    className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '11px' }}>×</button>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: '1.5' }}>{goal.description}</p>

              {/* Progress slider */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Progress</span>
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700' }}>{goal.progress}%</span>
                </div>
                <div className="progress-bar" style={{ height: '5px', marginBottom: '6px' }}>
                  <div className="progress-fill" style={{ width: `${goal.progress}%`, height: '100%' }} />
                </div>
                <input type="range" min={0} max={100} value={goal.progress}
                  onChange={e => updateGoal(goal.id, { progress: Number(e.target.value) })} />
              </div>

              {/* Subtasks summary */}
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: isExpanded ? '12px' : '0' }}>
                ✓ {doneCount}/{goal.subtasks.length} tasks done
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div>
                  {/* Subtasks */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-dim)', marginBottom: '8px' }}>Sub-tasks</div>
                    {goal.subtasks.map(task => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <input type="checkbox" checked={task.done} onChange={() => toggleSubtask(goal.id, task.id)} />
                        <span style={{ flex: 1, fontSize: '12px', color: task.done ? 'var(--text-muted)' : 'var(--text-dim)', textDecoration: task.done ? 'line-through' : 'none' }}>
                          {task.label}
                        </span>
                        <button onClick={() => deleteSubtask(goal.id, task.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}>×</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <input
                        placeholder="Add task..."
                        value={newTaskLabel}
                        onChange={e => setNewTaskLabel(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            addSubtask(goal.id, newTaskLabel);
                            setNewTaskLabel('');
                          }
                        }}
                        style={{ flex: 1, padding: '5px 8px', fontSize: '12px' }}
                      />
                      <button className="btn btn-secondary" onClick={() => { addSubtask(goal.id, newTaskLabel); setNewTaskLabel(''); }}
                        style={{ padding: '5px 10px', fontSize: '12px' }}>Add</button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-dim)', marginBottom: '6px' }}>Notes</div>
                    <textarea value={goal.notes} onChange={e => updateGoal(goal.id, { notes: e.target.value })}
                      placeholder="Add notes..."
                      style={{ width: '100%', height: '70px', resize: 'none', fontSize: '12px' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Add Goal</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Goal title" value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))} />
              <textarea placeholder="Description" value={newGoal.description} onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))}
                style={{ height: '70px', resize: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select value={newGoal.category} onChange={e => setNewGoal(p => ({ ...p, category: e.target.value as Goal['category'] }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={newGoal.priority} onChange={e => setNewGoal(p => ({ ...p, priority: e.target.value as Goal['priority'] }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <input type="date" value={newGoal.dueDate} onChange={e => setNewGoal(p => ({ ...p, dueDate: e.target.value }))} />
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Progress: {newGoal.progress}%</label>
                <input type="range" min={0} max={100} value={newGoal.progress}
                  onChange={e => setNewGoal(p => ({ ...p, progress: Number(e.target.value) }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={addGoal}>Add Goal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
