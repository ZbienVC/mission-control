# ⚡ Mission Control

Zach's personal command center — Bloomberg terminal meets Notion, running 100% locally.

## Quick Start

```bash
cd mission-control
npm run dev
```

Open → **http://localhost:3001**

> Port 3001 is used to avoid conflict with Splash Signal on port 3000.

## Pages

| Page | Route | What It Does |
|------|-------|-------------|
| Dashboard | `/` | Live clock, project status, goals, focus pad, activity feed |
| Projects | `/projects` | Track Plato, Splash Signal, DipperAI, Portfolio with milestones + notes |
| Goals | `/goals` | Goal cards with progress sliders, subtasks checklist, categories |
| Tools | `/tools` | 5 mini-tools (see below) |
| Agents | `/agents` | Autonomous agent control center (UI only, all paused) |
| Settings | `/settings` | Profile, project URLs, notifications, data import/export |

## Tools (at `/tools`)

- **🔍 Token Analyzer** — Paste any Solana address → fetches DexScreener data (price, mcap, volume, 24h change)
- **📝 Quick Notes** — Brain dump pad, saves to localStorage with timestamps
- **🍅 Pomodoro** — 25min work / 5min break timer with session counter + browser notifications
- **🔗 URL Health Checker** — Ping any URL via server-side proxy, shows status code + response time
- **✍️ Markdown Notes** — Split-pane editor with live preview, named notes saved to localStorage

## Data

Everything is stored in **localStorage** — no database, no backend, no auth needed. It's a local tool.

Use **Settings → Export** to back up your data as JSON.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- react-markdown
- DexScreener API (public, no key needed)

## Design

Deep navy command center aesthetic:
- Background: `#0a0f1e`
- Accent (emerald): `#10d9a0`
- Secondary (blue): `#4f9deb`
- Alert (orange): `#f97316`
