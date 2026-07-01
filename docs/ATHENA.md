# Athena AI

## Overview

Athena is PerformanceOS AI's marketing intelligence assistant, powered by **Gemini 2.5 Pro** with **MCP tool architecture**. Athena never queries the database directly — all data access flows through internal MCP tools.

## Capabilities

- Campaign analysis and performance summaries
- Budget optimization recommendations
- Marketing reports and executive summaries
- Natural language querying
- Anomaly detection in spend data
- CRM pipeline insights
- Forecast data retrieval
- Streaming markdown responses
- Conversation history

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_campaign_metrics` | Aggregated metrics + daily trend |
| `get_revenue_metrics` | Revenue, ROAS, conversions |
| `get_spend_summary` | Spend by channel |
| `get_conversions` | Conversions, CPA, CTR |
| `get_roas` | ROAS summary and daily trend |
| `get_cpa` | Cost per acquisition |
| `get_forecasts` | Stored forecast data |
| `query_crm` | Contacts, deals, pipeline |
| `generate_report` | List reports |
| `detect_anomalies` | Statistical spend anomaly detection |

## Architecture

```
User message → SSE /api/athena/stream
                    ↓
              AthenaService
                    ↓
              Gemini 2.5 Pro (function calling)
                    ↓
              MCP Executor → AnalyticsService / Prisma
                    ↓
              Stream response → Client (markdown)
                    ↓
              Persist to AthenaConversation / AthenaMessage
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/athena/stream` | POST | SSE streaming chat |
| `/api/athena/conversations` | GET | List conversations |
| `/api/athena/conversations` | DELETE | Delete conversation |
| `/api/athena/conversations/[id]` | GET | Load conversation messages |

## Configuration

```env
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.5-pro
```

## RBAC

Requires `athena:use` permission (Owner, Admin, Manager, Analyst).

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/infrastructure/gemini/athena.ts` | Gemini client + streaming |
| `src/server/mcp/executor.ts` | MCP tool definitions + execution |
| `src/server/services/athena.service.ts` | Conversation management |
| `src/features/athena/components/athena-chat.tsx` | Chat UI |
| `src/app/(dashboard)/dashboard/athena/page.tsx` | Athena page |
