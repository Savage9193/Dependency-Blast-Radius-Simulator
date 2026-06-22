# Architecture

## System Architecture

```
┌─────────────────┐     REST/WS      ┌─────────────────┐     SQL      ┌──────────────┐
│  Next.js        │ ◄──────────────► │  Express API    │ ◄──────────► │  Neon        │
│  Frontend       │   Socket.IO      │  + Socket.IO    │   Drizzle    │  PostgreSQL  │
│  (Vercel)       │                  │  (Render)       │              │              │
└─────────────────┘                  └─────────────────┘              └──────────────┘
         │                                    │
         └──────── @dbrs/shared ──────────────┘
                    (types, schemas, enums)
```

## Backend Architecture

Clean architecture with strict layer separation:

```
HTTP Request
    │
    ▼
Controllers     ← HTTP only, no business logic
    │
    ▼
Services        ← Business rules, orchestration
    │
    ├── Engines (pure functions, no I/O)
    │     ├── CycleDetector
    │     ├── BlastRadiusEngine
    │     ├── SeverityScoringEngine
    │     └── PathExplorerEngine
    │
    ▼
Repositories    ← Database access only
    │
    ▼
PostgreSQL (Neon)
```

### Key Directories

| Directory | Responsibility |
|-----------|---------------|
| `controllers/` | Parse HTTP, call services, return responses |
| `services/` | Business logic, validation orchestration |
| `services/engines/` | Pure graph algorithms |
| `repositories/` | Drizzle ORM queries |
| `middlewares/` | Validation, error handling, security |
| `events/` | Internal event bus for Socket.IO bridge |
| `sockets/` | Real-time broadcast layer |

## Frontend Architecture

Feature-based organization with shared infrastructure:

```
app/              → Next.js App Router pages
features/         → Domain-specific UI (services, dependencies, simulations)
components/ui/    → Reusable design system
components/layout/→ Shell, sidebar, header
hooks/            → TanStack Query wrappers
store/            → Zustand global UI state
providers/        → Query client, Socket.IO context
lib/              → API client, utilities
```

**State management:**
- Server state → TanStack Query (cache, invalidation, optimistic updates)
- Global UI state → Zustand (modals, toasts, graph selection)
- Real-time → Socket.IO with query invalidation on events

## Database Design

### Entity Relationship

```
services (1) ──< dependencies >── (1) services
    │
    └──< simulation_results >── simulations
```

### Indexing Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| services | name (unique) | Duplicate prevention |
| services | team, owner, criticality, status | Filtering |
| dependencies | (source, target) unique | Duplicate prevention |
| dependencies | source, target | Graph traversal |
| simulations | created_at | History queries |
| simulation_results | simulation_id, service_id | Result lookups |
| audit_logs | (entity_type, entity_id) | Audit trail |

## Blast Radius Algorithm

**Model:** Edge `A → B` means service A depends on service B. When B fails, A is impacted.

**Algorithm:** Modified BFS from failed nodes through reverse adjacency (dependents lookup).

```
Input:  failedServiceIds[], dependencyGraph
Output: directlyImpacted[], indirectlyImpacted[], paths[], depths[]

1. Build adjacency: target → [sources that depend on it]
2. BFS queue starting with depth-1 dependents of each failed node
3. Track visited, depth, and paths for each impacted node
4. depth=1 → direct impact, depth>1 → indirect impact
```

**Complexity:** O(V + E) per simulation.

**Handles:** Single/multiple failures, disconnected graphs, deep chains, large graphs.

## Circular Dependency Algorithm

**Algorithm:** DFS with recursion stack (three-color marking).

```
1. Before creating edge (source → target), add edge to temp graph
2. Run DFS from all nodes
3. If neighbor is in recursion stack → cycle found
4. Extract cycle path from stack
5. Reject creation with exact cycle path in error response
```

**Complexity:** O(V + E) per check.

## Severity Scoring Algorithm

**Formula (0–100):**

| Component | Weight | Calculation |
|-----------|--------|-------------|
| Affected | 40 max | `(impactedCount / totalServices) × 40` |
| Depth | 20 max | `(maxDepth / maxGraphDepth) × 20` |
| Criticality | 30 max | `(weightedSum / maxPossibleWeight) × 30` |
| Root failures | 10 max | `min(failedCount / 5, 1) × 10` |

**Criticality weights:** LOW=1, MEDIUM=2, HIGH=3, CRITICAL=5

**Classification:**

| Score | Level |
|-------|-------|
| 0–25 | LOW |
| 26–50 | MEDIUM |
| 51–75 | HIGH |
| 76–100 | CRITICAL |

## Scalability Strategy

### Current (10K services / 50K dependencies)

- In-memory graph engines loaded per request from batched DB queries
- PostgreSQL indexes on all filter/lookup columns
- Pagination on all list endpoints
- Connection pooling (max 20)
- Rate limiting (1000 req/15min default)

### Future Scaling

| Bottleneck | Solution |
|------------|----------|
| Graph load time | Redis cache of adjacency lists, TTL 5min |
| Simulation compute | Background job queue (BullMQ) |
| Real-time fan-out | Redis adapter for Socket.IO |
| Read-heavy dashboard | Read replicas via Neon |
| Large graph UI | Virtualized React Flow, server-side layout |

## Caching Strategy

Currently no external cache — PostgreSQL serves as source of truth with indexed queries.

Recommended production additions:
1. **Graph snapshot cache** — Redis, invalidated on dependency CRUD
2. **Dashboard metrics cache** — 30s TTL, invalidated on service status change
3. **TanStack Query staleTime** — 30s on frontend for health/analytics

## Failure Handling

| Scenario | Handling |
|----------|----------|
| Invalid UUID | 400 with Zod validation error |
| Duplicate service name | 409 Conflict |
| Circular dependency | 409 with cycle path details |
| Missing resource | 404 Not Found |
| Database error | 500 with sanitized message |
| Socket disconnect | Client auto-reconnect with exponential backoff |
| Rate limit exceeded | 429 Too Many Requests |

## Real-Time Architecture

```
Service/Dependency change
    │
    ▼
appEvents (EventEmitter)
    │
    ▼
Socket.IO → broadcast to 'dashboard' room
    │
    ▼
Frontend useSocketEvents → invalidate TanStack Query caches
```

Events: `service:*`, `dependency:*`, `simulation:*`, `health:updated`, `graph:updated`

## Security

- Helmet (HTTP headers)
- CORS (configurable origin)
- Rate limiting
- Zod input validation on all endpoints
- String sanitization (trim, strip `<>`)
- Environment validation on startup

## API Versioning

All endpoints under `/api/v1/*`. OpenAPI spec at `/api/docs`.
