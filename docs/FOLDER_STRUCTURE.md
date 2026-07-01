# PerformanceOS AI — Folder Structure

```
performanceos-ai/
├── .github/
│   └── workflows/              # CI/CD pipelines
├── docker/
│   ├── Dockerfile              # Production multi-stage build
│   ├── Dockerfile.worker       # BullMQ worker image
│   └── init/                   # DB init scripts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── FOLDER_STRUCTURE.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   └── assets/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, register, OAuth callbacks
│   │   ├── (dashboard)/        # Authenticated app shell
│   │   │   ├── analytics/
│   │   │   ├── campaigns/
│   │   │   ├── crm/
│   │   │   ├── reports/
│   │   │   ├── athena/
│   │   │   ├── settings/
│   │   │   └── executive/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── health/
│   │   │   ├── sse/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # Shadcn primitives
│   │   ├── layout/             # Shell, sidebar, header
│   │   ├── charts/             # Recharts wrappers
│   │   └── shared/             # Cross-feature components
│   ├── features/               # Feature-first modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── actions/
│   │   │   └── types.ts
│   │   ├── organizations/
│   │   ├── campaigns/
│   │   ├── analytics/
│   │   ├── windsor/
│   │   ├── athena/
│   │   ├── crm/
│   │   ├── reports/
│   │   ├── alerts/
│   │   └── settings/
│   ├── lib/
│   │   ├── auth/               # NextAuth config, RBAC helpers
│   │   ├── db/                 # Prisma client singleton
│   │   ├── env.ts              # Environment validation
│   │   ├── encryption.ts       # Credential encryption
│   │   ├── cache/              # Redis client
│   │   ├── queue/              # BullMQ setup
│   │   ├── storage/            # S3 adapter
│   │   ├── telemetry/          # OpenTelemetry + Sentry
│   │   ├── validation/         # Shared Zod schemas
│   │   └── utils.ts
│   ├── server/
│   │   ├── repositories/       # Repository implementations
│   │   ├── services/           # Application services
│   │   └── mcp/                # MCP tool definitions + handlers
│   ├── workers/                # BullMQ job processors
│   │   ├── windsor-sync.ts
│   │   ├── report-generation.ts
│   │   └── notification-delivery.ts
│   ├── hooks/                  # Global React hooks
│   ├── stores/                 # Zustand stores
│   └── types/                  # Global TypeScript types
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                    # Playwright
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── components.json             # Shadcn config
├── docker-compose.yml
├── next.config.ts
├── package.json
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## Conventions

| Rule | Detail |
|------|--------|
| Feature isolation | Each feature owns components, hooks, actions, types |
| No cross-feature imports | Features communicate via `lib/` or `server/services/` |
| Server-only code | Files in `server/`, `workers/`, `lib/db/` use `import 'server-only'` |
| Repository interface | `server/repositories/interfaces/` + Prisma impl in `server/repositories/prisma/` |
| Actions naming | `createX`, `updateX`, `deleteX`, `getX` in `features/*/actions/` |
| Components | PascalCase files; co-locate styles with Tailwind classes |
