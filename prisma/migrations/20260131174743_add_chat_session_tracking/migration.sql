-- AlterTable
ALTER TABLE "CustomerMessage" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'form';

-- CreateTable
CREATE TABLE "ActiveChatSession" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "customerConnected" BOOLEAN NOT NULL DEFAULT false,
    "adminConnected" BOOLEAN NOT NULL DEFAULT false,
    "adminName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveChatSession_messageId_key" ON "ActiveChatSession"("messageId");

-- CreateIndex
CREATE INDEX "ActiveChatSession_customerConnected_idx" ON "ActiveChatSession"("customerConnected");

-- CreateIndex
CREATE INDEX "ActiveChatSession_adminConnected_idx" ON "ActiveChatSession"("adminConnected");

-- CreateIndex
CREATE INDEX "ActiveChatSession_lastActivity_idx" ON "ActiveChatSession"("lastActivity");

-- CreateIndex
CREATE INDEX "CustomerMessage_type_idx" ON "CustomerMessage"("type");

-- CreateIndex
CREATE INDEX "CustomerMessage_isActive_idx" ON "CustomerMessage"("isActive");

-- AddForeignKey
ALTER TABLE "ActiveChatSession" ADD CONSTRAINT "ActiveChatSession_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CustomerMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
