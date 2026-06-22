export const PRODUCT_CATEGORIES = [
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
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface ProductListParams {
  category?: ProductCategory;
  cursor?: string;
  limit?: number;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
}
