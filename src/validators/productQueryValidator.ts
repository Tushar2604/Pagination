/**
 * Query validation for GET /api/products.
 *
 * What: Zod schema for category, cursor, and limit query parameters.
 * Why: Fail fast on malformed input before hitting the database.
 * How it helps: Enforces limit bounds and category allowlist at the edge.
 */

import { z } from 'zod';
import { config } from '../config';
import { PRODUCT_CATEGORIES } from '../constants/categories';
import { decodeCursor, InvalidCursorError } from '../utils/cursor';
import { ValidationError } from '../errors/AppError';

const categorySchema = z.enum(PRODUCT_CATEGORIES);

export const productListQuerySchema = z.object({
  category: categorySchema.optional(),
  cursor: z.string().min(1).optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return config.pagination.defaultLimit;
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed)) {
        throw new ValidationError('limit must be a positive integer');
      }
      return parsed;
    })
    .pipe(
      z
        .number()
        .int()
        .min(1, 'limit must be at least 1')
        .max(config.pagination.maxLimit, `limit must not exceed ${config.pagination.maxLimit}`),
    ),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export function parseProductListQuery(query: Record<string, unknown>): ProductListQuery & {
  decodedCursor?: ReturnType<typeof decodeCursor>;
} {
  const parsed = productListQuerySchema.safeParse(query);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    throw new ValidationError(message);
  }

  const result: ProductListQuery & { decodedCursor?: ReturnType<typeof decodeCursor> } = {
    ...parsed.data,
  };

  if (parsed.data.cursor) {
    try {
      result.decodedCursor = decodeCursor(parsed.data.cursor);
    } catch (error) {
      if (error instanceof InvalidCursorError) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  return result;
}
