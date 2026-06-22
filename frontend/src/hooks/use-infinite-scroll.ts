"use client";

import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  enabled: boolean;
  hasMore: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

export function useInfiniteScroll({
  enabled,
  hasMore,
  isFetching,
  onLoadMore,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !hasMore) return;

    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !isFetching) {
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, hasMore, isFetching, onLoadMore, rootMargin]);

  return sentinelRef;
}
