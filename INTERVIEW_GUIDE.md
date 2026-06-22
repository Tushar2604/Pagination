# Interview Guide

Use this document to explain the solution in a live technical interview or code review.

---

## 1. Why cursor pagination was chosen

**Short answer:** Offset pagination costs O(offset + limit) and breaks when data changes during a session.

**Longer answer:**

- `OFFSET 50000 LIMIT 20` means PostgreSQL walks past 50,000 rows every time — slow at scale.
- If 50 products are inserted while a user pages, offset-based pages **shift**: row 51 might appear on both "old page 3" and "new page 2" (duplicate) or vanish (miss).
- **Keyset (cursor) pagination** stores the last seen sort key `(created_at, id)` and asks for the next rows *older than that tuple*. Cost is O(limit) — constant regardless of depth.

**Analogy:** Offset is like saying "skip 50,000 lines in a book"; cursor is "start after this exact sentence."

---

## 2. Why PostgreSQL was chosen

| Requirement | PostgreSQL fit |
|-------------|----------------|
| 200k+ rows with indexed reads | Mature B-tree indexes, excellent query planner |
| Complex sort + filter | Composite indexes on `(category, created_at, id)` |
| Stable transactions | ACID — inserts visible atomically |
| Production credibility | Industry standard for relational OLTP |
| Prisma support | First-class adapter, migrations, type safety |

Alternatives considered:

- **MongoDB** — flexible but weaker at multi-column sort + keyset patterns unless carefully indexed; less natural for assignment's relational model.
- **MySQL** — viable; PostgreSQL chosen for richer timestamptz and EXPLAIN tooling.
- **SQLite** — fine for demo; not ideal for concurrent write + 200k scale story in interviews.

---

## 3. Why `created_at` + `id`

Sort order must be a **total order** — every pair of rows comparable exactly once.

- `created_at DESC` — business requirement: newest products first.
- `id DESC` (UUID) — **tiebreaker** when two rows share `created_at` (bulk seed, same millisecond).

Without `id`:

- Order among ties is undefined → unstable pages.
- Cursor might skip or repeat rows at timestamp boundaries.

We intentionally do **not** sort by `updated_at` — price/name edits would move products between pages and invalidate cursors.

---

## 4. How duplicates are prevented

**Mechanism:**

```sql
ORDER BY created_at DESC, id DESC
WHERE created_at < $c_at
   OR (created_at = $c_at AND id < $c_id)
LIMIT $limit
```

Each request returns rows strictly **older** than the cursor in the total order.

**During concurrent inserts:**

- New products have newer `(created_at, id)` → they appear *before* the cursor position.
- Page 2+ queries exclude them → **no duplicate** on later pages.
- Products that were "next" when the user finished page 1 are still the next oldest after the cursor → **no miss**.

**Test proof:** `tests/products.test.ts` inserts 50 hot products between page 1 and page 2.

---

## 5. Why offset pagination fails

### Performance failure

Page depth `p` with page size `l` → must scan `p × l` rows.

At page 5000 × 20 = 100,000 rows discarded per request.

### Correctness failure under writes

Imagine products sorted newest-first: `[A, B, C, D, E, ...]`

1. User loads page 1 (`LIMIT 2`) → sees A, B. Offset = 0.
2. Insert X, Y at top → `[X, Y, A, B, C, D, E, ...]`
3. User loads page 2 with `OFFSET 2` → sees **A, B** again (duplicates).

Or with deletes, rows disappear from the result set (misses).

Offset assumes the dataset is **frozen** between requests — false in production.

---

## 6. Database indexing decisions

### Index 1: `(created_at DESC, id DESC)`

- Serves unfiltered catalog browsing.
- Index order matches `ORDER BY` → no sort step.
- Cursor predicate is an index range scan from the cursor tuple downward.

### Index 2: `(category, created_at DESC, id DESC)`

- Leading `category` column for `WHERE category = $1`.
- Remaining columns preserve newest-first within category.

### What we did NOT add

- Index on `name` — no search requirement.
- Single-column `created_at` index — insufficient for tiebreaker seek.
- `COUNT(*)` covering index — we avoid total counts per page.

**Interview tip:** Mention **index-column order must match query filter + sort prefix**.

---

## 7. Scaling considerations

### Current scale (200k rows)

- Single PostgreSQL instance is plenty.
- Sub-10ms list queries with warm cache.

### Millions of rows

- Cursor pagination still O(limit) — **primary win**.
- Indexes grow (~100MB+); ensure `shared_buffers` and SSD.
- Consider **read replicas** for geographic read traffic.
- **Connection pooling** (PgBouncer) if many app instances.

### Write-heavy catalog

- Batch inserts (seed pattern) for bulk ingest.
- Two indexes per insert = small write amplification — acceptable for catalog CRUD.

### Hot keys

- If one category dominates traffic, composite index still works — scans that category's B-tree subtree only.

### Caching

- CDN/API cache for page 1 only (short TTL).
- Do **not** cache deep pages globally — cursors are per-user traversal state.

---

## 8. Likely follow-up questions

**Q: Can users jump to page 50?**  
A: Not with cursor pagination. Would need offset (bad) or stored rank (expensive). Real apps use infinite scroll / "Load more".

**Q: What if a product is deleted mid-pagination?**  
A: User may see a gap. Full snapshot isolation needs versioning or cursor snapshots — out of scope.

**Q: Sign cursors?**  
A: Optional HMAC to prevent tampering. We validate shape + UUID; malicious cursors just return empty or 400.

**Q: Why Express over Nest/Fastify?**  
A: Assignment specified Express; architecture (layers) would transfer unchanged.

**Q: How would you add full-text search?**  
A: Postgres `tsvector` + GIN index, or Elasticsearch for fuzzy search — separate from cursor listing or combined with restrictive filters.

---

## 9. One-minute elevator pitch

> "We list 200k products newest-first using keyset pagination on `(created_at, id)` with composite indexes that match the sort order. That gives O(limit) reads instead of O(offset), and when new products land while someone is browsing, they don't duplicate or skip rows because the cursor marks an exact position in a stable total order. PostgreSQL, Prisma, batch-seeded data, Docker, and integration tests that simulate 50 concurrent inserts prove the invariant."
