import type { ProductCategory } from "@models/product";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  electronics: "Electronics",
  clothing: "Clothing",
  "home-garden": "Home & Garden",
  "sports-outdoors": "Sports & Outdoors",
  books: "Books",
  "toys-games": "Toys & Games",
  "health-beauty": "Health & Beauty",
  automotive: "Automotive",
  grocery: "Grocery",
  "office-supplies": "Office Supplies",
};

export function formatCategoryLabel(category: ProductCategory | string): string {
  return CATEGORY_LABELS[category as ProductCategory] ?? category.replace(/-/g, " ");
}
