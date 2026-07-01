# PerformanceOS AI — Database Design

## Design Goals

- Multi-tenant (organization-scoped)
- Audit trail for compliance
- Soft delete for recoverable entities
- Optimized indexes for dashboard queries
- Encrypted sensitive fields at application layer

## Entity Relationship Overview

```
Organization ──┬── Team ── TeamMember ── User
                 ├── OrganizationMember ── User
                 ├── Role ── RolePermission ── Permission
                 ├── WindsorConnection
                 ├── WindsorSyncJob / WindsorSyncLog
                 ├── CampaignMetric (synced)
                 ├── Report / ReportSchedule
                 ├── Conversation / Message (Athena)
                 ├── CrmContact / CrmDeal
                 ├── Alert / Notification
                 ├── Task / Comment
                 ├── ActivityLog
                 └── Subscription (future-ready)
```

## Core Tables

### Identity & Multi-tenancy

| Table | Purpose |
|-------|---------|
| `users` | Global user accounts |
| `accounts` | OAuth provider links (NextAuth) |
| `sessions` | Active sessions |
| `verification_tokens` | Email verification |
| `organizations` | Tenant root |
| `organization_members` | User ↔ Org with role |
| `teams` | Sub-groups within org |
| `team_members` | User ↔ Team |
| `roles` | Custom roles per org |
| `permissions` | System permission catalog |
| `role_permissions` | Role ↔ Permission M2M |

### Windsor Integration

| Table | Purpose |
|-------|---------|
| `windsor_connections` | API key (encrypted), workspace config |
| `windsor_sync_jobs` | Scheduled/manual sync metadata |
| `windsor_sync_logs` | Per-run logs, errors, row counts |
| `windsor_health_checks` | Last validation timestamp, status |

### Metrics & Analytics (Synced from Windsor)

| Table | Purpose |
|-------|---------|
| `campaigns` | Campaign dimension |
| `ad_sets` | Ad set dimension |
| `ads` | Ad dimension |
| `daily_metrics` | Date-grain facts (spend, impressions, clicks, conversions, revenue) |
| `attribution_configs` | Attribution model settings per org |
| `forecasts` | Stored forecast results |

**`daily_metrics` composite index:** `(organization_id, date, campaign_id)` for dashboard queries.

### Athena AI

| Table | Purpose |
|-------|---------|
| `conversations` | Chat sessions per user/org |
| `messages` | User/assistant messages with metadata |
| `message_tool_calls` | MCP tool invocations audit |

### CRM

| Table | Purpose |
|-------|---------|
| `crm_contacts` | Contacts |
| `crm_deals` | Pipeline deals |
| `crm_activities` | Calls, emails, meetings |

### Reporting

| Table | Purpose |
|-------|---------|
| `reports` | Generated report metadata + S3 key |
| `report_schedules` | Cron + delivery channels |
| `report_deliveries` | Delivery attempt logs |

### Collaboration

| Table | Purpose |
|-------|---------|
| `alerts` | Threshold/rule definitions |
| `notifications` | In-app notifications |
| `tasks` | Task management |
| `comments` | Polymorphic comments |
| `activity_logs` | Audit trail |

### White-label & Billing (Subscription-ready)

| Table | Purpose |
|-------|---------|
| `organization_settings` | Branding, domain, theme |
| `subscriptions` | Plan, status, Stripe IDs (future) |

## Indexing Strategy

```sql
-- Dashboard hot path
CREATE INDEX idx_daily_metrics_org_date ON daily_metrics(organization_id, date DESC);
CREATE INDEX idx_daily_metrics_campaign ON daily_metrics(organization_id, campaign_id, date);

-- Multi-tenant scoping
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

-- Sync monitoring
CREATE INDEX idx_sync_jobs_status ON windsor_sync_jobs(organization_id, status);
CREATE INDEX idx_sync_logs_job ON windsor_sync_logs(sync_job_id, created_at DESC);

-- Athena history
CREATE INDEX idx_conversations_user ON conversations(user_id, organization_id, updated_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
```

## Soft Delete Pattern

Tables with `deleted_at TIMESTAMPTZ NULL`:

- `organizations`, `teams`, `users` (anonymize on hard delete request)
- `campaigns`, `crm_contacts`, `crm_deals`, `reports`, `tasks`

Prisma middleware filters `deleted_at IS NULL` by default.

## Audit Log Schema

```typescript
ActivityLog {
  id, organizationId, userId, action, entityType, entityId,
  metadata (JSON), ipAddress, userAgent, createdAt
}
```

Actions: `created`, `updated`, `deleted`, `synced`, `exported`, `login`, `permission_changed`.

## Data Retention

| Data | Retention |
|------|-----------|
| `daily_metrics` | 24 months rolling (configurable per org) |
| `windsor_sync_logs` | 90 days |
| `activity_logs` | 12 months |
| `messages` | User-deletable; org policy override |

## Encryption

| Field | Method |
|-------|--------|
| `windsor_connections.api_key_encrypted` | AES-256-GCM, per-org DEK wrapped by master key |
| OAuth tokens | NextAuth encrypted fields |

## Migration Strategy

1. Initial migration: core auth + org tables
2. Windsor tables + metrics
3. Athena + MCP audit
4. CRM + collaboration
5. Reporting + schedules
6. White-label + subscription stubs

Prisma migrations in `prisma/migrations/` with descriptive names.
