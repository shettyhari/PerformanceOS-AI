# PerformanceOS AI

**One Dashboard. Every Marketing Channel.**

Enterprise AI-powered marketing operating system combining reporting, analytics, AI insights, attribution, forecasting, CRM, and automation.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: Next.js Server Actions, Prisma, PostgreSQL, Redis, BullMQ
- **AI**: Gemini 2.5 Pro (Athena AI) with MCP tool architecture
- **Data**: Windsor.ai (primary reporting layer)
- **Auth**: NextAuth with Google, Facebook, LinkedIn, Microsoft OAuth

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 and Redis 7 (via Docker)

### Setup

```bash
# Clone and install
cd performanceos-ai
cp .env.example .env
npm install

# Start infrastructure
npm run docker:up

# Run database migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Health Check

```bash
curl http://localhost:3000/api/health
```

## Project Structure

See [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md).

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Database

See [docs/DATABASE.md](docs/DATABASE.md).

## Implementation Progress

| Step | Module | Status |
|------|--------|--------|
| 1 | Architecture | ✅ |
| 2 | Database | ✅ |
| 3 | Folder structure | ✅ |
| 4 | Infrastructure | ✅ |
| 5 | Authentication | ✅ |
| 6 | Integrations (Windsor) | ✅ |
| 7 | Dashboard | ✅ |
| 8 | Athena AI + MCP | ✅ |
| 9 | Reporting | Next |
| 9 | Reporting | Pending |
| 10 | Deployment | Pending |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run worker` | Start BullMQ workers |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run Playwright tests |
| `npm run docker:up` | Start PostgreSQL, Redis, MinIO |

## License

Proprietary. All rights reserved.
