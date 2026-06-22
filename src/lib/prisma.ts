/**
 * Shared Prisma client singleton.
 *
 * What: One PrismaClient instance for the process lifetime.
 * Why: Avoids connection pool exhaustion from per-request clients.
 * How it helps: In dev, hot reload won't spawn duplicate pools thanks to globalThis cache.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
