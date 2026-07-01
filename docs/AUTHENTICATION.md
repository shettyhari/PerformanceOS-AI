# Authentication Module

## Overview

PerformanceOS AI uses **NextAuth v4** with JWT sessions, Prisma adapter, and four OAuth providers. Multi-tenant organization context is embedded in every session.

## Providers

| Provider | Env Variables | Notes |
|----------|---------------|-------|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Offline access + consent prompt |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | Standard OAuth |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | OpenID profile + email |
| Microsoft | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | Azure AD |

Providers are only registered when credentials are present in the environment.

## Session Shape

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
    organizationId: string;
    organizationSlug: string;
    role: UserRole;
  }
}
```

## OAuth Flow

1. User clicks OAuth button on `/login`
2. NextAuth redirects to provider
3. On callback, `signIn` callback calls `AuthService.provisionOAuthUser()`
4. New users: create User + Organization + Subscription + OWNER membership
5. Returning users: resolve primary organization membership
6. JWT populated with org context
7. Audit log records LOGIN event

## RBAC

Five roles with hierarchical permissions defined in `src/lib/auth/rbac.ts`:

- `OWNER` — full access including billing
- `ADMIN` — org management, integrations, settings
- `MANAGER` — campaigns, reports, Windsor sync
- `ANALYST` — read/write reports, CRM, Athena
- `VIEWER` — read-only access

Use `requirePermission('settings:write')` in server actions.

## Protected Routes

Middleware (`src/middleware.ts`) protects all routes except:

- `/` (landing)
- `/login`
- `/api/health`
- `/api/auth/*`

Authenticated users on `/login` redirect to `/dashboard`.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth/config.ts` | NextAuth options, callbacks, events |
| `src/lib/auth/session.ts` | Server-side session helpers |
| `src/lib/auth/rbac.ts` | Permission definitions |
| `src/server/services/auth.service.ts` | User provisioning, audit |
| `src/middleware.ts` | Route protection |
| `src/app/(auth)/login/page.tsx` | Login UI |
| `src/app/(dashboard)/` | Authenticated app shell |

## Organization Settings

Authenticated users with `settings:write` permission can update organization name, timezone, and currency via server action at `/dashboard/settings`.
