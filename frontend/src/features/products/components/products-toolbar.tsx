"use client";

import { Search, X } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";
import { formatCategoryLabel } from "@lib/category-labels";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@models/product";

interface ProductsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category?: ProductCategory;
  onCategoryChange: (category?: ProductCategory) => void;
  totalLoaded: number;
  visibleCount: number;
  isFiltered: boolean;
}

export function ProductsToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  totalLoaded,
  visibleCount,
  isFiltered,
}: ProductsToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Products</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isFiltered
              ? `${visibleCount.toLocaleString()} matching of ${totalLoaded.toLocaleString()} loaded`
              : `${totalLoaded.toLocaleString()} products loaded`}
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search loaded products..."
            className="pl-7 pr-8"
            aria-label="Search products"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Product categories">
        <CategoryPill
          active={!category}
          label="All"
          onClick={() => onCategoryChange(undefined)}
        />
        {PRODUCT_CATEGORIES.map((value) => (
          <CategoryPill
            key={value}
            active={category === value}
            label={formatCategoryLabel(value)}
            onClick={() => onCategoryChange(value)}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryPillProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function CategoryPill({ active, label, onClick }: CategoryPillProps) {
  return (
    <Button
      type="button"
      role="tab"
      aria-selected={active}
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-7 rounded-full px-2.5 text-[11px] font-medium normal-case tracking-normal",
        !active && "bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Button>
  );
}
