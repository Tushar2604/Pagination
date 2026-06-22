# AI Usage Notes

This file documents how AI assisted this project and how correctness was verified manually.

## What AI Helped With

- **Scaffolding** — initial folder layout, `package.json`, TypeScript config, Docker files
- **Boilerplate** — Express app factory, error middleware, Zod validation patterns
- **Documentation** — README, performance write-up, interview guide first drafts
- **Test cases** — structuring integration tests for pagination edge cases
- **Seed script** — batch insert pattern and synthetic data generators

## Design Decisions Reviewed Manually

| Decision | Rationale verified |
|----------|---------------------|
| Keyset pagination on `(created_at DESC, id DESC)` | Matches PostgreSQL composite index ordering; avoids OFFSET scan cost |
| UUID `id` as tiebreaker | Guarantees total order when timestamps collide |
| Two composite indexes (global + category) | Query planner can satisfy both filtered and unfiltered paths without sorting |
| `createMany` batches of 5,000 | Balance of memory vs round-trips for 200k seed |
| Immutable `created_at` for cursor position | Updates to name/price must not reorder pages |
| `limit + 1` fetch for `hasMore` | Avoids expensive `COUNT(*)` on large tables |
| Category allowlist in code | Validation at edge; stable enum for Zod + seed |
| No OFFSET anywhere | Assignment explicitly warns against naive pagination |

## Potential Mistakes AI Could Have Introduced

1. **Wrong cursor comparison direction** — Using `>` instead of `<` for DESC order would duplicate/skip rows. Verified against SQL semantics and tests.
2. **Missing `id` tiebreaker** — AI often suggests `ORDER BY created_at DESC` only. Non-unique timestamps break stability.
3. **Encoding cursor as raw timestamp string** — Ambiguous parsing/timezones. We use ISO-8601 inside base64url JSON.
4. **Prisma `cursor` API vs keyset WHERE** — Prisma's cursor pagination uses different semantics; we use explicit `OR` tuple predicate for clarity and index alignment.
5. **Index column order mismatch** — Index must match `ORDER BY` direction. Confirmed `DESC` in migration SQL and Prisma schema.
6. **Seed script row-by-row inserts** — Would be too slow; confirmed `createMany` only.
7. **Over-trusting `updated_at` for sort** — Updates would reshuffle pages; rejected in favor of immutable `created_at`.
8. **Docker `npm ci` without lockfile** — Lockfile generated via `npm install` before image build.

## How Correctness Was Verified

### Automated tests (`npm test`)

- First page ordering (newest first)
- Next page via opaque cursor
- Category filtering
- Invalid cursor / limit rejection
- Empty category results
- **No duplicate IDs** across paginated traversal
- **Insert 50 newer products mid-pagination** — page 2 excludes hot inserts; all original products still reachable

### Manual reasoning

- Walked through insert-during-pagination scenario with concrete `(created_at, id)` tuples
- Confirmed new rows sit "above" cursor in DESC order → excluded from later pages
- Confirmed rows below cursor keep relative order → no misses

### Database-level checks (recommended after seed)

```sql
-- Index usage on list query
EXPLAIN (ANALYZE, BUFFERS) SELECT ... ;

-- Row count
SELECT COUNT(*) FROM products;
```

### Code review focus areas

- `src/services/productService.ts` — cursor predicate matches index
- `src/utils/cursor.ts` — strict decode validation
- `prisma/migrations/.../migration.sql` — index definitions

## Human Ownership Statement

A human reviewer should be able to explain every line in `productService.ts` and defend why OFFSET pagination fails under concurrent writes. AI accelerated delivery; architectural choices above were chosen for interview correctness, not novelty.
