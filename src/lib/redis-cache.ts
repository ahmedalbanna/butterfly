import { getRedisClient } from './redis';

/**
 * Redis Cache Manager for PostgreSQL data synchronization
 * Provides a high-speed caching layer with automatic TTL and invalidation
 */

// Cache TTL strategies (in seconds)
export const CACHE_TTL = {
  PRODUCT: 300,        // 5 minutes - products rarely change
  CATEGORY: 600,       // 10 minutes - categories very stable
  ORDER: 30,           // 30 seconds - orders update frequently
  MESSAGE: 10,         // 10 seconds - real-time messaging
  CALL_SESSION: 5,     // 5 seconds - active call state
  CHAT_SESSION: 10,    // 10 seconds - active chat state
  STATISTICS: 60,      // 1 minute - aggregated stats
  USER: 300,           // 5 minutes - user data
  CUSTOM_ORDER: 60,    // 1 minute - custom orders
} as const;

// Cache key patterns
export const CACHE_KEYS = {
  product: (id: string) => `cache:product:${id}`,
  productList: (filter?: string) => `cache:product:list:${filter || 'all'}`,
  productsByCategory: (categoryId: string) => `cache:product:category:${categoryId}`,
  
  category: (id: string) => `cache:category:${id}`,
  categoryList: () => `cache:category:list`,
  
  order: (id: string) => `cache:order:${id}`,
  orderList: (filter?: string) => `cache:order:list:${filter || 'all'}`,
  ordersByUser: (userId: string) => `cache:order:user:${userId}`,
  
  message: (id: string) => `cache:message:${id}`,
  messageList: (filter?: string) => `cache:message:list:${filter || 'all'}`,
  messageReplies: (messageId: string) => `cache:message:replies:${messageId}`,
  
  callSession: (id: string) => `cache:call:${id}`,
  callList: (filter?: string) => `cache:call:list:${filter || 'all'}`,
  callStats: () => `cache:call:stats`,
  
  chatSession: (id: string) => `cache:chat:${id}`,
  activeChatSession: (messageId: string) => `cache:chat:active:${messageId}`,
  
  customOrder: (id: string) => `cache:customorder:${id}`,
  customOrderList: (filter?: string) => `cache:customorder:list:${filter || 'all'}`,
  
  statistics: (type: string) => `cache:stats:${type}`,
} as const;

/**
 * Generic cache operations
 */

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const cached = await redis.get(key);
    
    if (!cached) return null;
    
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error('[Cache] Get error:', error);
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttl: number): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const serialized = JSON.stringify(value);
    
    await redis.setex(key, ttl, serialized);
    
    return true;
  } catch (error) {
    console.error('[Cache] Set error:', error);
    return false;
  }
}

export async function cacheInvalidate(key: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
    
    console.log(`[Cache] Invalidated: ${key}`);
    return true;
  } catch (error) {
    console.error('[Cache] Invalidate error:', error);
    return false;
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<number> {
  try {
    const redis = getRedisClient();
    
    // Find all keys matching pattern
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) return 0;
    
    // Delete all matching keys
    await redis.del(...keys);
    
    console.log(`[Cache] Invalidated ${keys.length} keys matching: ${pattern}`);
    return keys.length;
  } catch (error) {
    console.error('[Cache] Invalidate pattern error:', error);
    return 0;
  }
}

/**
 * Product caching
 */

export async function cacheProduct(product: any): Promise<void> {
  await cacheSet(CACHE_KEYS.product(product.id), product, CACHE_TTL.PRODUCT);
}

export async function getCachedProduct(id: string): Promise<any | null> {
  return await cacheGet(CACHE_KEYS.product(id));
}

export async function invalidateProduct(id: string): Promise<void> {
  await cacheInvalidate(CACHE_KEYS.product(id));
  // Also invalidate related list caches
  await cacheInvalidatePattern('cache:product:list:*');
  await cacheInvalidatePattern('cache:product:category:*');
}

/**
 * Category caching
 */

export async function cacheCategory(category: any): Promise<void> {
  await cacheSet(CACHE_KEYS.category(category.id), category, CACHE_TTL.CATEGORY);
}

export async function getCachedCategory(id: string): Promise<any | null> {
  return await cacheGet(CACHE_KEYS.category(id));
}

export async function invalidateCategory(id: string): Promise<void> {
  await cacheInvalidate(CACHE_KEYS.category(id));
  await cacheInvalidate(CACHE_KEYS.categoryList());
  // Invalidate products in this category
  await cacheInvalidatePattern(`cache:product:category:${id}`);
}

/**
 * Order caching
 */

export async function cacheOrder(order: any): Promise<void> {
  await cacheSet(CACHE_KEYS.order(order.id), order, CACHE_TTL.ORDER);
}

export async function getCachedOrder(id: string): Promise<any | null> {
  return await cacheGet(CACHE_KEYS.order(id));
}

export async function invalidateOrder(id: string): Promise<void> {
  await cacheInvalidate(CACHE_KEYS.order(id));
  // Invalidate list caches
  await cacheInvalidatePattern('cache:order:list:*');
  await cacheInvalidatePattern('cache:order:user:*');
  await cacheInvalidatePattern('cache:stats:*');
}

/**
 * Message caching
 */

export async function cacheMessage(message: any): Promise<void> {
  await cacheSet(CACHE_KEYS.message(message.id), message, CACHE_TTL.MESSAGE);
}

export async function getCachedMessage(id: string): Promise<any | null> {
  return await cacheGet(CACHE_KEYS.message(id));
}

export async function invalidateMessage(id: string): Promise<void> {
  await cacheInvalidate(CACHE_KEYS.message(id));
  await cacheInvalidate(CACHE_KEYS.messageReplies(id));
  await cacheInvalidatePattern('cache:message:list:*');
  await cacheInvalidatePattern('cache:stats:*');
}

/**
 * Message reply caching
 */

export async function cacheMessageReplies(messageId: string, replies: any[]): Promise<void> {
  await cacheSet(CACHE_KEYS.messageReplies(messageId), replies, CACHE_TTL.MESSAGE);
}

export async function getCachedMessageReplies(messageId: string): Promise<any[] | null> {
  return await cacheGet(CACHE_KEYS.messageReplies(messageId));
}

export async function invalidateMessageReplies(messageId: string): Promise<void> {
  await cacheInvalidate(CACHE_KEYS.messageReplies(messageId));
}

/**
 * Call session caching
 */

export async function cacheCallSession(session: any): Promise<void> {
  await cacheSet(CACHE_KEYS.callSession(session.id), session, CACHE_TTL.CALL_SESSION);
}

export async function getCachedCallSession(id: string): Promise<any | null> {
  return await cacheGet(CACHE_KEYS.callSession(id));
}

export async function invalidateCallSession(id: string): Promise<void> {
  await cacheInvalidate(CACHE_KEYS.callSession(id));
  await cacheInvalidatePattern('cache:call:list:*');
  await cacheInvalidate(CACHE_KEYS.callStats());
  await cacheInvalidatePattern('cache:stats:*');
}

/**
 * Chat session caching
 */

export async function cacheActiveChatSession(messageId: string, session: any): Promise<void> {
  await cacheSet(CACHE_KEYS.activeChatSession(messageId), session, CACHE_TTL.CHAT_SESSION);
}

export async function getCachedActiveChatSession(messageId: string): Promise<any | null> {
  return await cacheGet(CACHE_KEYS.activeChatSession(messageId));
}

export async function invalidateActiveChatSession(messageId: string): Promise<void> {
  await cacheInvalidate(CACHE_KEYS.activeChatSession(messageId));
}

/**
 * Custom order caching
 */

export async function cacheCustomOrder(order: any): Promise<void> {
  await cacheSet(CACHE_KEYS.customOrder(order.id), order, CACHE_TTL.CUSTOM_ORDER);
}

export async function getCachedCustomOrder(id: string): Promise<any | null> {
  return await cacheGet(CACHE_KEYS.customOrder(id));
}

export async function invalidateCustomOrder(id: string): Promise<void> {
  await cacheInvalidate(CACHE_KEYS.customOrder(id));
  await cacheInvalidatePattern('cache:customorder:list:*');
}

/**
 * Statistics caching
 */

export async function cacheStatistics(type: string, stats: any): Promise<void> {
  await cacheSet(CACHE_KEYS.statistics(type), stats, CACHE_TTL.STATISTICS);
}

export async function getCachedStatistics(type: string): Promise<any | null> {
  return await cacheGet(CACHE_KEYS.statistics(type));
}

export async function invalidateStatistics(type?: string): Promise<void> {
  if (type) {
    await cacheInvalidate(CACHE_KEYS.statistics(type));
  } else {
    await cacheInvalidatePattern('cache:stats:*');
  }
}

/**
 * Batch operations
 */

export async function cacheMultiple<T>(entries: Array<{ key: string; value: T; ttl: number }>): Promise<void> {
  try {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();
    
    for (const entry of entries) {
      const serialized = JSON.stringify(entry.value);
      pipeline.setex(entry.key, entry.ttl, serialized);
    }
    
    await pipeline.exec();
  } catch (error) {
    console.error('[Cache] Batch set error:', error);
  }
}

export async function getMultiple<T>(keys: string[]): Promise<Array<T | null>> {
  try {
    const redis = getRedisClient();
    const values = await redis.mget(...keys);
    
    return values.map(v => v ? JSON.parse(v) as T : null);
  } catch (error) {
    console.error('[Cache] Batch get error:', error);
    return keys.map(() => null);
  }
}

/**
 * Cache warming - preload frequently accessed data
 */

export async function warmCache(): Promise<void> {
  console.log('[Cache] Warming cache with frequently accessed data...');
  
  try {
    // This will be called by the CDC manager on startup
    // We'll populate it with common queries after implementing CDC listener
    console.log('[Cache] Cache warming complete');
  } catch (error) {
    console.error('[Cache] Cache warming error:', error);
  }
}

/**
 * Clear all cache (use with caution)
 */

export async function clearAllCache(): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys('cache:*');
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache] Cleared ${keys.length} cache entries`);
    }
  } catch (error) {
    console.error('[Cache] Clear all error:', error);
  }
}
