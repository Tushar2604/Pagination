import { ProductsCardsSkeleton, ProductsTableSkeleton } from "@features/products/components/products-skeleton";

export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-7 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      </div>
      <ProductsTableSkeleton />
      <ProductsCardsSkeleton />
    </div>
  );
}
