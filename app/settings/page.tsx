'use client';

import { useEffect, useRef, useState } from 'react';
import { getItem, setItem, exportAll, importAll, resetAll } from '@/lib/storage';

interface ProfileSettings {
  name: string;
  email: string;
  timezone: string;
}

interface ProjectUrls {
  plato: string;
  splashSignal: string;
  dipperAI: string;
  portfolio: string;
}

interface NotifSettings {
  deployAlerts: boolean;
  goalReminders: boolean;
  agentAlerts: boolean;
  marketBrief: boolean;
}

const DEFAULT_PROFILE: ProfileSettings = { name: 'Zach', email: 'zach@example.com', timezone: 'EDT (UTC-4)' };
const DEFAULT_URLS: ProjectUrls = {
  plato: 'https://eatplato.app',
  splashSignal: 'https://splash-signal-production.up.railway.app',
  dipperAI: 'https://github.com/ZbienVC/dipper-ai',
  portfolio: 'https://github.com/ZbienVC/portfolio',
};
const DEFAULT_NOTIFS: NotifSettings = {
  deployAlerts: true,
  goalReminders: true,
  agentAlerts: false,
  marketBrief: false,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="toggle-track"
      style={{ background: checked ? 'var(--accent)' : 'rgba(255,255,255,0.15)', cursor: 'pointer' }}
      onClick={() => onChange(!checked)}
    >
      <div className="toggle-thumb" style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }} />
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileSettings>(DEFAULT_PROFILE);
  const [urls, setUrls] = useState<ProjectUrls>(DEFAULT_URLS);
  const [notifs, setNotifs] = useState<NotifSettings>(DEFAULT_NOTIFS);
  const [saved, setSaved] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(getItem('mc:profile', DEFAULT_PROFILE));
    setUrls(getItem('mc:projectUrls', DEFAULT_URLS));
    setNotifs(getItem('mc:notifs', DEFAULT_NOTIFS));
  }, []);

  const saveAll = () => {
    setItem('mc:profile', profile);
    setItem('mc:projectUrls', urls);
    setItem('mc:notifs', notifs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const data = exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission-control-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError('');
    try {
      const data = JSON.parse(importJson);
      importAll(data);
      setImportJson('');
      alert('Data imported! Refresh to see changes.');
    } catch {
      setImportError('Invalid JSON. Please check your data.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importAll(data);
        alert('Data imported! Refresh to see changes.');
      } catch {
        setImportError('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('⚠️ This will delete ALL your Mission Control data. Are you sure?')) {
      resetAll();
      window.location.reload();
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  );

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <label style={{ fontSize: '13px', color: 'var(--text-dim)', minWidth: '140px' }}>{label}</label>
      <div style={{ flex: 1, maxWidth: '320px' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>⚙️ Settings</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Configure your Mission Control</p>
        </div>
        <button className="btn btn-primary" onClick={saveAll} style={{ minWidth: '100px' }}>
          {saved ? '✅ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Profile */}
      <Section title="👤 Profile">
        <Row label="Name">
          <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} style={{ width: '100%' }} />
        </Row>
        <Row label="Email">
          <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} style={{ width: '100%' }} />
        </Row>
        <Row label="Timezone">
          <input value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))} style={{ width: '100%' }} />
        </Row>
      </Section>

      {/* Project URLs */}
      <Section title="🔗 Project URLs">
        <Row label="Plato">
          <input value={urls.plato} onChange={e => setUrls(u => ({ ...u, plato: e.target.value }))} style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }} />
        </Row>
        <Row label="Splash Signal">
          <input value={urls.splashSignal} onChange={e => setUrls(u => ({ ...u, splashSignal: e.target.value }))} style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }} />
        </Row>
        <Row label="DipperAI">
          <input value={urls.dipperAI} onChange={e => setUrls(u => ({ ...u, dipperAI: e.target.value }))} style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }} />
        </Row>
        <Row label="Portfolio">
          <input value={urls.portfolio} onChange={e => setUrls(u => ({ ...u, portfolio: e.target.value }))} style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }} />
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="🔔 Notifications">
        {([
          { key: 'deployAlerts', label: 'Deploy alerts' },
          { key: 'goalReminders', label: 'Goal reminders' },
          { key: 'agentAlerts', label: 'Agent alerts' },
          { key: 'marketBrief', label: 'Daily market brief' },
        ] as { key: keyof NotifSettings; label: string }[]).map(item => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{item.label}</span>
            <Toggle
              checked={notifs[item.key]}
              onChange={v => setNotifs(n => ({ ...n, [item.key]: v }))}
            />
          </div>
        ))}
      </Section>

      {/* Data management */}
      <Section title="💾 Data Management">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleExport} style={{ flex: 1 }}>
              ⬇️ Export All Data (JSON)
            </button>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Import from file:</div>
            <input type="file" accept=".json" ref={fileRef} onChange={handleImportFile} style={{ display: 'none' }} />
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              📂 Choose JSON File
            </button>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Or paste JSON:</div>
            <textarea
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder='Paste exported JSON here...'
              style={{ width: '100%', height: '80px', resize: 'none', fontFamily: 'monospace', fontSize: '12px' }}
            />
            {importError && <div style={{ color: '#f97316', fontSize: '12px', marginTop: '4px' }}>{importError}</div>}
            <button className="btn btn-secondary" onClick={handleImport} style={{ marginTop: '6px' }}>⬆️ Import Data</button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
            <button className="btn btn-danger" onClick={handleReset} style={{ width: '100%' }}>
              🗑️ Reset All Data
            </button>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
              This permanently deletes all local storage data
            </div>
          </div>
        </div>
      </Section>

      {/* About */}
      <div className="card" style={{ padding: '16px', background: 'rgba(16,217,160,0.04)', borderColor: 'rgba(16,217,160,0.15)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: '600' }}>⚡ Mission Control</span> — built for Zach<br />
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Next.js 14 · TypeScript · Tailwind · localStorage · Port 3001
          </span>
        </div>
      </div>
    </div>
  );
}
