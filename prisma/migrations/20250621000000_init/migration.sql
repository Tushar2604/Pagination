-- Initial migration: products table and pagination indexes.
--
-- idx_products_created_at_id_desc:
--   Supports unfiltered GET /api/products with ORDER BY created_at DESC, id DESC
--   and keyset predicate (created_at, id) < (cursor_created_at, cursor_id).
--   Leading created_at DESC matches sort; id DESC breaks ties deterministically.
--
-- idx_products_category_created_at_id_desc:
--   Same query shape when category = $1 is present. Leading category column
--   narrows the scan; trailing (created_at DESC, id DESC) preserves sort order.

CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_products_created_at_id_desc"
    ON "products" ("created_at" DESC, "id" DESC);

CREATE INDEX "idx_products_category_created_at_id_desc"
    ON "products" ("category", "created_at" DESC, "id" DESC);
