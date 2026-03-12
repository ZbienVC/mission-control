'use client';

import { useEffect, useState } from 'react';
import { getItem, setItem } from '@/lib/storage';

interface Milestone {
  label: string;
  done: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  liveUrl: string;
  githubUrl: string;
  status: 'LIVE' | 'BUILDING' | 'PLANNED';
  tech: string[];
  milestones: Milestone[];
  progress: number;
  notes: string;
  icon: string;
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'plato',
    name: 'Plato',
    description: 'Nutrition, meal planning & food intelligence platform. Better alternative to MyFitnessPal / Cal AI.',
    liveUrl: 'https://eatplato.app',
    githubUrl: '',
    status: 'LIVE',
    tech: ['Next.js', 'TypeScript', 'AI', 'PostgreSQL'],
    milestones: [
      { label: 'Core meal tracking live', done: true },
      { label: 'YouTube recipe importer', done: true },
      { label: 'Voice Log feature', done: false },
    ],
    progress: 70,
    notes: '',
    icon: '🥗',
  },
  {
    id: 'splash',
    name: 'Splash Signal',
    description: 'Crypto intelligence & trading dashboard. Alpha discovery: early token detection, narrative trends, dev wallet tracking.',
    liveUrl: 'https://splash-signal-production.up.railway.app',
    githubUrl: '',
    status: 'LIVE',
    tech: ['React', 'Python', 'DexScreener', 'Railway'],
    milestones: [
      { label: 'Initial dashboard deployed', done: true },
      { label: 'DexScreener integration', done: true },
      { label: 'Token intelligence v2', done: false },
    ],
    progress: 60,
    notes: '',
    icon: '📊',
  },
  {
    id: 'dipper',
    name: 'DipperAI',
    description: 'Platform for building/deploying AI agents. No-code agent builder for small businesses and individuals.',
    liveUrl: '',
    githubUrl: 'https://github.com/ZbienVC/dipper-ai',
    status: 'BUILDING',
    tech: ['Next.js', 'TypeScript', 'OpenAI', 'Node.js'],
    milestones: [
      { label: 'Auth system', done: true },
      { label: 'Agent builder UI', done: false },
      { label: 'Deploy to production', done: false },
    ],
    progress: 35,
    notes: '',
    icon: '🤿',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Personal portfolio site showcasing projects, skills, and experience.',
    liveUrl: '',
    githubUrl: 'https://github.com/ZbienVC/portfolio',
    status: 'LIVE',
    tech: ['Next.js', 'TypeScript', 'Tailwind'],
    milestones: [
      { label: 'Initial design', done: true },
      { label: 'Projects section', done: true },
      { label: 'Custom domain setup', done: false },
    ],
    progress: 80,
    notes: '',
    icon: '💼',
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '', description: '', liveUrl: '', githubUrl: '',
    status: 'PLANNED', tech: [], milestones: [], progress: 0, notes: '', icon: '📦',
  });
  const [techInput, setTechInput] = useState('');

  useEffect(() => {
    const saved = getItem<Project[]>('mc:projects', DEFAULT_PROJECTS);
    setProjects(saved);
  }, []);

  const save = (updated: Project[]) => {
    setProjects(updated);
    setItem('mc:projects', updated);
  };

  const updateNote = (id: string, notes: string) => {
    const updated = projects.map(p => p.id === id ? { ...p, notes } : p);
    save(updated);
  };

  const updateProgress = (id: string, progress: number) => {
    const updated = projects.map(p => p.id === id ? { ...p, progress } : p);
    save(updated);
  };

  const toggleMilestone = (projId: string, mIdx: number) => {
    const updated = projects.map(p => {
      if (p.id !== projId) return p;
      const milestones = p.milestones.map((m, i) => i === mIdx ? { ...m, done: !m.done } : m);
      return { ...p, milestones };
    });
    save(updated);
  };

  const addProject = () => {
    if (!newProject.name) return;
    const proj: Project = {
      id: Date.now().toString(),
      name: newProject.name || '',
      description: newProject.description || '',
      liveUrl: newProject.liveUrl || '',
      githubUrl: newProject.githubUrl || '',
      status: newProject.status as Project['status'] || 'PLANNED',
      tech: techInput.split(',').map(t => t.trim()).filter(Boolean),
      milestones: [],
      progress: newProject.progress || 0,
      notes: '',
      icon: newProject.icon || '📦',
    };
    const updated = [...projects, proj];
    save(updated);
    setShowAddModal(false);
    setNewProject({ name: '', description: '', liveUrl: '', githubUrl: '', status: 'PLANNED', tech: [], milestones: [], progress: 0, notes: '', icon: '📦' });
    setTechInput('');
  };

  const getStatusStyle = (status: string) => {
    if (status === 'LIVE') return { bg: 'rgba(16,217,160,0.15)', color: '#10d9a0', border: 'rgba(16,217,160,0.3)' };
    if (status === 'BUILDING') return { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: 'rgba(249,115,22,0.3)' };
    return { bg: 'rgba(79,157,235,0.15)', color: '#4f9deb', border: 'rgba(79,157,235,0.3)' };
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>🚀 Projects</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Track and manage all your builds</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Project</button>
      </div>

      {/* Project Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {projects.map(proj => {
          const s = getStatusStyle(proj.status);
          const isEditing = editingId === proj.id;
          return (
            <div key={proj.id} className="card" style={{ padding: '20px' }}>
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{proj.icon}</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>{proj.name}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {proj.liveUrl && (
                        <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}>↗ Live</a>
                      )}
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '11px', color: 'var(--blue)', textDecoration: 'none' }}>↗ GitHub</a>
                      )}
                    </div>
                  </div>
                </div>
                <span className="mono" style={{
                  fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px',
                  background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                }}>
                  {proj.status}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: '1.5' }}>
                {proj.description}
              </p>

              {/* Tech tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                {proj.tech.map(t => (
                  <span key={t} style={{
                    fontSize: '10px', padding: '2px 7px', borderRadius: '3px',
                    background: 'rgba(79,157,235,0.1)', color: '#4f9deb', border: '1px solid rgba(79,157,235,0.2)',
                  }}>{t}</span>
                ))}
              </div>

              {/* Progress */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Progress</span>
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700' }}>{proj.progress}%</span>
                </div>
                <div className="progress-bar" style={{ height: '6px' }}>
                  <div className="progress-fill" style={{ width: `${proj.progress}%`, height: '100%' }} />
                </div>
                <input type="range" min={0} max={100} value={proj.progress}
                  onChange={e => updateProgress(proj.id, Number(e.target.value))}
                  style={{ marginTop: '6px' }} />
              </div>

              {/* Milestones */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: '500' }}>Milestones</div>
                {proj.milestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', cursor: 'pointer' }}
                    onClick={() => toggleMilestone(proj.id, i)}>
                    <span style={{ fontSize: '13px' }}>{m.done ? '✅' : '⬜'}</span>
                    <span style={{ fontSize: '12px', color: m.done ? 'var(--text-muted)' : 'var(--text-dim)', textDecoration: m.done ? 'line-through' : 'none' }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>Notes</span>
                  <button className="btn btn-secondary" onClick={() => setEditingId(isEditing ? null : proj.id)}
                    style={{ padding: '2px 8px', fontSize: '11px' }}>
                    {isEditing ? 'Done' : 'Edit'}
                  </button>
                </div>
                {isEditing ? (
                  <textarea value={proj.notes} onChange={e => updateNote(proj.id, e.target.value)}
                    placeholder="Add notes..."
                    style={{ width: '100%', height: '70px', resize: 'none', fontSize: '12px' }} />
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '30px', lineHeight: '1.5' }}>
                    {proj.notes || <span style={{ fontStyle: 'italic' }}>No notes yet</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Add Project</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '8px' }}>
                <input placeholder="Icon" value={newProject.icon} onChange={e => setNewProject(p => ({ ...p, icon: e.target.value }))} />
                <input placeholder="Project name" value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} />
              </div>
              <textarea placeholder="Description" value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                style={{ height: '70px', resize: 'none' }} />
              <input placeholder="Live URL (https://...)" value={newProject.liveUrl} onChange={e => setNewProject(p => ({ ...p, liveUrl: e.target.value }))} />
              <input placeholder="GitHub URL (https://github.com/...)" value={newProject.githubUrl} onChange={e => setNewProject(p => ({ ...p, githubUrl: e.target.value }))} />
              <select value={newProject.status} onChange={e => setNewProject(p => ({ ...p, status: e.target.value as Project['status'] }))}>
                <option value="LIVE">LIVE</option>
                <option value="BUILDING">BUILDING</option>
                <option value="PLANNED">PLANNED</option>
              </select>
              <input placeholder="Tech stack (comma separated)" value={techInput} onChange={e => setTechInput(e.target.value)} />
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Initial Progress: {newProject.progress}%</label>
                <input type="range" min={0} max={100} value={newProject.progress} onChange={e => setNewProject(p => ({ ...p, progress: Number(e.target.value) }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={addProject}>Add Project</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
