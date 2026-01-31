-- CreateTable
CREATE TABLE "VoiceCallSession" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "adminId" TEXT,
    "adminName" TEXT,

    CONSTRAINT "VoiceCallSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceCallSession_status_idx" ON "VoiceCallSession"("status");

-- CreateIndex
CREATE INDEX "VoiceCallSession_startedAt_idx" ON "VoiceCallSession"("startedAt");

-- CreateIndex
CREATE INDEX "VoiceCallSession_customerId_idx" ON "VoiceCallSession"("customerId");
