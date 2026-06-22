"use client";

import { Loader2 } from "lucide-react";

interface ProductsPaginationFooterProps {
  isFetchingNextPage: boolean;
  hasMore: boolean;
  totalLoaded: number;
}

export function ProductsPaginationFooter({
  isFetchingNextPage,
  hasMore,
  totalLoaded,
}: ProductsPaginationFooterProps) {
  if (isFetchingNextPage) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        <span>Loading more products...</span>
      </div>
    );
  }

  if (!hasMore && totalLoaded > 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        End of results · {totalLoaded.toLocaleString()} products loaded
      </div>
    );
  }

  return <div className="h-2" aria-hidden />;
}
