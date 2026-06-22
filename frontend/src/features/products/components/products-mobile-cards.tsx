"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useRef } from "react";
import { Badge } from "@components/ui/badge";
import { formatCategoryLabel } from "@lib/category-labels";
import { formatCurrency, formatDateTime } from "@lib/utils";
import type { Product } from "@models/product";

const CARD_HEIGHT = 112;

interface ProductsMobileCardsProps {
  products: Product[];
}

export const ProductsMobileCards = memo(function ProductsMobileCards({
  products,
}: ProductsMobileCardsProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT,
    overscan: 6,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className="md:hidden">
      <div
        ref={parentRef}
        className="h-[min(70vh,680px)] overflow-auto"
        role="region"
        aria-label="Products list"
      >
        <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {items.map((virtualRow) => {
            const product = products[virtualRow.index];
            if (!product) return null;

            return (
              <article
                key={product.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full px-0.5"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="mb-2 rounded-lg border bg-card p-3 shadow-subtle">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {product.name}
                    </h3>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="normal-case">
                      {formatCategoryLabel(product.category)}
                    </Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <div>
                      <dt className="uppercase tracking-wide">Created</dt>
                      <dd className="mt-0.5 tabular-nums text-foreground">
                        {formatDateTime(product.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wide">Updated</dt>
                      <dd className="mt-0.5 tabular-nums text-foreground">
                        {formatDateTime(product.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
});
