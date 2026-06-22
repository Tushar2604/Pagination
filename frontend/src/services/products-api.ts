import { config } from "@lib/config";
import type { ProductListParams, ProductListResponse } from "@models/product";
import { apiGet } from "./http-client";

export async function fetchProducts(
  params: ProductListParams,
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  return apiGet<ProductListResponse>("/api/products", {
    signal,
    params: {
      category: params.category,
      cursor: params.cursor,
      limit: params.limit ?? config.defaultPageSize,
    },
  });
}
