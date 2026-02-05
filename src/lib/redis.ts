import Redis from 'ioredis';

/**
 * Redis client singleton for WebRTC signaling and caching
 * Used for storing signaling messages and pub/sub notifications
 */

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY error
          return true;
        }
        return false;
      },
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redis.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });
  }

  return redis;
}

/**
 * Create a new Redis client for pub/sub subscriptions
 * Pub/sub requires a dedicated connection
 */
export function createRedisSubscriber(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const subscriber = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  subscriber.on('error', (err) => {
    console.error('[Redis Subscriber] Error:', err);
  });

  return subscriber;
}

/**
 * Close Redis connections (for graceful shutdown)
 */
export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[Redis] Connection closed');
  }
}

/**
 * Call Queue Helper Functions
 */
export async function addToCallQueue(callId: string, metadata: {
  customerId: string;
  customerName: string;
  timestamp: number;
  priority?: number;
}) {
  const redis = getRedisClient();
  
  // Add call to queue (FIFO - right push)
  await redis.rpush('calls:queue', callId);
  
  // Store call metadata
  await redis.hset(`calls:queue:${callId}`, metadata);
  
  // Set 30-minute expiration on metadata
  await redis.expire(`calls:queue:${callId}`, 1800);
  
  console.log(`[Redis Queue] Added call ${callId.slice(0, 8)} to queue`);
}

export async function getNextCallFromQueue() {
  const redis = getRedisClient();
  
  // Get (but don't remove) the first call in queue
  const callId = await redis.lindex('calls:queue', 0);
  
  if (!callId) return null;
  
  // Get call metadata
  const metadata = await redis.hgetall(`calls:queue:${callId}`);
  
  return {
    callId,
    ...metadata,
    timestamp: parseInt(metadata.timestamp),
    priority: parseInt(metadata.priority || '0'),
  };
}

export async function removeFromCallQueue(callId: string) {
  const redis = getRedisClient();
  
  // Remove call from queue
  await redis.lrem('calls:queue', 1, callId);
  
  // Delete metadata
  await redis.del(`calls:queue:${callId}`);
  
  console.log(`[Redis Queue] Removed call ${callId.slice(0, 8)} from queue`);
}

export async function getQueueLength() {
  const redis = getRedisClient();
  return await redis.llen('calls:queue');
}

export async function getQueueCalls(limit: number = 10) {
  const redis = getRedisClient();
  
  // Get call IDs from queue
  const callIds = await redis.lrange('calls:queue', 0, limit - 1);
  
  // Get metadata for each call
  const calls = await Promise.all(
    callIds.map(async (callId) => {
      const metadata = await redis.hgetall(`calls:queue:${callId}`);
      return {
        callId,
        ...metadata,
        timestamp: parseInt(metadata.timestamp),
        priority: parseInt(metadata.priority || '0'),
      };
    })
  );
  
  return calls;
}

/**
 * Admin Presence Helper Functions
 */
export async function setAdminPresence(
  adminId: string,
  status: 'online' | 'away' | 'offline',
  adminName: string,
  activeCall?: string | null
) {
  const redis = getRedisClient();
  
  const presenceData: any = {
    status,
    name: adminName,
    lastSeen: Date.now(),
  };
  
  if (activeCall) {
    presenceData.activeCall = activeCall;
  }
  
  // Store presence data
  await redis.hset(`admin:presence:${adminId}`, presenceData);
  
  // Add to online set if online
  if (status === 'online' || status === 'away') {
    await redis.sadd('admin:online', adminId);
    // Set 60-second expiration on presence (requires heartbeat)
    await redis.expire(`admin:presence:${adminId}`, 60);
  } else {
    await redis.srem('admin:online', adminId);
    await redis.del(`admin:presence:${adminId}`);
  }
}

export async function refreshAdminHeartbeat(adminId: string) {
  const redis = getRedisClient();
  
  // Update lastSeen
  await redis.hset(`admin:presence:${adminId}`, 'lastSeen', Date.now());
  
  // Refresh expiration
  await redis.expire(`admin:presence:${adminId}`, 60);
}

export async function getAdminPresence(adminId: string) {
  const redis = getRedisClient();
  
  const presence = await redis.hgetall(`admin:presence:${adminId}`);
  
  if (!presence || !presence.status) return null;
  
  return {
    status: presence.status as 'online' | 'away' | 'offline',
    name: presence.name,
    lastSeen: parseInt(presence.lastSeen),
    activeCall: presence.activeCall || null,
  };
}

export async function getOnlineAdmins() {
  const redis = getRedisClient();
  
  const adminIds = await redis.smembers('admin:online');
  
  const admins = await Promise.all(
    adminIds.map(async (adminId) => {
      const presence = await getAdminPresence(adminId);
      return presence ? { adminId, ...presence } : null;
    })
  );
  
  return admins.filter((admin) => admin !== null);
}

/**
 * Publish notification to admin channel
 */
export async function publishAdminNotification(event: string, data: any) {
  const redis = getRedisClient();
  
  const message = JSON.stringify({
    event,
    data,
    timestamp: Date.now(),
  });
  
  await redis.publish('admin:notifications', message);
  
  console.log(`[Redis Pub/Sub] Published admin notification: ${event}`);
}

export default getRedisClient;
