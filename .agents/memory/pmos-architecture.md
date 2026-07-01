---
name: PerformanceOS AI architecture
description: Key non-obvious decisions for the pmos marketing analytics dashboard
---

## Auth — Clerk (not session/bcrypt)
- Auth is Replit-managed Clerk; provisioned via `setupClerkWhitelabelAuth()`
- Google SSO is enabled by default; other providers managed from the Auth pane in the Replit toolbar
- `clerkMiddleware` + `clerkProxyMiddleware` mounted in `app.ts`; must come before `express.json()`
- `requireAuth` in `artifacts/api-server/src/middlewares/requireAuth.ts` uses `getAuth()` from `@clerk/express`
- JIT provisioning: first API call with a new Clerk user creates the org + user record automatically
- `clerk_id` column added to `users` table via SQL (not drizzle push, since TTY issue)
- Frontend: `ClerkProvider` wraps routes in `App.tsx`; `publishableKeyFromHost` resolves key by hostname

**Why:** migrated from custom session/bcrypt because user needed Google SSO. Clerk handles all auth UX.

**How to apply:** If 401 errors appear, check that `clerkMiddleware` is mounted before routes and `requireAuth` is calling `getAuth(req)` correctly. Web auth is cookie-based — no Bearer tokens needed.

## Windsor.ai Integration
- Real Windsor.ai API not called — validates key length ≥ 8 chars only
- On first sync, generates 30 days × 8 campaigns = 240 rows of mock campaign data
- Disconnect must delete `sync_logs` before `windsor_connections` (FK constraint)

**Why:** Windsor.ai requires paid plan; mock data lets the full app work without real credentials.

## Athena AI Chat
- Keyword pattern matching on real DB data (no LLM)
- Conversations + messages stored in DB

## Vite Proxy
- `/api` → `http://localhost:${API_PORT || 8080}` in vite.config.ts
- Critical: without it, browser `/api` calls never reach Express

## DB schema evolution
- `users.clerk_id` added via raw SQL: `ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT`
- Drizzle push fails in non-TTY environments when existing rows need unique constraint; use raw SQL instead
