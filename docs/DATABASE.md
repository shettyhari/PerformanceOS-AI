# PerformanceOS AI — Database Design

## Entity Relationship Overview

```
Organization ──┬── Team ── TeamMember ── User
               ├── OrganizationMember (RBAC)
               ├── WindsorConnection
               ├── Campaign (synced)
               ├── CampaignMetric (time-series)
               ├── CrmContact / CrmDeal
               ├── Report / ReportSchedule
               ├── Alert / Notification
               ├── Task / Comment
               ├── AthenaConversation / AthenaMessage
               ├── Integration
               ├── Subscription
               └── AuditLog
```

## Multi-Tenancy

All tenant-scoped tables include `organizationId` with composite indexes. Row-level isolation enforced at the application layer via repository filters.

## Soft Delete

Tables with `deletedAt DateTime?`:

- `User`, `Organization`, `Team`, `CrmContact`, `CrmDeal`, `Report`, `Task`

## Indexing Strategy

| Pattern | Index |
|---------|-------|
| Tenant queries | `(organizationId, createdAt DESC)` |
| Time-series metrics | `(organizationId, campaignId, date)` unique |
| User lookups | `(email)` unique |
| Session lookups | `(sessionToken)` unique |
| Job status | `(status, scheduledAt)` |

## Encryption

`WindsorConnection.apiKey` and `Integration.credentials` stored as encrypted JSON blobs (`encryptedData`, `iv`, `authTag`).

## Audit Trail

`AuditLog` captures: actor, action, resource type/id, metadata JSON, IP, user agent. Append-only; no soft delete.

## Migration Strategy

Prisma migrations in `prisma/migrations/`. Each module adds migrations atomically. Production deploys run `prisma migrate deploy`.

## Data Retention

| Data | Retention |
|------|-----------|
| CampaignMetric | 24 months (configurable per org) |
| ConnectionLog | 90 days |
| AuditLog | 7 years |
| AthenaMessage | 12 months |

See `prisma/schema.prisma` for the complete schema definition.
