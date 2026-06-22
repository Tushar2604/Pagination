# CodeVector Products API

Production-oriented product catalog backend for browsing ~200,000 products with **stable cursor pagination**, category filtering, and PostgreSQL-backed performance.

Built for a backend internship assignment with interview-defensible architecture: Express, Prisma, Docker, validation, tests, and explicit correctness documentation.

## Features

- `GET /api/products` — newest-first listing with cursor pagination
- Category filter (`?category=electronics`)
- Configurable page size (`?limit=20`, max 100)
- 200k-product seed script (batch inserts)
- Docker Compose for PostgreSQL + API
- Integration tests including concurrent-insert scenarios

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 2. Configure environment

```bash
cp .env.example .env
npm install
```

If `npm run db:migrate` fails with authentication errors, check for **port conflicts**: a local PostgreSQL on `5432` is common on Windows. This project maps Docker Postgres to host port **5433** to avoid that clash.

If `npm run db:migrate` connects to database `dbname` with user `username`, a **machine-level `DATABASE_URL`** is overriding `.env`. npm scripts use `dotenv-cli` so project `.env` wins. You can also remove the global variable from Windows Environment Variables.

### 3. Migrate and seed

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Seeding 200,000 rows typically takes **30–90 seconds** depending on hardware (5,000-row batches).

### 4. Run the API

```bash
npm run dev
```

```bash
curl "http://localhost:3000/api/products?limit=5"
curl "http://localhost:3000/api/products?category=books&limit=10"
```

### Full Docker stack

```bash
docker compose --profile seed up --build
# API at http://localhost:3000
```

## API Reference

### `GET /api/products`

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Optional. One of the allowed categories (see below). |
| `cursor` | string | Optional. Opaque token from `pagination.nextCursor`. |
| `limit` | integer | Optional. Default 20, min 1, max 100. |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Premium Speaker #004281",
      "category": "electronics",
      "price": "149.99",
      "createdAt": "2025-03-15T10:22:11.000Z",
      "updatedAt": "2025-03-15T10:22:11.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "nextCursor": "eyJjIjoiLi4uIiwiaSI6Ii4uLiJ9",
    "hasMore": true
  }
}
```

**Categories:** `electronics`, `clothing`, `home-garden`, `sports-outdoors`, `books`, `toys-games`, `health-beauty`, `automotive`, `grocery`, `office-supplies`

### `GET /health`

Liveness check.

## Architecture

```
src/
├── config/           # Environment-based settings
├── constants/        # Category allowlist
├── controllers/      # HTTP adapters (thin)
├── errors/           # Typed application errors
├── lib/              # Prisma singleton
├── middleware/       # Global error handler
├── routes/           # Route registration
├── services/         # Business logic + queries
├── utils/            # Cursor encode/decode
├── app.ts            # Express factory (testable)
└── server.ts         # Process entrypoint
prisma/
├── schema.prisma     # Model + index definitions
├── migrations/       # SQL migrations
└── seed.ts           # 200k batch seed
tests/                # Integration + unit tests
```

**Clean architecture intent:** routes → controllers → services → Prisma. Validation and errors sit at the edges; SQL strategy lives in one service file with documented invariants.

## Schema Design

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key; tiebreaker in sort order |
| `name` | varchar(255) | Display name |
| `category` | varchar(100) | Filter dimension |
| `price` | decimal(10,2) | Monetary value |
| `created_at` | timestamptz | **Immutable sort key** for pagination |
| `updated_at` | timestamptz | Metadata only; does not affect cursors |

## Pagination Strategy

### Why cursor (keyset), not offset?

`OFFSET 100000 LIMIT 20` forces PostgreSQL to scan and discard 100,000 rows on every request. Cost grows linearly with page depth and rows can shift between requests (duplicates/misses when inserts happen).

**Keyset pagination** uses the last seen `(created_at, id)` tuple as an exclusive upper bound:

```sql
ORDER BY created_at DESC, id DESC
WHERE (created_at, id) < ($cursor_created_at, $cursor_id)
```

- **Cost:** O(limit) regardless of page depth
- **Stability:** deterministic ordering with a unique composite key
- **Concurrent inserts:** new rows are newer than the cursor → excluded from subsequent pages; existing "next" rows remain next

See `src/services/productService.ts` for tradeoffs and edge cases.

### Why `created_at` + `id`?

`created_at` alone is not unique. The UUID `id` breaks ties so every row has a fixed position in the total order.

## Indexing Strategy

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_products_created_at_id_desc` | `(created_at DESC, id DESC)` | Global newest-first scans + cursor seek |
| `idx_products_category_created_at_id_desc` | `(category, created_at DESC, id DESC)` | Category filter with same sort order |

Both indexes align exactly with `ORDER BY` and the cursor predicate so PostgreSQL avoids an explicit `Sort` node.

Details: [docs/PERFORMANCE.md](docs/PERFORMANCE.md)

## Seed Strategy

- **200,000** products by default (`SEED_COUNT` env override)
- **Batch size 5,000** via `prisma.product.createMany`
- Realistic names, prices, categories, timestamps spread over ~2 years
- Re-run safe: skips if data exists unless `FORCE_SEED=true`

```bash
FORCE_SEED=true npm run db:seed
SEED_COUNT=10000 SEED_BATCH_SIZE=2000 npm run db:seed
```

## Testing

Requires PostgreSQL (e.g. `docker compose up -d postgres`).

```bash
npm test
```

Coverage includes:

- First / next page
- Category filter
- Invalid cursor & limit
- Empty results
- Duplicate prevention across pages
- **Pagination consistency when 50 products are inserted mid-session**

## Deployment

1. Set `DATABASE_URL`, `NODE_ENV=production`, `PORT`
2. `npm run build`
3. `npx prisma migrate deploy`
4. `node dist/server.js`

Docker image runs migrations on startup (see `Dockerfile`).

## Tradeoffs

| Decision | Benefit | Cost |
|----------|---------|------|
| Cursor pagination | Stable, O(limit) reads | No jump-to-page-N |
| Immutable `created_at` | Stable cursors | Cannot "bump" product to top via timestamp |
| `limit+1` for `hasMore` | No `COUNT(*)` per request | Fetches one extra row |
| Category allowlist | Fast validation + predictable indexes | New categories need code change |
| No auth | Simpler assignment scope | Not production-public as-is |

## Future Improvements

- HMAC-signed cursors
- Read replicas + connection pool tuning
- OpenAPI / Swagger spec
- Prometheus metrics and structured logging
- Soft deletes with tombstone-aware cursors
- Category registry table instead of hardcoded allowlist

## Deployment

Deploy the frontend to **Vercel** and the backend to **Render** (with PostgreSQL + seeded data).

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full step-by-step guide.

## Interview Prep

See [INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md) for talking points.

## AI Usage

See [AI_NOTES.md](AI_NOTES.md).
