"use client";

import { useEffect } from "react";
import { ProductsErrorState } from "@features/products/components/products-states";

interface ProductsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ProductsErrorState
      message={error.message || "An unexpected error occurred while rendering products."}
      onRetry={reset}
    />
  );
}
