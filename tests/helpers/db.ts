/**
 * Test utilities — database helpers and fixtures.
 *
 * What: Shared setup for integration tests against a real PostgreSQL instance.
 * Why: Cursor pagination correctness must be verified with actual SQL behavior.
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PRODUCT_CATEGORIES } from '../../src/constants/categories';

export const prisma = new PrismaClient();

export async function resetProducts(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
}

export interface TestProductInput {
  name: string;
  category: string;
  price: string;
  createdAt: Date;
  id?: string;
}

export async function insertProducts(rows: TestProductInput[]) {
  await prisma.product.createMany({
    data: rows.map((row) => ({
      id: row.id ?? randomUUID(),
      name: row.name,
      category: row.category,
      price: row.price,
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
    })),
  });
}

export function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

export { PRODUCT_CATEGORIES };
