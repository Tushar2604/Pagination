/**
 * Product listing service — core pagination logic.
 *
 * What: Executes keyset (cursor) queries against PostgreSQL via Prisma.
 * Why: Encapsulates the correctness-critical ORDER BY + WHERE tuple logic.
 *
 * Correctness under concurrent inserts/updates:
 * - Sort key is immutable created_at + id (tiebreaker). New rows land at the
 *   "front" (newest) and are excluded from pages whose cursor is older.
 * - Continuing with the same cursor always returns the next slice in sort order,
 *   so items neither duplicate nor shift out of the user's traversal window.
 * - Updates to name/price/category do not change cursor position (created_at, id fixed).
 *
 * Tradeoffs:
 * - Users browsing page 1 won't auto-see brand-new inserts without refreshing;
 *   that is intentional — stable traversal beats flickering/reordering mid-session.
 * - Deleted rows create gaps (acceptable; true "snapshot isolation" needs MVCC cursors).
 * - Jump-to-page-N is not supported (by design for large catalogs).
 *
 * Remaining edge cases:
 * - Clock skew if created_at were client-supplied (we use DB defaults — safe).
 * - Very large limit increases payload size linearly (capped by validation).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { encodeCursor, PaginationCursor } from '../utils/cursor';

export interface ProductDto {
  id: string;
  name: string;
  category: string;
  price: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResult {
  data: ProductDto[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface ListProductsInput {
  category?: string;
  limit: number;
  cursor?: PaginationCursor;
}

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
};

function toDto(row: ProductRow): ProductDto {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price.toFixed(2),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProducts(input: ListProductsInput): Promise<ProductListResult> {
  const { category, limit, cursor } = input;

  // Keyset predicate for DESC sort: rows strictly "older" than the cursor tuple.
  // PostgreSQL compares (created_at, id) lexicographically — matches our index order.
  const cursorFilter: Prisma.ProductWhereInput | undefined = cursor
    ? {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          {
            createdAt: cursor.createdAt,
            id: { lt: cursor.id },
          },
        ],
      }
    : undefined;

  const where: Prisma.ProductWhereInput = {
    ...(category ? { category } : {}),
    ...(cursorFilter ?? {}),
  };

  // Fetch limit + 1 to detect a further page without a separate COUNT query.
  const rows = await prisma.product.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const last = page.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeCursor({ createdAt: last.createdAt, id: last.id })
      : null;

  return {
    data: page.map(toDto),
    pagination: {
      limit,
      nextCursor,
      hasMore,
    },
  };
}
