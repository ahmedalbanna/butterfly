-- Add Event Store table for CDC event replay and event sourcing

CREATE TABLE "CDCEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CDCEvent_pkey" PRIMARY KEY ("id")
);

-- Indexes for efficient querying
CREATE INDEX "CDCEvent_aggregateType_aggregateId_idx" ON "CDCEvent"("aggregateType", "aggregateId");
CREATE INDEX "CDCEvent_aggregateType_aggregateId_version_idx" ON "CDCEvent"("aggregateType", "aggregateId", "version");
CREATE INDEX "CDCEvent_timestamp_idx" ON "CDCEvent"("timestamp");
CREATE INDEX "CDCEvent_eventType_idx" ON "CDCEvent"("eventType");

-- Add constraint for unique version per aggregate
CREATE UNIQUE INDEX "CDCEvent_aggregateType_aggregateId_version_key" ON "CDCEvent"("aggregateType", "aggregateId", "version");

-- Add comments
COMMENT ON TABLE "CDCEvent" IS 'Stores all CDC events for replay, debugging, and event sourcing';
COMMENT ON COLUMN "CDCEvent"."eventType" IS 'Type of event (e.g., ProductCreated, OrderUpdated)';
COMMENT ON COLUMN "CDCEvent"."aggregateType" IS 'Type of aggregate (e.g., Product, Order)';
COMMENT ON COLUMN "CDCEvent"."aggregateId" IS 'ID of the aggregate instance';
COMMENT ON COLUMN "CDCEvent"."operation" IS 'CDC operation: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN "CDCEvent"."payload" IS 'Event data (old and new values)';
COMMENT ON COLUMN "CDCEvent"."metadata" IS 'Additional metadata (user, timestamp, etc.)';
COMMENT ON COLUMN "CDCEvent"."version" IS 'Sequential version number for this aggregate';
