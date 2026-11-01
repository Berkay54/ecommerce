-- Keep historical deliveries and item names stable without replacing existing models.
ALTER TABLE "Address" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "shippingAddress" JSONB;
ALTER TABLE "OrderItem" ADD COLUMN "productName" TEXT, ADD COLUMN "variantName" TEXT;

CREATE TABLE "AuthRateLimit" (
  "key" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "resetAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);
