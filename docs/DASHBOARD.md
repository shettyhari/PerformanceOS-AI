# Dashboard Module

## Overview

The dashboard reads campaign metrics from PostgreSQL (synced via Windsor.ai) with Redis caching for sub-2-second load times.

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview with KPI cards, spend/revenue chart, channel pie |
| `/dashboard/campaigns` | Paginated campaign table with metrics |
| `/dashboard/analytics` | Deep analytics with ROAS trend and channel comparison |
| `/dashboard/executive` | Executive summary with period-over-period trends |

## Caching

- Redis TTL: 5 minutes (`300s`)
- Cache keys: `metrics:{orgId}:summary:{period}`, `daily:{period}`, `channels:{period}`, `executive:{period}`
- Invalidated on Windsor sync completion

## Data Layer

```
AnalyticsService → CampaignAnalyticsRepository → Prisma (CampaignMetric)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/server/services/analytics.service.ts` | Cached analytics queries |
| `src/server/repositories/prisma/campaign-analytics.repository.ts` | DB aggregations |
| `src/components/charts/metric-charts.tsx` | Recharts visualizations |
| `src/features/analytics/types.ts` | Type definitions |
