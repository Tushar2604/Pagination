/**
 * Environment-based configuration.
 *
 * What: Centralizes all runtime settings loaded from process.env.
 * Why: Keeps secrets and tunables out of business logic; enables Docker/prod overrides.
 * How it helps: Pagination limits are validated once here so services stay focused on queries.
 */

import dotenv from 'dotenv';

// override: true ensures project .env wins over stale machine-level DATABASE_URL.
dotenv.config({ override: true });

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePositiveInt(value: string, name: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }
  return parsed;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePositiveInt(process.env.PORT ?? '3000', 'PORT'),
  databaseUrl: requireEnv('DATABASE_URL'),
  pagination: {
    defaultLimit: parsePositiveInt(process.env.DEFAULT_PAGE_LIMIT ?? '20', 'DEFAULT_PAGE_LIMIT'),
    maxLimit: parsePositiveInt(process.env.MAX_PAGE_LIMIT ?? '100', 'MAX_PAGE_LIMIT'),
  },
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export type AppConfig = typeof config;
