"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useRef } from "react";
import { Badge } from "@components/ui/badge";
import { formatCategoryLabel } from "@lib/category-labels";
import { formatCurrency, formatDateTime } from "@lib/utils";
import type { Product } from "@models/product";

const ROW_HEIGHT = 40;

interface ProductsTableProps {
  products: Product[];
}

export const ProductsTable = memo(function ProductsTable({ products }: ProductsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className="hidden md:block">
      <div className="overflow-hidden rounded-lg border bg-card shadow-subtle">
        <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] border-b bg-muted/70 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
          <div>Product Name</div>
          <div>Category</div>
          <div>Price</div>
          <div>Created</div>
          <div>Updated</div>
        </div>

        <div
          ref={parentRef}
          className="h-[min(68vh,720px)] overflow-auto"
          role="region"
          aria-label="Products table"
          tabIndex={0}
        >
          <div
            className="relative w-full"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {items.map((virtualRow) => {
              const product = products[virtualRow.index];
              if (!product) return null;

              return (
                <div
                  key={product.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="absolute left-0 top-0 grid w-full grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] border-b px-3 text-xs transition-colors hover:bg-muted/50"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="flex items-center truncate pr-3 font-medium text-foreground">
                    {product.name}
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="normal-case">
                      {formatCategoryLabel(product.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center tabular-nums text-foreground">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="flex items-center tabular-nums text-muted-foreground">
                    {formatDateTime(product.createdAt)}
                  </div>
                  <div className="flex items-center tabular-nums text-muted-foreground">
                    {formatDateTime(product.updatedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
