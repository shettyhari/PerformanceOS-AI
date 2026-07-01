# PerformanceOS AI

A full-stack marketing analytics dashboard that aggregates multi-channel ad campaign data (Google Ads, Meta Ads, LinkedIn Ads, Microsoft Ads) via Windsor.ai integration, with AI-powered insights, alerts, and an Athena AI chat interface.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm --filter @workspace/pmos run dev` — run the frontend Vite dev server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter (routing), TanStack Query, Framer Motion, Recharts, next-themes, Zustand
- API: Express 5 with express-session (cookie-based auth), bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/index.ts` — PostgreSQL schema (orgs, users, windsor_connections, sync_logs, campaign_metrics, alerts, conversations, messages)
- `lib/api-client-react/src/generated/` — generated React Query hooks and Zod schemas (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, dashboard, analytics, alerts, integrations, athena)
- `artifacts/pmos/src/pages/` — Frontend pages (login, register, dashboard/*)
- `artifacts/pmos/src/components/` — Shared components (sidebar, navbar, theme-toggle) and dashboard components

## Architecture decisions

- Session-based auth (express-session + bcryptjs) — not JWT, sessions stored in memory for simplicity
- Windsor.ai connection validates API key length ≥ 8 chars; generates mock 30-day × 8-campaign data on first sync
- No real Windsor.ai API calls — mock data is generated deterministically with variance for realistic charts
- Athena AI uses keyword-based pattern matching on real campaign DB data (no LLM/external API needed)
- Vite dev proxy `/api` → API server port (8080) for session cookies to work across the dev stack

## Product

- **Auth**: Register workspace (org), login, persistent sessions
- **Onboarding**: Two-step Windsor.ai connection + initial data sync
- **Dashboard**: Executive summary, needs attention + scaling opportunities, KPI cards with sparklines, AI recommendations
- **Analytics**: Time series area chart, platform ROAS bar chart, filterable/sortable campaigns table
- **Athena AI**: Keyword-based AI chat powered by real campaign data with conversation history
- **Alerts**: AI-generated ROAS alerts (CRITICAL/WARNING), with acknowledge/resolve flow
- **Integrations**: Windsor.ai connection management, sync logs, supported connector list
- **Settings**: Profile, appearance (theme), alert notification preferences

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- API server must be running before the frontend (vite proxy won't connect otherwise)
- Session cookies require `credentials: "include"` on all fetch calls
- The `campaign_metrics` table grows fast — each sync adds 30 × 8 = 240 rows
- `express-session` is in-memory by default — sessions are lost on API server restart

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
