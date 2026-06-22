"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { config } from "@lib/config";
import { fetchProducts } from "@services/products-api";
import type { Product, ProductCategory } from "@models/product";

export const productsQueryKey = {
  all: ["products"] as const,
  list: (category?: ProductCategory) => [...productsQueryKey.all, "list", category ?? "all"] as const,
};

export function useProductsQuery(category?: ProductCategory) {
  const query = useInfiniteQuery({
    queryKey: productsQueryKey.list(category),
    queryFn: ({ pageParam, signal }) =>
      fetchProducts(
        {
          category,
          cursor: pageParam,
          limit: config.defaultPageSize,
        },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.nextCursor ?? undefined) : undefined,
    staleTime: 30_000,
  });

  const products = useMemo(() => flattenProducts(query.data?.pages), [query.data?.pages]);

  return {
    ...query,
    products,
    totalLoaded: products.length,
    hasMore: query.hasNextPage ?? false,
  };
}

function flattenProducts(pages: Array<{ data: Product[] }> | undefined): Product[] {
  if (!pages) return [];

  const seen = new Set<string>();
  const result: Product[] = [];

  for (const page of pages) {
    for (const product of page.data) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      result.push(product);
    }
  }

  return result;
}
