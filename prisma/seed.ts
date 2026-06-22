/**
 * High-performance seed script — 200,000 products via batch inserts.
 *
 * What: Generates realistic catalog data and loads it with createMany batches.
 * Why: Assignment requires 200k rows; row-by-row inserts would take minutes.
 * How it helps:
 *   - BATCH_SIZE (default 5000) amortizes round-trips to PostgreSQL.
 *   - Timestamps spread over 2 years preserve realistic newest-first distribution.
 *   - Deterministic RNG option aids reproducible local benchmarks.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PRODUCT_CATEGORIES } from '../src/constants/categories';

const prisma = new PrismaClient();

const TOTAL_PRODUCTS = Number.parseInt(process.env.SEED_COUNT ?? '200000', 10);
const BATCH_SIZE = Number.parseInt(process.env.SEED_BATCH_SIZE ?? '5000', 10);
const SEED = Number.parseInt(process.env.SEED_RANDOM ?? '42', 10);

const ADJECTIVES = [
  'Premium',
  'Essential',
  'Compact',
  'Professional',
  'Eco-Friendly',
  'Wireless',
  'Smart',
  'Classic',
  'Deluxe',
  'Ultra',
];

const NOUNS = [
  'Speaker',
  'Jacket',
  'Lamp',
  'Backpack',
  'Monitor',
  'Sneakers',
  'Blender',
  'Notebook',
  'Helmet',
  'Camera',
  'Desk Chair',
  'Water Bottle',
  'Keyboard',
  'Sunglasses',
  'Cookware Set',
];

/** Simple mulberry32 PRNG for reproducible seeds. */
function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomPrice(rng: () => number): Prisma.Decimal {
  // Log-normal-ish spread: mostly $5–$500 with occasional premium items.
  const base = Math.exp(rng() * 6) + 4.99;
  const cents = Math.round(base * 100) / 100;
  return new Prisma.Decimal(cents.toFixed(2));
}

function randomName(rng: () => number): string {
  const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)]!;
  const noun = NOUNS[Math.floor(rng() * NOUNS.length)]!;
  const sku = Math.floor(rng() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `${adj} ${noun} #${sku}`;
}

function randomCategory(rng: () => number): string {
  return PRODUCT_CATEGORIES[Math.floor(rng() * PRODUCT_CATEGORIES.length)]!;
}

function randomCreatedAt(rng: () => number, index: number, total: number): Date {
  // Spread timestamps across ~730 days; higher index => slightly newer on average
  // so bulk load still has a wide created_at distribution.
  const now = Date.now();
  const twoYearsMs = 730 * 24 * 60 * 60 * 1000;
  const positionBias = (index / total) * 0.3;
  const dayOffset = Math.floor(rng() * 730 * (1 - positionBias));
  const ms = now - dayOffset * 24 * 60 * 60 * 1000 - Math.floor(rng() * 86_400_000);
  return new Date(ms);
}

function buildBatch(
  rng: () => number,
  batchStartIndex: number,
  batchSize: number,
): Prisma.ProductCreateManyInput[] {
  const rows: Prisma.ProductCreateManyInput[] = [];
  for (let i = 0; i < batchSize; i++) {
    const globalIndex = batchStartIndex + i;
    const createdAt = randomCreatedAt(rng, globalIndex, TOTAL_PRODUCTS);
    rows.push({
      id: randomUUID(),
      name: randomName(rng),
      category: randomCategory(rng),
      price: randomPrice(rng),
      createdAt,
      updatedAt: createdAt,
    });
  }
  return rows;
}

async function main() {
  console.log(`Seeding ${TOTAL_PRODUCTS.toLocaleString()} products (batch size ${BATCH_SIZE})...`);
  const started = Date.now();

  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log(`Database already contains ${existing.toLocaleString()} products.`);
    console.log('Set FORCE_SEED=true to truncate and re-seed.');
    if (process.env.FORCE_SEED !== 'true') {
      return;
    }
    console.log('FORCE_SEED=true — truncating products table...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
  }

  const rng = createRng(SEED);
  let inserted = 0;

  for (let offset = 0; offset < TOTAL_PRODUCTS; offset += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - offset);
    const batch = buildBatch(rng, offset, size);
    await prisma.product.createMany({ data: batch, skipDuplicates: true });
    inserted += size;
    if (inserted % 50_000 === 0 || inserted === TOTAL_PRODUCTS) {
      console.log(`  ${inserted.toLocaleString()} / ${TOTAL_PRODUCTS.toLocaleString()}`);
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const count = await prisma.product.count();
  console.log(`Done. ${count.toLocaleString()} products in ${elapsed}s`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
