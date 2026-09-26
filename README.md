# Mission Control

Zach's personal command center: a single-page Next.js dashboard for tracking
work across projects and running a few AI helpers.

## What's on the page

- **Overview and Kanban board**: tasks across projects, moved between columns
- **Agent Monitor**: status of the coding, research, operations and growth
  agents and what each is working on
- **Daily Memory**: a per-day log of notes and activity
- **Trends**: scans X, Reddit and YouTube for tracked AI/dev keywords, scores
  posts by engagement velocity, flags spikes, and can push spikes to Telegram
  (`/api/trending`, `/api/trending/scan`)
- **R&D Team**: five Claude personas (strategist, engineer, growth, contrarian,
  editor) debate a topic and write a strategy memo (`/api/rd`, `/api/rd/session`)
- **Autonomous tasks**: Claude picks and drafts one task a day for a project and
  can send it to Telegram (`/api/autonomous`)

Task and memory data live in the browser's `localStorage`. The API routes cache
their results as JSON files under `data/` (gitignored).

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4. AI calls go to
the Anthropic API from the server routes only.

## Run locally

```bash
npm install
cp .env.example .env.local   # set AUTH_USER and AUTH_PASS at minimum
npm run dev                  # http://localhost:3001
```

Port 3001 avoids a clash with Splash Signal on 3000. The whole site, API
included, sits behind HTTP Basic auth (`middleware.ts`). If `AUTH_USER` or
`AUTH_PASS` is not set, every request is refused.

## Environment variables

| Name | Needed for |
|---|---|
| `AUTH_USER`, `AUTH_PASS` | Basic auth login (required) |
| `ANTHROPIC_API_KEY` | R&D Team and autonomous tasks |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Telegram alerts (optional) |
| `X_BEARER_TOKEN` | X trend source (optional) |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | Reddit trend source (optional) |
| `YOUTUBE_API_KEY` | YouTube trend source (optional) |

## Deploy notes

`vercel.json` schedules `/api/trending/scan` hourly and `/api/autonomous` daily.
As written those crons do not succeed on Vercel: cron requests are `GET` while
both routes only accept `POST`, the Basic auth middleware answers them with
401, and Vercel's filesystem is read-only outside `/tmp`, so the JSON caches in
`data/` cannot be written. It works as a local tool today.
