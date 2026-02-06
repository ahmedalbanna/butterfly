-- Create CustomOrder table for custom-made accessory orders
CREATE TABLE "CustomOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "description" TEXT NOT NULL,
    "referenceImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "quotedPrice" DOUBLE PRECISION,
    "quoteNotes" TEXT,
    "quotedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "orderId" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE SET NULL,
    CONSTRAINT "CustomOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL
);

-- Create indexes for CustomOrder table
CREATE INDEX "CustomOrder_customerId_idx" ON "CustomOrder"("customerId");
CREATE INDEX "CustomOrder_status_idx" ON "CustomOrder"("status");
CREATE INDEX "CustomOrder_customerEmail_idx" ON "CustomOrder"("customerEmail");
CREATE INDEX "CustomOrder_createdAt_idx" ON "CustomOrder"("createdAt");
