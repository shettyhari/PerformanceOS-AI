# Windsor.ai Integration

## Overview

PerformanceOS AI uses Windsor.ai as the primary reporting layer for marketing data. All campaign metrics flow through Windsor → background sync → PostgreSQL → dashboards.

```
User configures API key
        ↓
Connection validated (Windsor API)
        ↓
Sync job enqueued (BullMQ)
        ↓
Worker fetches data per connector
        ↓
Normalize + upsert Campaign / CampaignMetric
        ↓
Dashboard reads local PostgreSQL cache
```

## Supported Channels

| Connector | Platform |
|-----------|----------|
| `facebook` | Meta Ads |
| `google_ads` | Google Ads |
| `linkedin` | LinkedIn Ads |
| `bing` | Microsoft Ads |

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /list_connectors` | Validate API key |
| `GET /{connector}` | Fetch campaign metrics |
| `GET /api/common/ds-accounts` | List connected accounts (onboard API) |

Base URLs:
- Connectors: `https://connectors.windsor.ai`
- Onboard: `https://onboard.windsor.ai`

## Security

- API keys encrypted at rest with AES-256-GCM
- Keys never exposed to client; server actions only
- RBAC: `integrations:read`, `integrations:write`, `windsor:sync`

## Sync Types

| Type | Date Range | Trigger |
|------|------------|---------|
| `manual` | Configured preset | User clicks "Sync now" |
| `incremental` | `last_7d` | Auto-sync scheduler |
| `full` | `last_90d` | Reserved for full refresh |

## Auto-Sync Scheduler

The worker process runs:
- **Every 60s**: Check connections due for sync (`autoSyncEnabled` + `syncIntervalMin`)
- **Every 15min**: Health checks on all active connections

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/infrastructure/windsor/client.ts` | HTTP client with retry |
| `src/lib/infrastructure/windsor/normalizer.ts` | Data normalization |
| `src/server/services/windsor.service.ts` | Business logic |
| `src/workers/windsor-sync.ts` | BullMQ job processor |
| `src/workers/windsor-scheduler.ts` | Auto-sync + health |
| `src/features/windsor/actions/` | Server actions |
| `src/app/(dashboard)/dashboard/settings/integrations/` | UI |

## Configuration

Per-connection config (JSON):

```json
{
  "connectors": ["facebook", "google_ads", "linkedin", "bing"],
  "datePreset": "last_30d"
}
```

## Environment

```env
WINDSOR_API_BASE_URL=https://connectors.windsor.ai
WINDSOR_ONBOARD_BASE_URL=https://onboard.windsor.ai
ENCRYPTION_KEY=<64-char-hex>
```

## Retry Policy

- BullMQ: 3 attempts with exponential backoff
- Sync job: tracks `retryCount` / `maxRetries` in database
- Rate limit (429): automatic retry with `Retry-After` header
