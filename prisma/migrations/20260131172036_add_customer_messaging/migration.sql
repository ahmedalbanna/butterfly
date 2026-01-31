-- CreateTable
CREATE TABLE "CustomerMessage" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "orderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReply" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerMessage_status_idx" ON "CustomerMessage"("status");

-- CreateIndex
CREATE INDEX "CustomerMessage_priority_idx" ON "CustomerMessage"("priority");

-- CreateIndex
CREATE INDEX "CustomerMessage_orderId_idx" ON "CustomerMessage"("orderId");

-- CreateIndex
CREATE INDEX "CustomerMessage_createdAt_idx" ON "CustomerMessage"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerMessage_customerEmail_idx" ON "CustomerMessage"("customerEmail");

-- CreateIndex
CREATE INDEX "MessageReply_messageId_idx" ON "MessageReply"("messageId");

-- CreateIndex
CREATE INDEX "MessageReply_createdAt_idx" ON "MessageReply"("createdAt");

-- AddForeignKey
ALTER TABLE "CustomerMessage" ADD CONSTRAINT "CustomerMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReply" ADD CONSTRAINT "MessageReply_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CustomerMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
