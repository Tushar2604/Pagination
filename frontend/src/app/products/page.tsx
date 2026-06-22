import { Suspense } from "react";
import { ProductsScreen } from "@features/products/components/products-screen";
import { ProductsCardsSkeleton, ProductsTableSkeleton } from "@features/products/components/products-skeleton";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
          <ProductsTableSkeleton />
          <ProductsCardsSkeleton />
        </div>
      }
    >
      <ProductsScreen />
    </Suspense>
  );
}
