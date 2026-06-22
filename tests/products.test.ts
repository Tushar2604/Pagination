/**
 * Integration tests for GET /api/products.
 *
 * What: Verifies pagination, filtering, validation, and concurrency safety.
 * Why: Keyset pagination correctness is the core assignment requirement.
 *
 * Requires: PostgreSQL running (see docker-compose) and DATABASE_URL set.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import {
  insertProducts,
  minutesAgo,
  prisma,
  PRODUCT_CATEGORIES,
  resetProducts,
} from './helpers/db';

const app = createApp();

interface ProductListResponse {
  data: Array<{ id: string; name: string; category: string }>;
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

async function fetchPage(params: Record<string, string | number> = {}) {
  const res = await request(app).get('/api/products').query(params);
  return res;
}

describe('GET /api/products', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetProducts();
  });

  it('returns the first page newest-first', async () => {
    const t0 = minutesAgo(10);
    const t1 = minutesAgo(5);
    const t2 = minutesAgo(1);

    await insertProducts([
      { name: 'Oldest', category: 'books', price: '10.00', createdAt: t0, id: '00000000-0000-4000-8000-000000000001' },
      { name: 'Middle', category: 'books', price: '20.00', createdAt: t1, id: '00000000-0000-4000-8000-000000000002' },
      { name: 'Newest', category: 'books', price: '30.00', createdAt: t2, id: '00000000-0000-4000-8000-000000000003' },
    ]);

    const res = await fetchPage({ limit: 2 });
    expect(res.status).toBe(200);

    const body = res.body as ProductListResponse;
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.name).toBe('Newest');
    expect(body.data[1]!.name).toBe('Middle');
    expect(body.pagination.hasMore).toBe(true);
    expect(body.pagination.nextCursor).toBeTruthy();
  });

  it('returns the next page using cursor', async () => {
    const base = minutesAgo(30);
    const rows = Array.from({ length: 5 }, (_, i) => ({
      name: `Product ${i}`,
      category: 'electronics',
      price: '9.99',
      createdAt: new Date(base.getTime() + i * 60_000),
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    }));
    await insertProducts(rows);

    const page1 = await fetchPage({ limit: 2 });
    const cursor = (page1.body as ProductListResponse).pagination.nextCursor!;

    const page2 = await fetchPage({ limit: 2, cursor });
    expect(page2.status).toBe(200);

    const body = page2.body as ProductListResponse;
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.name).toBe('Product 2');
    expect(body.data[1]!.name).toBe('Product 1');
  });

  it('filters by category', async () => {
    await insertProducts([
      { name: 'Book A', category: 'books', price: '5.00', createdAt: minutesAgo(1) },
      { name: 'Phone', category: 'electronics', price: '500.00', createdAt: minutesAgo(2) },
    ]);

    const res = await fetchPage({ category: 'books' });
    expect(res.status).toBe(200);

    const body = res.body as ProductListResponse;
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.name).toBe('Book A');
  });

  it('rejects invalid cursor', async () => {
    const res = await fetchPage({ cursor: 'not-a-valid-cursor' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns empty results for unknown category filter with no matches', async () => {
    await insertProducts([
      { name: 'Only Book', category: 'books', price: '5.00', createdAt: minutesAgo(1) },
    ]);

    const res = await fetchPage({ category: 'grocery' });
    expect(res.status).toBe(200);

    const body = res.body as ProductListResponse;
    expect(body.data).toHaveLength(0);
    expect(body.pagination.hasMore).toBe(false);
    expect(body.pagination.nextCursor).toBeNull();
  });

  it('does not return duplicate products across pages', async () => {
    const base = minutesAgo(60);
    const rows = Array.from({ length: 25 }, (_, i) => ({
      name: `Item ${i}`,
      category: 'toys-games',
      price: '12.00',
      createdAt: new Date(base.getTime() + i * 1000),
    }));
    await insertProducts(rows);

    const seen = new Set<string>();
    let cursor: string | undefined;
    let pages = 0;

    while (pages < 10) {
      const res = await fetchPage({ limit: 5, ...(cursor ? { cursor } : {}) });
      expect(res.status).toBe(200);
      const body = res.body as ProductListResponse;

      for (const item of body.data) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }

      if (!body.pagination.hasMore) break;
      cursor = body.pagination.nextCursor ?? undefined;
      pages++;
    }

    expect(seen.size).toBe(25);
  });

  it('remains consistent when new products are inserted during pagination', async () => {
    const anchor = minutesAgo(20);
    const existing = Array.from({ length: 10 }, (_, i) => ({
      name: `Existing ${i}`,
      category: 'clothing',
      price: '25.00',
      createdAt: new Date(anchor.getTime() + i * 1000),
      id: `10000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    }));
    await insertProducts(existing);

    const page1 = await fetchPage({ limit: 3 });
    const page1Body = page1.body as ProductListResponse;
    const page1Ids = page1Body.data.map((p) => p.id);
    const cursor = page1Body.pagination.nextCursor!;

    // Simulate 50 hot new products landing while the user reads page 1.
    const hotInserts = Array.from({ length: 50 }, (_, i) => ({
      name: `Hot ${i}`,
      category: 'clothing',
      price: '99.00',
      createdAt: new Date(minutesAgo(0).getTime() + i),
      id: `20000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    }));
    await insertProducts(hotInserts);

    const page2 = await fetchPage({ limit: 3, cursor });
    const page2Body = page2.body as ProductListResponse;
    const page2Ids = page2Body.data.map((p) => p.id);

    // Page 1 ids must not reappear on page 2.
    for (const id of page2Ids) {
      expect(page1Ids).not.toContain(id);
    }

    // Hot inserts must not appear on page 2 (they are newer than the cursor).
    for (const id of page2Ids) {
      expect(id.startsWith('20000000')).toBe(false);
    }

    // Remaining original items (indices 3–9) must still be reachable without gaps.
    const allIds = [...page1Ids, ...page2Ids];
    let nextCursor: string | undefined = page2Body.pagination.nextCursor ?? undefined;
    while (nextCursor) {
      const next = await fetchPage({ limit: 10, cursor: nextCursor });
      const body = next.body as ProductListResponse;
      allIds.push(...body.data.map((p) => p.id));
      nextCursor = body.pagination.nextCursor ?? undefined;
    }

    const originalIds = existing.map((p) => p.id);
    for (const id of originalIds) {
      expect(allIds).toContain(id);
    }
    expect(new Set(allIds).size).toBe(originalIds.length);
  });

  it('rejects invalid limit and category', async () => {
    const badLimit = await fetchPage({ limit: 0 });
    expect(badLimit.status).toBe(400);

    const badCategory = await fetchPage({ category: 'invalid-category' });
    expect(badCategory.status).toBe(400);
    expect(PRODUCT_CATEGORIES.length).toBeGreaterThan(0);
  });
});
