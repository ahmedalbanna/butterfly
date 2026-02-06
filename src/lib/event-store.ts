import { prisma } from './db';
import { getRedisClient } from './redis';

/**
 * Event Store for CDC Event Replay and Event Sourcing
 * Stores all CDC events for replay, debugging, and audit trail
 * Implements event sourcing patterns for data reconstruction
 */

export interface StoredEvent {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  metadata: any;
  timestamp: Date;
  version: number;
}

export interface EventFilter {
  aggregateType?: string;
  aggregateId?: string;
  eventType?: string;
  operation?: string;
  fromTimestamp?: Date;
  toTimestamp?: Date;
  limit?: number;
}

/**
 * Store CDC event for replay
 */
export async function storeEvent(event: {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  metadata?: any;
}): Promise<string> {
  try {
    // Get current version for this aggregate
    const lastEvent = await prisma.$queryRaw<any[]>`
      SELECT version FROM "CDCEvent"
      WHERE "aggregateType" = ${event.aggregateType}
      AND "aggregateId" = ${event.aggregateId}
      ORDER BY version DESC
      LIMIT 1
    `;

    const version = lastEvent.length > 0 ? lastEvent[0].version + 1 : 1;

    // Store event in database
    const storedEvent = await prisma.cDCEvent.create({
      data: {
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        operation: event.operation,
        payload: event.payload,
        metadata: event.metadata || {},
        version,
      },
    });

    // Also store in Redis for fast access (last 1000 events)
    const redis = getRedisClient();
    const eventKey = `event:${storedEvent.id}`;
    const streamKey = `events:${event.aggregateType}`;
    
    await Promise.all([
      redis.setex(eventKey, 3600 * 24 * 7, JSON.stringify(storedEvent)), // 7 days
      redis.xadd(
        streamKey,
        '*',
        'id', storedEvent.id,
        'eventType', event.eventType,
        'aggregateId', event.aggregateId,
        'operation', event.operation,
        'timestamp', storedEvent.timestamp.toISOString()
      ),
      redis.ltrim(streamKey, -1000, -1), // Keep last 1000 events
    ]);

    console.log(`[Event Store] Stored event: ${event.eventType} for ${event.aggregateType}:${event.aggregateId}`);
    
    return storedEvent.id;
  } catch (error) {
    console.error('[Event Store] Failed to store event:', error);
    throw error;
  }
}

/**
 * Retrieve events by filter
 */
export async function getEvents(filter: EventFilter = {}): Promise<StoredEvent[]> {
  try {
    const where: any = {};
    
    if (filter.aggregateType) where.aggregateType = filter.aggregateType;
    if (filter.aggregateId) where.aggregateId = filter.aggregateId;
    if (filter.eventType) where.eventType = filter.eventType;
    if (filter.operation) where.operation = filter.operation;
    
    if (filter.fromTimestamp || filter.toTimestamp) {
      where.timestamp = {};
      if (filter.fromTimestamp) where.timestamp.gte = filter.fromTimestamp;
      if (filter.toTimestamp) where.timestamp.lte = filter.toTimestamp;
    }

    const events = await prisma.cDCEvent.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: filter.limit || 1000,
    });

    return events as StoredEvent[];
  } catch (error) {
    console.error('[Event Store] Failed to retrieve events:', error);
    return [];
  }
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<StoredEvent | null> {
  try {
    // Try Redis first
    const redis = getRedisClient();
    const cached = await redis.get(`event:${eventId}`);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Fall back to database
    const event = await prisma.cDCEvent.findUnique({
      where: { id: eventId },
    });

    return event as StoredEvent | null;
  } catch (error) {
    console.error('[Event Store] Failed to get event:', error);
    return null;
  }
}

/**
 * Replay events for an aggregate (reconstruct state)
 */
export async function replayEvents(
  aggregateType: string,
  aggregateId: string,
  upToVersion?: number
): Promise<any> {
  try {
    const filter: EventFilter = {
      aggregateType,
      aggregateId,
    };

    const events = await getEvents(filter);
    
    // Filter by version if specified
    const eventsToReplay = upToVersion
      ? events.filter(e => e.version <= upToVersion)
      : events;

    // Reconstruct state by applying events
    let state: any = null;
    
    for (const event of eventsToReplay) {
      state = applyEvent(state, event);
    }

    console.log(`[Event Store] Replayed ${eventsToReplay.length} events for ${aggregateType}:${aggregateId}`);
    
    return state;
  } catch (error) {
    console.error('[Event Store] Failed to replay events:', error);
    return null;
  }
}

/**
 * Apply event to state (event sourcing pattern)
 */
function applyEvent(state: any, event: StoredEvent): any {
  switch (event.operation) {
    case 'INSERT':
      return event.payload.new;
    
    case 'UPDATE':
      return {
        ...state,
        ...event.payload.new,
      };
    
    case 'DELETE':
      return null;
    
    default:
      return state;
  }
}

/**
 * Get aggregate history (all events)
 */
export async function getAggregateHistory(
  aggregateType: string,
  aggregateId: string
): Promise<StoredEvent[]> {
  return await getEvents({ aggregateType, aggregateId });
}

/**
 * Get aggregate at specific point in time
 */
export async function getAggregateSnapshot(
  aggregateType: string,
  aggregateId: string,
  timestamp: Date
): Promise<any> {
  const events = await getEvents({
    aggregateType,
    aggregateId,
    toTimestamp: timestamp,
  });

  let state: any = null;
  
  for (const event of events) {
    state = applyEvent(state, event);
  }

  return state;
}

/**
 * Stream events in real-time
 */
export async function* streamEvents(
  filter: EventFilter = {}
): AsyncGenerator<StoredEvent> {
  const redis = getRedisClient();
  const streamKey = filter.aggregateType 
    ? `events:${filter.aggregateType}` 
    : 'events:all';

  let lastId = '0-0';

  while (true) {
    try {
      const results = await redis.xread(
        'BLOCK', 5000,
        'STREAMS', streamKey, lastId
      );

      if (results && results.length > 0) {
        const [, messages] = results[0];
        
        for (const [id, fields] of messages) {
          lastId = id;
          
          // Parse event from Redis stream
          const eventData: any = {};
          for (let i = 0; i < fields.length; i += 2) {
            eventData[fields[i]] = fields[i + 1];
          }

          // Get full event from store
          const event = await getEventById(eventData.id);
          if (event) {
            yield event;
          }
        }
      }
    } catch (error) {
      console.error('[Event Store] Stream error:', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Prune old events (retention policy)
 */
export async function pruneEvents(olderThan: Date): Promise<number> {
  try {
    const result = await prisma.cDCEvent.deleteMany({
      where: {
        timestamp: {
          lt: olderThan,
        },
      },
    });

    console.log(`[Event Store] Pruned ${result.count} events older than ${olderThan.toISOString()}`);
    
    return result.count;
  } catch (error) {
    console.error('[Event Store] Failed to prune events:', error);
    return 0;
  }
}

/**
 * Get event statistics
 */
export async function getEventStats(): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByAggregate: Record<string, number>;
  oldestEvent: Date | null;
  newestEvent: Date | null;
}> {
  try {
    const [total, byType, byAggregate, oldest, newest] = await Promise.all([
      prisma.cDCEvent.count(),
      
      prisma.cDCEvent.groupBy({
        by: ['eventType'],
        _count: true,
      }),
      
      prisma.cDCEvent.groupBy({
        by: ['aggregateType'],
        _count: true,
      }),
      
      prisma.cDCEvent.findFirst({
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true },
      }),
      
      prisma.cDCEvent.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      }),
    ]);

    const eventsByType: Record<string, number> = {};
    byType.forEach(item => {
      eventsByType[item.eventType] = item._count;
    });

    const eventsByAggregate: Record<string, number> = {};
    byAggregate.forEach(item => {
      eventsByAggregate[item.aggregateType] = item._count;
    });

    return {
      totalEvents: total,
      eventsByType,
      eventsByAggregate,
      oldestEvent: oldest?.timestamp || null,
      newestEvent: newest?.timestamp || null,
    };
  } catch (error) {
    console.error('[Event Store] Failed to get stats:', error);
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsByAggregate: {},
      oldestEvent: null,
      newestEvent: null,
    };
  }
}

export default {
  store: storeEvent,
  get: getEvents,
  getById: getEventById,
  replay: replayEvents,
  getHistory: getAggregateHistory,
  getSnapshot: getAggregateSnapshot,
  stream: streamEvents,
  prune: pruneEvents,
  getStats: getEventStats,
};
