import Redis from 'ioredis';

/**
 * Redis client singleton for WebRTC signaling and caching
 * Supports both single Redis and Redis Sentinel configurations
 */

let redis: Redis | null = null;

/**
 * Detect Redis mode from environment
 */
function getRedisMode(): 'single' | 'sentinel' {
  const mode = process.env.REDIS_MODE || 'single';
  return mode === 'sentinel' ? 'sentinel' : 'single';
}

/**
 * Create Redis client with Sentinel support
 */
function createRedisClient(): Redis {
  const mode = getRedisMode();
  
  if (mode === 'sentinel') {
    // Sentinel mode
    const sentinelHosts = process.env.REDIS_SENTINEL_HOSTS || 'localhost:26379,localhost:26380,localhost:26381';
    const masterName = process.env.REDIS_SENTINEL_MASTER || 'mymaster';
    const password = process.env.REDIS_SENTINEL_PASSWORD;
    
    const sentinels = sentinelHosts.split(',').map(host => {
      const [hostname, port] = host.trim().split(':');
      return { host: hostname, port: parseInt(port) || 26379 };
    });
    
    console.log(`[Redis] Connecting to Sentinel cluster: ${masterName} via ${sentinels.length} sentinels`);
    
    return new Redis({
      sentinels,
      name: masterName,
      password,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      sentinelRetryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });
  } else {
    // Single Redis mode
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    console.log(`[Redis] Connecting to single Redis: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`);
    
    return new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });
  }
}

export function getRedisClient(): Redis {
  if (!redis) {
    redis = createRedisClient();

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redis.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });
    
    redis.on('+switch-master', (masterName, oldHost, oldPort, newHost, newPort) => {
      console.log(`[Redis Sentinel] Master switched from ${oldHost}:${oldPort} to ${newHost}:${newPort}`);
    });
  }

  return redis;
}

/**
 * Create a new Redis client for pub/sub subscriptions
 * Pub/sub requires a dedicated connection
 * Supports both single Redis and Sentinel
 */
export function createRedisSubscriber(): Redis {
  const subscriber = createRedisClient();

  subscriber.on('error', (err) => {
    console.error('[Redis Subscriber] Error:', err);
  });
  
  subscriber.on('+switch-master', (masterName, oldHost, oldPort, newHost, newPort) => {
    console.log(`[Redis Subscriber] Master switched from ${oldHost}:${oldPort} to ${newHost}:${newPort}`);
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
