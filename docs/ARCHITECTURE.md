# PerformanceOS AI — System Architecture

## Overview

PerformanceOS AI is an enterprise marketing operating system that unifies reporting, analytics, AI insights, attribution, forecasting, CRM, and automation behind a single dashboard. The platform uses **Windsor.ai** as the primary reporting data layer and **Gemini 2.5 Pro** for Athena AI.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                                 │
│  Next.js 15 App Router · React 19 · TanStack Query · Zustand · SSE/WS   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                      Edge / Application Layer                            │
│  Next.js Server Actions · API Routes · Middleware · NextAuth              │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐         ┌────────▼────────┐        ┌────────▼────────┐
│  Domain        │         │  Athena AI      │        │  Background     │
│  Services      │         │  (Gemini 2.5)   │        │  Workers        │
│  + Repositories│         │  + MCP Tools    │        │  (BullMQ)       │
└───────┬────────┘         └────────┬────────┘        └────────┬────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐         ┌────────▼────────┐        ┌────────▼────────┐
│  PostgreSQL    │         │  Redis          │        │  Amazon S3      │
│  (Prisma)      │         │  Cache + Queue  │        │  Reports/Assets │
└────────────────┘         └─────────────────┘        └─────────────────┘
                                    │
                           ┌────────▼────────┐
                           │  Windsor.ai API │
                           └────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              Meta Ads      Google Ads      LinkedIn / Microsoft
```

## Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| Clean Architecture | Domain logic isolated from frameworks; repositories abstract persistence |
| Feature-first | Code organized by business capability (`features/auth`, `features/windsor`) |
| Repository Pattern | All DB access through typed repositories; no raw Prisma in handlers |
| Dependency Injection | Service factories accept repository interfaces for testability |
| MCP for AI | Athena queries data exclusively via internal MCP tools, never direct SQL |
| Windsor-first reporting | Marketing metrics flow Windsor → sync jobs → PostgreSQL → dashboards |

## Layer Responsibilities

### Presentation (`src/app`, `src/components`)

- Route definitions, layouts, and page composition
- Client components for interactivity; server components for data fetching
- Theme (dark/light/system), glassmorphism UI, Framer Motion transitions
- No business logic beyond UI state

### Application (`src/server`)

- **Server Actions**: Mutations with Zod validation, auth checks, rate limiting
- **API Routes**: Webhooks, SSE streams, OAuth callbacks, file downloads
- **Middleware**: Session validation, CSRF, org context injection, RBAC gates

### Domain (`src/lib/domain`, `src/features/*/domain`)

- Pure TypeScript entities and use-case services
- Windsor sync orchestration, report generation, forecast calculations
- Framework-agnostic; unit-testable without Next.js

### Infrastructure (`src/lib/infrastructure`)

- Prisma repositories implementing domain interfaces
- Windsor.ai HTTP client with retry and rate-limit handling
- Gemini client with streaming and tool-calling
- Redis cache adapter, BullMQ job producers/consumers
- S3 storage adapter for generated reports

### AI / MCP (`src/lib/mcp`)

Internal MCP server exposing tools Athena can invoke:

| Tool | Purpose |
|------|---------|
| `get_campaign_metrics` | Spend, impressions, clicks by campaign/date |
| `get_revenue_metrics` | Revenue, ROAS, conversions |
| `get_spend_summary` | Aggregated spend across channels |
| `get_conversions` | Conversion events and rates |
| `get_roas` | Return on ad spend analysis |
| `get_cpa` | Cost per acquisition |
| `get_forecasts` | Predictive metrics |
| `query_crm` | Contacts, deals, pipeline |
| `generate_report` | Trigger report generation |
| `detect_anomalies` | Statistical anomaly detection |

## Authentication & Authorization

```
User ──► NextAuth Session (JWT) ──► Organization Context ──► RBAC Check
```

- **Providers**: Google, Facebook, LinkedIn, Microsoft OAuth
- **Multi-tenancy**: Organization → Teams → Users with role-based permissions
- **Roles**: `OWNER`, `ADMIN`, `MANAGER`, `ANALYST`, `VIEWER`
- Credentials (Windsor API keys, integration tokens) encrypted at rest with AES-256-GCM

## Windsor.ai Integration Flow

```
1. User configures Windsor API key + workspace
2. Connection validation (health check against Windsor API)
3. Scheduler enqueues sync job (cron or manual trigger)
4. BullMQ worker fetches data from Windsor
5. Data normalized and upserted into PostgreSQL
6. Connection log + health status updated
7. Dashboards read from local cache (not live Windsor calls)
```

Retry policy: exponential backoff (3 attempts), dead-letter queue for failures.

## Data Flow — Dashboard

1. User opens dashboard → Server Component loads org context
2. TanStack Query hydrates from Server Action prefetch
3. Metrics served from PostgreSQL with Redis cache (TTL: 5 min)
4. Real-time alerts via SSE channel
5. Target: first meaningful paint < 2s (cached path)

## Athena AI Flow

```
User message ──► Conversation store ──► Gemini 2.5 Pro
                                              │
                                    Tool calls (MCP)
                                              │
                              Internal tool handlers
                                              │
                              Services → Repositories → DB
                                              │
                              Stream response ──► Client (SSE)
```

Conversation history persisted per user/org. Markdown rendered client-side.

## Reporting Pipeline

```
Report request ──► Queue job ──► Data aggregation ──► Template render
                                                          │
                                    ┌─────────────────────┼─────────────────────┐
                                    │                     │                     │
                                   PDF                  Excel              PowerPoint
                                    │                     │                     │
                                    └─────────────────────┼─────────────────────┘
                                                          │
                                              S3 upload + delivery
                                    (email / WhatsApp / Telegram / download)
```

## Realtime

- **SSE**: Dashboard metric updates, Athena streaming responses, notification feed
- **WebSockets**: Collaborative features (comments, live cursors) — Phase 2

## Security

| Control | Mechanism |
|---------|-----------|
| CSRF | NextAuth + custom token for mutations |
| Rate limiting | Redis sliding window per IP/user |
| Input validation | Zod schemas on all boundaries |
| Secrets | Environment validation via `@t3-oss/env-nextjs` |
| Audit | Immutable audit log table for sensitive actions |
| OWASP | Parameterized queries (Prisma), CSP headers, secure cookies |

## Observability

- **OpenTelemetry**: Distributed tracing across API, workers, Windsor calls
- **Sentry**: Error tracking with user/org context
- **Structured logging**: Pino with correlation IDs

## Deployment Topology

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │     │   AWS ECS    │     │   AWS RDS    │
│  Next.js App │────►│  BullMQ      │────►│  PostgreSQL  │
└──────────────┘     │  Workers     │     └──────────────┘
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐     ┌──────────────┐
                     │ ElastiCache  │     │      S3      │
                     │    Redis     │     │   Storage    │
                     └──────────────┘     └──────────────┘
```

Local development: Docker Compose (PostgreSQL, Redis, MinIO for S3-compatible storage).

## Module Implementation Order

| Step | Module | Status |
|------|--------|--------|
| 1 | Architecture | ✅ Complete |
| 2 | Database schema | ✅ Complete |
| 3 | Folder structure | ✅ Complete |
| 4 | Infrastructure | ✅ Complete |
| 5 | Authentication | ✅ Complete |
| 6 | Integrations (Windsor) | ✅ Complete |
| 7 | Dashboard | ✅ Complete |
| 8 | Athena AI + MCP | ✅ Complete |
| 9 | Reporting | Next |
| 10 | Deployment | Pending |

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js 15 App Router | Unified full-stack, RSC for performance, Vercel-native |
| Prisma | Type-safe ORM, migrations, excellent PostgreSQL support |
| BullMQ over raw cron | Reliable job processing, retries, observability |
| Windsor.ai abstraction | Single integration point for all ad platforms |
| MCP for Athena | Decouples AI from data layer; auditable tool calls |
| Feature-first folders | Scales with team size; clear ownership boundaries |
| Zustand over Redux | Minimal boilerplate for UI state |
| TanStack Query | Server state caching, prefetch, optimistic updates |
