/**
 * Allowed product categories for validation and seeding.
 *
 * What: Fixed allowlist of category slugs.
 * Why: Rejects invalid filter values at the API boundary instead of in SQL.
 * How it helps: Stable index cardinality and predictable query plans per category.
 */

export const PRODUCT_CATEGORIES = [
  'electronics',
  'clothing',
  'home-garden',
  'sports-outdoors',
  'books',
  'toys-games',
  'health-beauty',
  'automotive',
  'grocery',
  'office-supplies',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_SET = new Set<string>(PRODUCT_CATEGORIES);

export function isValidCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORY_SET.has(value);
}
