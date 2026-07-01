# PerformanceOS AI — System Architecture

## Overview

PerformanceOS AI is an enterprise marketing operating system that unifies reporting, analytics, AI insights, attribution, forecasting, campaign monitoring, CRM, and automation behind a single dashboard.

**Primary data flow:**

```
Users → PerformanceOS AI → Windsor.ai → Marketing Channels
                ↓
           PostgreSQL (synced data)
                ↓
           Redis (cache + queues)
                ↓
           Athena AI (Gemini 2.5 Pro + MCP tools)
```

## Architectural Principles

| Principle | Application |
|-----------|-------------|
| Clean Architecture | Domain → Application → Infrastructure → Presentation |
| Feature-first | Modules grouped by business capability |
| Repository Pattern | Data access abstracted behind interfaces |
| Dependency Injection | Services wired via composition root |
| Event-driven sync | Windsor sync via BullMQ workers |
| MCP-first AI | Athena uses MCP tools, not raw DB queries |

## Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  Next.js 15 App Router · React 19 · Shadcn · TanStack Query │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  Server Actions · Use Cases · DTOs · Validation (Zod)       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  Entities · Value Objects · Domain Services · Events        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                         │
│  Prisma · Redis · BullMQ · Windsor Client · S3 · Sentry     │
└─────────────────────────────────────────────────────────────┘
```

## Core Subsystems

### 1. Identity & Access (IAM)

- **NextAuth v5** with Google, Facebook, LinkedIn, Microsoft OAuth
- **RBAC**: Organization → Team → User → Role → Permission
- JWT sessions with refresh rotation
- Encrypted credential storage (AES-256-GCM) for Windsor API keys and integration tokens

### 2. Windsor Integration Layer

- API key per organization (encrypted at rest)
- Workspace configuration (connectors, date ranges, dimensions)
- Connection validation on save
- Sync scheduler (cron + manual trigger)
- BullMQ job queue with exponential backoff retry
- Connection logs and health monitoring
- Local PostgreSQL mirror of Windsor metrics

### 3. Reporting & Analytics

- Pre-aggregated materialized views for dashboard KPIs
- Redis caching (TTL by query type)
- Pagination + cursor-based lists
- Attribution models stored as configuration
- Export pipeline: PDF, Excel, PowerPoint, CSV

### 4. Athena AI (Gemini 2.5 Pro)

- Streaming SSE responses
- Conversation history persisted per user/org
- Markdown rendering on client
- Tool calling via internal MCP server
- MCP tools: campaign metrics, revenue, spend, conversions, ROAS, CPA, forecasts, CRM, reports

### 5. MCP Architecture

```
Athena (Gemini) ──► MCP Server (internal) ──► Application Services ──► Repositories
```

Internal MCP tools expose typed, permission-scoped operations. Athena never receives raw SQL or DB credentials.

### 6. Background Processing

| Queue | Purpose |
|-------|---------|
| `windsor-sync` | Pull metrics from Windsor.ai |
| `report-generation` | PDF/Excel/PPT/CSV exports |
| `report-delivery` | Email, WhatsApp, Telegram |
| `forecast` | ML/statistical forecasting jobs |
| `notifications` | Alerts and in-app notifications |

### 7. Realtime

- **SSE** for Athena streaming and live dashboard updates
- **WebSockets** (optional upgrade path) for collaborative features

### 8. Observability

- OpenTelemetry traces (HTTP, DB, queue, Windsor API)
- Sentry error tracking
- Structured JSON logging (Pino)
- Audit log table for compliance

## Deployment Topology

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │     │   AWS ECS    │     │   AWS RDS    │
│  Next.js App │────►│  BullMQ      │────►│  PostgreSQL  │
│  (Edge/API)  │     │  Workers     │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       └────────────────────┴─────────────────────┘
                            │
                    ┌───────┴───────┐
                    │ ElastiCache   │
                    │ Redis         │
                    └───────────────┘
                            │
                    ┌───────┴───────┐
                    │ S3            │
                    │ Reports/Assets│
                    └───────────────┘
```

**Docker Compose** used for local development (app, postgres, redis, worker).

## Security Model

- CSRF protection via NextAuth + SameSite cookies
- Rate limiting (Redis sliding window) on API routes and AI endpoints
- Input validation with Zod on all boundaries
- OWASP: parameterized queries (Prisma), XSS sanitization, CSP headers
- Secrets via environment validation (`@t3-oss/env-nextjs`)
- RBAC enforced at use-case layer, not only UI

## Performance Targets

| Metric | Target |
|--------|--------|
| Dashboard TTFB | < 500ms |
| Dashboard interactive | < 2s |
| Athena first token | < 1s |
| Windsor sync | Background, non-blocking |

**Strategies:** Redis cache, DB indexes, lazy-loaded charts, streaming AI, paginated tables, pre-aggregated metrics.

## Module Dependency Graph

```
auth ──► organizations ──► teams ──► users/permissions
                │
                └──► windsor ──► sync ──► metrics
                              │
                              └──► dashboard / analytics / attribution
                                        │
                                        └──► athena (MCP) ──► reports
```

## Technology Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Monorepo vs single app | Single Next.js app (modular) | Faster iteration; server actions reduce API boilerplate |
| ORM | Prisma | Type-safe, migrations, PostgreSQL-first |
| Queue | BullMQ + Redis | Mature, retries, scheduling |
| AI | Gemini 2.5 Pro | Spec requirement; tool calling + streaming |
| Reporting source | Windsor.ai | Spec requirement; avoids direct ad platform APIs |
| State (client) | TanStack Query + Zustand | Server state vs UI state separation |
| Testing | Vitest + Playwright | Fast unit + E2E coverage |

## Next Steps

1. ✅ System architecture (this document)
2. Database schema design
3. Folder structure
4. Infrastructure bootstrap (Docker, Prisma, env validation)
5. Authentication module
