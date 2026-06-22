"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getErrorMessage } from "@lib/api-error";
import { useDebouncedValue } from "@hooks/use-debounced-value";
import { useInfiniteScroll } from "@hooks/use-infinite-scroll";
import { ProductsMobileCards } from "@features/products/components/products-mobile-cards";
import { ProductsPaginationFooter } from "@features/products/components/products-pagination-footer";
import {
  ProductsCardsSkeleton,
  ProductsTableSkeleton,
} from "@features/products/components/products-skeleton";
import { ProductsErrorState, ProductsEmptyState } from "@features/products/components/products-states";
import { ProductsTable } from "@features/products/components/products-table";
import { ProductsToolbar } from "@features/products/components/products-toolbar";
import { useProductsQuery } from "@features/products/hooks/use-products-query";
import { filterProducts } from "@features/products/utils/filter-products";
import type { ProductCategory } from "@models/product";

export function ProductsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const categoryParam = searchParams.get("category");
  const category = isProductCategory(categoryParam) ? categoryParam : undefined;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const {
    products,
    totalLoaded,
    hasMore,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useProductsQuery(category);

  const filteredProducts = useMemo(
    () => filterProducts(products, debouncedSearch),
    [products, debouncedSearch],
  );

  const isFiltered = Boolean(debouncedSearch.trim());

  const handleCategoryChange = useCallback(
    (nextCategory?: ProductCategory) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextCategory) {
        params.set("category", nextCategory);
      } else {
        params.delete("category");
      }

      startTransition(() => {
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  const handleReset = useCallback(() => {
    setSearch("");
    handleCategoryChange(undefined);
  }, [handleCategoryChange]);

  const sentinelRef = useInfiniteScroll({
    enabled: !isLoading && !isError,
    hasMore,
    isFetching: isFetchingNextPage,
    onLoadMore: () => {
      void fetchNextPage();
    },
  });

  return (
    <div className="space-y-4">
      <ProductsToolbar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={handleCategoryChange}
        totalLoaded={totalLoaded}
        visibleCount={filteredProducts.length}
        isFiltered={isFiltered}
      />

      {isLoading ? (
        <>
          <ProductsTableSkeleton />
          <ProductsCardsSkeleton />
        </>
      ) : null}

      {isError ? (
        <ProductsErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : null}

      {!isLoading && !isError && filteredProducts.length === 0 ? (
        <ProductsEmptyState
          title={isFiltered ? "No matching products" : "No products found"}
          description={
            isFiltered
              ? "Try a different search term or clear filters to see loaded products."
              : "There are no products in this category yet."
          }
          showReset={isFiltered || Boolean(category)}
          onReset={handleReset}
        />
      ) : null}

      {!isLoading && !isError && filteredProducts.length > 0 ? (
        <>
          <ProductsTable products={filteredProducts} />
          <ProductsMobileCards products={filteredProducts} />
          <div ref={sentinelRef} className="h-px w-full" aria-hidden />
          <ProductsPaginationFooter
            isFetchingNextPage={isFetchingNextPage}
            hasMore={hasMore}
            totalLoaded={totalLoaded}
          />
        </>
      ) : null}
    </div>
  );
}

function isProductCategory(value: string | null): value is ProductCategory {
  if (!value) return false;
  return [
    "electronics",
    "clothing",
    "home-garden",
    "sports-outdoors",
    "books",
    "toys-games",
    "health-beauty",
    "automotive",
    "grocery",
    "office-supplies",
  ].includes(value);
}
