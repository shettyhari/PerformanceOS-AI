---
name: PerformanceOS AI architecture
description: Key non-obvious decisions for the pmos marketing analytics dashboard migration
---

## Session Auth
- Uses `express-session` + `bcryptjs` (NOT JWT/NextAuth)
- Session stored in-memory — lost on API server restart (acceptable for dev)
- Vite proxy must forward `/api` to API server port (8080) for session cookies to work in browser
- All fetch calls need `credentials: "include"`

**Why:** migrated from Next.js/NextAuth; chose session cookies as simpler pattern without third-party auth dependency.

**How to apply:** If sessions stop working, check that: (1) vite proxy is pointing to correct API port, (2) `credentials: "include"` is on all fetches, (3) API server CORS has `credentials: true` and `origin: true`.

## Windsor.ai Integration
- Real Windsor.ai API not called — validates key length ≥ 8 chars only
- On first sync, generates 30 days × 8 campaigns = 240 rows of mock campaign data
- Subsequent syncs skip data generation (idempotent)
- API key stored encrypted (AES-256-CBC) using `ENCRYPTION_KEY` env var

**Why:** Windsor.ai requires paid plan; mock data lets the full app work without real credentials.

## Athena AI Chat
- Uses keyword pattern matching on real DB data (no LLM/external API)
- Responds to: roas, spend/budget, conversion, meta/facebook, google, waste/inefficient
- Falls back to summary stats if no keyword matches
- Conversation history stored in DB (conversations + messages tables)

**Why:** No AI integration configured; rule-based responses still feel useful with real data context.

## Vite Proxy Config
- `/api` → `http://localhost:${API_PORT || 8080}` in vite.config.ts server.proxy
- This is critical — without it, browser `/api` calls never reach the Express server

## Data Flow
- Campaign metrics table grows by 240 rows per sync
- Dashboard summary computed on-the-fly from DB (no cache)
- Alerts auto-generated on every GET /api/alerts call if Windsor is connected
