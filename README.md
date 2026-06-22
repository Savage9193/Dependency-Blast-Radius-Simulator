# Dependency Blast Radius Simulator

A production-ready platform for engineering teams to model service dependencies, simulate failures, analyze blast radius impact, detect circular dependencies, and monitor ecosystem health.

## Features

- **Service Management** — CRUD with pagination, sorting, filtering, and search
- **Dependency Graph** — Visualize and manage service relationships
- **Circular Dependency Detection** — Optimized DFS with exact cycle path reporting
- **Blast Radius Analysis** — Multi-failure simulation with impact paths and depth
- **Severity Scoring** — 0–100 score based on affected services, depth, and criticality
- **Historical Simulations** — Compare runs and track trends over time
- **Real-Time Updates** — Socket.IO broadcasts for live dashboard refresh
- **Analytics Dashboard** — Recharts-powered trends and distributions

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js, React, TypeScript, Tailwind, React Flow, Zustand, TanStack Query |
| Backend | Node.js, Express, Socket.IO, Drizzle ORM, Zod |
| Database | Neon PostgreSQL |
| Testing | Jest, Supertest, React Testing Library |

## Project Structure

```
dependency-blast-radius-simulator/
├── apps/
│   ├── frontend/     # Next.js App Router
│   └── backend/      # Express API + Socket.IO
├── packages/
│   └── shared/       # Shared types, schemas, enums
├── docs/
├── README.md
├── ARCHITECTURE.md
└── AGENT.md
```

## Prerequisites

- Node.js 20+
- Neon PostgreSQL account ([neon.tech](https://neon.tech))
- npm 10+

## Installation

```bash
git clone <repository-url>
cd dependency-blast-radius-simulator
npm install
cp .env.example .env
```

## Environment Variables

### Root / Backend (`.env`)

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbrs?sslmode=require
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

### Frontend (`apps/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Neon Configuration

1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string (with `?sslmode=require`)
3. Set `DATABASE_URL` in your `.env`
4. Run migrations:

```bash
npm run db:migrate
npm run db:seed
```

## Local Development

```bash
# Start backend + frontend concurrently
npm run dev

# Or individually
npm run dev -w @dbrs/backend   # http://localhost:3001
npm run dev -w @dbrs/frontend  # http://localhost:3000
```

- **API Docs**: http://localhost:3001/api/docs
- **Dashboard**: http://localhost:3000/dashboard

## Testing

```bash
# All tests
npm test

# Backend only
npm run test -w @dbrs/backend

# Frontend only
npm run test -w @dbrs/frontend
```

Target coverage: 80%+ on backend engines and API layer.

## Deployment

### Vercel (Frontend)

1. Import the repository in Vercel
2. Set root directory to `apps/frontend`
3. Configure environment variables:
   - `NEXT_PUBLIC_API_URL` → your Render backend URL
   - `NEXT_PUBLIC_WS_URL` → your Render backend URL
4. Deploy (uses included `vercel.json`)

### Render (Backend)

1. Connect repository to Render
2. Use the included `render.yaml` blueprint
3. Set `DATABASE_URL` and `CORS_ORIGIN` (your Vercel URL) as secrets
4. Deploy — migrations run automatically on start

### Neon (Database)

Production uses the same Neon project or a separate production branch. Enable connection pooling for serverless workloads.

## Architecture Overview

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design, algorithms, and scalability strategy.

## Assumptions

- Dependency direction: **source depends on target** (source → target)
- When a target service fails, all upstream sources are impacted
- Service names are globally unique
- No authentication layer (designed for internal team tooling; add auth for production exposure)

## Scalability Strategy

- Indexed PostgreSQL queries for service/dependency lookups
- In-memory graph engines with O(V + E) traversal complexity
- Connection pooling via `pg` Pool (max 20 connections)
- Rate limiting on API endpoints
- Pagination on all list endpoints
- Designed and tested for graphs up to 10,000 services / 50,000 dependencies

## Future Improvements

- Authentication and RBAC (OAuth2 / SAML)
- Redis caching for graph snapshots
- GraphQL API alongside REST
- Export/import of dependency graphs (JSON, CSV)
- Slack/PagerDuty integration for simulation alerts
- Multi-tenant workspace support

## License

MIT
