'use client';

import { useEffect, useRef, useState } from 'react';
import { getItem, setItem } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuickNote {
  id: string;
  text: string;
  createdAt: string;
}

interface UrlResult {
  url: string;
  status: number | null;
  ms: number | null;
  ok: boolean;
  checking: boolean;
}

interface MarkdownNote {
  id: string;
  name: string;
  content: string;
}

interface TokenData {
  name: string;
  symbol: string;
  priceUsd: string;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  pairAddress: string;
  dexId: string;
}

// ─── Tool A: Crypto Token Analyzer ────────────────────────────────────────────
function CryptoAnalyzer() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError('');
    setTokens([]);
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address.trim()}`);
      const data = await res.json();
      if (!data.pairs || data.pairs.length === 0) {
        setError('No pairs found for this address.');
        return;
      }
      const parsed: TokenData[] = data.pairs.slice(0, 3).map((p: Record<string, unknown>) => {
        const baseToken = p.baseToken as Record<string, string>;
        const priceChange = p.priceChange as Record<string, number> | undefined;
        const volume = p.volume as Record<string, number> | undefined;
        const liquidity = p.liquidity as Record<string, number> | undefined;
        return {
          name: baseToken?.name || 'Unknown',
          symbol: baseToken?.symbol || '?',
          priceUsd: (p.priceUsd as string) || '0',
          priceChange24h: priceChange?.h24 || 0,
          volume24h: volume?.h24 || 0,
          marketCap: (p.marketCap as number) || 0,
          liquidity: liquidity?.usd || 0,
          pairAddress: (p.pairAddress as string) || '',
          dexId: (p.dexId as string) || '',
        };
      });
      setTokens(parsed);
    } catch {
      setError('Failed to fetch. Check address or try again.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          placeholder="Paste Solana token address..."
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
        />
        <button className="btn btn-primary" onClick={analyze} disabled={loading} style={{ minWidth: '90px' }}>
          {loading ? '...' : 'Analyze'}
        </button>
      </div>

      {error && <div style={{ color: '#f97316', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

      {tokens.map((t, i) => (
        <div key={i} className="card" style={{ padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>{t.name} <span style={{ color: 'var(--accent)' }}>{t.symbol}</span></div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>via {t.dexId}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>${parseFloat(t.priceUsd).toFixed(8)}</div>
              <div className="mono" style={{
                fontSize: '13px', fontWeight: '600',
                color: t.priceChange24h >= 0 ? '#10d9a0' : '#f97316',
              }}>
                {t.priceChange24h >= 0 ? '▲' : '▼'} {Math.abs(t.priceChange24h).toFixed(2)}%
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: 'Market Cap', value: fmt(t.marketCap) },
              { label: '24h Volume', value: fmt(t.volume24h) },
              { label: 'Liquidity', value: fmt(t.liquidity) },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{m.label}</div>
                <div className="mono" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--blue)' }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '8px' }}>
            <a href={`https://dexscreener.com/solana/${t.pairAddress}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}>↗ View on DexScreener</a>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tool B: Quick Notes ───────────────────────────────────────────────────────
function QuickNotes() {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState<QuickNote[]>([]);

  useEffect(() => {
    setNotes(getItem<QuickNote[]>('mc:quicknotes', []));
  }, []);

  const saveNote = () => {
    if (!text.trim()) return;
    const note: QuickNote = {
      id: Date.now().toString(),
      text: text.trim(),
      createdAt: new Date().toLocaleString(),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    setItem('mc:quicknotes', updated);
    setText('');
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    setItem('mc:quicknotes', updated);
  };

  return (
    <div>
      <textarea
        placeholder="Brain dump here... write anything"
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ width: '100%', height: '120px', resize: 'none', marginBottom: '10px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={saveNote}>Save Note</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notes.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No notes yet</div>}
        {notes.map(note => (
          <div key={note.id} className="card" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{note.text}</div>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>{note.createdAt}</div>
            </div>
            <button onClick={() => deleteNote(note.id)} className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '12px', flexShrink: 0 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tool C: Pomodoro Timer ────────────────────────────────────────────────────
function PomodoroTimer() {
  const WORK = 25 * 60;
  const BREAK = 5 * 60;
  const [timeLeft, setTimeLeft] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [session, setSession] = useState(1);
  const totalSessions = 4;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (Notification.permission === 'granted') {
              new Notification(isBreak ? '☕ Break over! Time to work.' : '🎉 Pomodoro complete! Take a break.');
            }
            if (!isBreak) {
              setIsBreak(true);
              setTimeLeft(BREAK);
            } else {
              setIsBreak(false);
              setSession(s => s + 1);
              setTimeLeft(WORK);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, isBreak]);

  const toggleRun = () => {
    if (!running && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setRunning(r => !r);
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft(isBreak ? BREAK : WORK);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const total = isBreak ? BREAK : WORK;
  const pct = ((total - timeLeft) / total) * 100;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '16px' }}>
        <span style={{
          fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '4px',
          background: isBreak ? 'rgba(79,157,235,0.15)' : 'rgba(16,217,160,0.15)',
          color: isBreak ? '#4f9deb' : '#10d9a0',
          border: `1px solid ${isBreak ? 'rgba(79,157,235,0.3)' : 'rgba(16,217,160,0.3)'}`,
        }}>
          {isBreak ? '☕ BREAK' : '🍅 FOCUS'}
        </span>
      </div>

      <div className="mono" style={{ fontSize: '72px', fontWeight: '700', color: 'var(--accent)', lineHeight: 1, letterSpacing: '2px', marginBottom: '16px' }}>
        {mins}:{secs}
      </div>

      <div className="progress-bar" style={{ height: '6px', maxWidth: '300px', margin: '0 auto 20px' }}>
        <div className="progress-fill" style={{ width: `${pct}%`, height: '100%' }} />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={toggleRun} style={{ minWidth: '90px' }}>
          {running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button className="btn btn-secondary" onClick={reset}>↺ Reset</button>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Session <span className="mono" style={{ color: 'var(--accent)' }}>{Math.min(session, totalSessions)}</span> of <span className="mono">{totalSessions}</span>
      </div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
        {Array.from({ length: totalSessions }).map((_, i) => (
          <div key={i} style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: i < session - 1 ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Tool D: URL Health Checker ────────────────────────────────────────────────
function UrlChecker() {
  const [urls, setUrls] = useState<string[]>([
    'https://eatplato.app',
    'https://splash-signal-production.up.railway.app',
  ]);
  const [results, setResults] = useState<Record<string, UrlResult>>({});
  const [newUrl, setNewUrl] = useState('');

  const checkUrl = async (url: string): Promise<UrlResult> => {
    const start = Date.now();
    try {
      const res = await fetch(`/api/health?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      const ms = Date.now() - start;
      return { url, status: data.status, ms, ok: data.ok, checking: false };
    } catch {
      return { url, status: null, ms: null, ok: false, checking: false };
    }
  };

  const checkOne = async (url: string) => {
    setResults(r => ({ ...r, [url]: { url, status: null, ms: null, ok: false, checking: true } }));
    const result = await checkUrl(url);
    setResults(r => ({ ...r, [url]: result }));
  };

  const checkAll = () => urls.forEach(u => checkOne(u));

  const addUrl = () => {
    if (!newUrl.trim()) return;
    const u = newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`;
    if (!urls.includes(u)) setUrls(us => [...us, u]);
    setNewUrl('');
  };

  const removeUrl = (url: string) => {
    setUrls(us => us.filter(u => u !== url));
    setResults(r => { const c = { ...r }; delete c[url]; return c; });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input placeholder="https://example.com" value={newUrl} onChange={e => setNewUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addUrl()} style={{ flex: 1 }} />
        <button className="btn btn-secondary" onClick={addUrl}>Add</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={checkAll}>⚡ Check All</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {urls.map(url => {
          const r = results[url];
          return (
            <div key={url} className="card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div className="mono" style={{ fontSize: '12px', color: 'var(--text)' }}>{url}</div>
                {r && !r.checking && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {r.ok
                      ? <span style={{ color: '#10d9a0' }}>✅ {r.status} OK — {r.ms}ms</span>
                      : <span style={{ color: '#f97316' }}>❌ {r.status ? `HTTP ${r.status}` : 'Unreachable'}</span>
                    }
                  </div>
                )}
                {r?.checking && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Checking...</div>}
              </div>
              <button className="btn btn-secondary" onClick={() => checkOne(url)} style={{ padding: '4px 10px', fontSize: '11px' }}>
                Check
              </button>
              <button className="btn btn-danger" onClick={() => removeUrl(url)} style={{ padding: '4px 8px', fontSize: '11px' }}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tool E: Markdown Notes ────────────────────────────────────────────────────
function MarkdownNotes() {
  const [notes, setNotes] = useState<MarkdownNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent] = useState('# Hello\n\nStart writing...');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const saved = getItem<MarkdownNote[]>('mc:mdnotes', []);
    setNotes(saved);
    if (saved.length > 0) {
      setActiveId(saved[0].id);
      setContent(saved[0].content);
    }
  }, []);

  const saveNotes = (updated: MarkdownNote[]) => {
    setNotes(updated);
    setItem('mc:mdnotes', updated);
  };

  const createNote = () => {
    if (!newName.trim()) return;
    const note: MarkdownNote = { id: Date.now().toString(), name: newName.trim(), content: `# ${newName.trim()}\n\n` };
    saveNotes([...notes, note]);
    setActiveId(note.id);
    setContent(note.content);
    setNewName('');
  };

  const updateContent = (val: string) => {
    setContent(val);
    if (activeId) {
      saveNotes(notes.map(n => n.id === activeId ? { ...n, content: val } : n));
    }
  };

  const loadNote = (n: MarkdownNote) => {
    setActiveId(n.id);
    setContent(n.content);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
    if (activeId === id) {
      setActiveId(updated[0]?.id || null);
      setContent(updated[0]?.content || '');
    }
  };

  return (
    <div>
      {/* Note selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {notes.map(n => (
          <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button onClick={() => loadNote(n)} className="btn"
              style={{
                padding: '4px 10px', fontSize: '11px',
                background: activeId === n.id ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)',
                color: activeId === n.id ? 'var(--accent)' : 'var(--text-dim)',
                border: activeId === n.id ? '1px solid rgba(16,217,160,0.3)' : '1px solid var(--border)',
              }}>
              {n.name}
            </button>
            <button onClick={() => deleteNote(n.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', padding: '2px' }}>×</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input placeholder="Note name" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createNote()}
            style={{ width: '130px', padding: '4px 8px', fontSize: '12px' }} />
          <button className="btn btn-secondary" onClick={createNote} style={{ padding: '4px 10px', fontSize: '11px' }}>New</button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', height: '380px' }}>
        <textarea value={content} onChange={e => updateContent(e.target.value)}
          style={{ height: '100%', resize: 'none', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }} />
        <div className="card" style={{
          padding: '16px', overflowY: 'auto', height: '100%',
          fontSize: '13px', lineHeight: '1.7', color: 'var(--text-dim)',
        }}>
          <div className="markdown-preview">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Tools Page ───────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'crypto', label: '🔍 Token Analyzer', desc: 'DexScreener token lookup', component: <CryptoAnalyzer /> },
  { id: 'notes', label: '📝 Quick Notes', desc: 'Brain dump pad', component: <QuickNotes /> },
  { id: 'pomodoro', label: '🍅 Pomodoro', desc: '25/5 focus timer', component: <PomodoroTimer /> },
  { id: 'health', label: '🔗 URL Health', desc: 'Check site uptime', component: <UrlChecker /> },
  { id: 'markdown', label: '✍️ Markdown Notes', desc: 'Write with live preview', component: <MarkdownNotes /> },
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState('crypto');
  const active = TOOLS.find(t => t.id === activeTool)!;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>🔧 Tools</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Productivity mini-tools</p>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Sidebar tool list */}
        <div style={{ width: '180px', flexShrink: 0 }}>
          {TOOLS.map(tool => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)}
              style={{
                width: '100%', padding: '10px 12px', marginBottom: '4px',
                borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
                background: activeTool === tool.id ? 'var(--accent-dim)' : 'transparent',
                border: activeTool === tool.id ? '1px solid rgba(16,217,160,0.3)' : '1px solid transparent',
                color: activeTool === tool.id ? 'var(--accent)' : 'var(--text-dim)',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>{tool.label}</div>
              <div style={{ fontSize: '11px', color: activeTool === tool.id ? 'rgba(16,217,160,0.7)' : 'var(--text-muted)', marginTop: '2px' }}>{tool.desc}</div>
            </button>
          ))}
        </div>

        {/* Tool panel */}
        <div className="card" style={{ flex: 1, padding: '20px', minHeight: '400px' }}>
          <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>{active.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{active.desc}</div>
          </div>
          {active.component}
        </div>
      </div>
    </div>
  );
}
