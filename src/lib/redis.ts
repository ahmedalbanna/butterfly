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

export default getRedisClient;
