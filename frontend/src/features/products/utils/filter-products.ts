import type { Product } from "@models/product";

export function filterProducts(products: Product[], query: string): Product[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return products;

  return products.filter((product) => {
    const haystack = `${product.name} ${product.category} ${product.price}`.toLowerCase();
    return haystack.includes(normalized);
  });
}
