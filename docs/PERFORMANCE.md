# Performance Characteristics

This document explains why the product listing API remains fast at 200k+ rows and how it behaves as data grows toward millions of rows.

## Query Shape

Every list request executes a query equivalent to:

```sql
SELECT id, name, category, price, created_at, updated_at
FROM products
WHERE ($category IS NULL OR category = $category)
  AND (
    $cursor IS NULL
    OR created_at < $cursor_created_at
    OR (created_at = $cursor_created_at AND id < $cursor_id)
  )
ORDER BY created_at DESC, id DESC
LIMIT $limit + 1;
```

## Time Complexity

| Approach | Per-request cost as table grows |
|----------|----------------------------------|
| `OFFSET n` | **O(offset + limit)** — PostgreSQL must scan and discard `offset` rows |
| Keyset / cursor (`created_at`, `id`) | **O(limit)** — index seek to cursor position, read next `limit` rows |

With 200,000 products and `limit=20`:

- Page 1 (no cursor): index scan, read ~21 rows → microseconds to low milliseconds.
- Page 5,000 (`OFFSET 100000`): must walk past 100k rows even with an index → noticeably slower and unstable under load.

Cursor pagination cost is **independent of page depth**.

## Index Usage

### `idx_products_created_at_id_desc` on `(created_at DESC, id DESC)`

**Purpose:** Unfiltered newest-first browsing.

**How PostgreSQL uses it:**

1. **First page:** Backward index scan from the newest `(created_at, id)` tuple; stops after `limit+1` entries.
2. **Subsequent pages:** Finds the cursor tuple in the index (or the next older position), continues scanning older tuples.

**Why `id` is included:** `created_at` alone is not unique. Two products can share a timestamp (bulk inserts, `now()` collisions). Without `id`, ordering would be non-deterministic and cursors could skip or duplicate rows.

### `idx_products_category_created_at_id_desc` on `(category, created_at DESC, id DESC)`

**Purpose:** Filtered browsing (`?category=electronics`).

**How PostgreSQL uses it:**

1. Seeks to the `(category, …)` prefix.
2. Scans that category's slice in `created_at DESC, id DESC` order.

**Cardinality:** Ten fixed categories keeps each slice near ~20k rows at 200k total — well within efficient index range scan territory.

## EXPLAIN Expectations (200k rows)

For a typical request you should see:

- `Index Scan` or `Index Only Scan` on one of the composite indexes
- No `Sort` node (sort order comes from the index)
- `Rows Removed by Filter` near zero when category matches index prefix

Run locally after seeding:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at
FROM products
WHERE created_at < '2024-01-15'::timestamptz
   OR (created_at = '2024-01-15'::timestamptz AND id < '550e8400-e29b-41d4-a716-446655440000')
ORDER BY created_at DESC, id DESC
LIMIT 21;
```

## Behavior at Millions of Rows

| Concern | Expected behavior |
|---------|-------------------|
| Deep pagination | Still **O(limit)** per request — core reason we avoid OFFSET |
| Index size | ~50–100 bytes per row per index → a few hundred MB at 5M rows; fits RAM on modest instances |
| Write amplification | Each insert updates two B-tree indexes — acceptable for catalog ingest rates |
| Hot categories | Skewed category distribution still works; one category with millions of rows only affects filtered queries for that category |
| Vacuum / bloat | Standard PostgreSQL maintenance (`autovacuum`) keeps indexes healthy |

## Pagination Under Concurrent Writes

Inserts with **newer** `created_at` appear at the head of the index. A client holding cursor `C` only sees rows **older than `C`**, so:

- New rows never duplicate on later pages.
- Rows that were "next" when the cursor was issued remain next in sort order.

This is **not** a full snapshot isolation guarantee (deletes create gaps; extremely rare `created_at` updates would move rows). For a product catalog where `created_at` is immutable, this matches production expectations.

## Bottlenecks to Watch in Production

1. **Connection pool size** — Prisma default pool; tune for concurrent requests.
2. **Sequential scans** — if indexes are missing, latency jumps to seconds at 200k+ rows.
3. **Over-fetching** — `limit` capped at 100 to bound payload and scan width.
4. **Count queries** — we intentionally omit `SELECT COUNT(*)` for `hasMore`; saves a full index scan per page.

## Future Optimizations (not implemented)

- **Partial indexes** for top categories if traffic is skewed.
- **Read replicas** for read-heavy traffic; writes stay on primary.
- **Cursor signing (HMAC)** to prevent tampering — not required when cursor is opaque and server-validated.
- **Materialized views** only if reporting/analytics need different shapes than OLTP listing.
