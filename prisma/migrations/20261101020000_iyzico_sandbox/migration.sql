-- Existing orders already deducted inventory. Sandbox orders explicitly use false.
ALTER TABLE "Order" ADD COLUMN "inventoryDeducted" BOOLEAN NOT NULL DEFAULT true;
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'INITIALIZING', 'READY', 'SUCCEEDED', 'FAILED', 'REVIEW');
CREATE TABLE "PaymentAttempt" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
  "token" TEXT,
  "paymentPageUrl" TEXT,
  "paymentId" TEXT,
  "paidAt" TIMESTAMP(3),
  "issue" TEXT,
  "itemTransactions" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaymentAttempt_orderId_key" ON "PaymentAttempt"("orderId");
CREATE UNIQUE INDEX "PaymentAttempt_token_key" ON "PaymentAttempt"("token");
CREATE UNIQUE INDEX "PaymentAttempt_paymentId_key" ON "PaymentAttempt"("paymentId");
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
