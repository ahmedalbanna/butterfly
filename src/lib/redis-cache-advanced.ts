import { getRedisClient } from './redis';
import { CACHE_TTL, CACHE_KEYS } from './redis-cache';

/**
 * Advanced Redis Cache Features
 * - Dynamic TTL based on access patterns
 * - Adaptive caching strategies
 * - Cache warming
 * - Performance tracking
 */

interface CacheAccessPattern {
  key: string;
  hits: number;
  misses: number;
  lastAccess: number;
  ttl: number;
}

class AdvancedCacheManager {
  private accessPatterns = new Map<string, CacheAccessPattern>();
  private metricsEnabled = true;

  /**
   * Calculate adaptive TTL based on access patterns
   */
  calculateAdaptiveTTL(key: string, baseTTL: number): number {
    const pattern = this.accessPatterns.get(key);
    
    if (!pattern) {
      return baseTTL;
    }

    const hitRate = pattern.hits / (pattern.hits + pattern.misses);
    const timeSinceLastAccess = Date.now() - pattern.lastAccess;
    const accessFrequency = pattern.hits / (timeSinceLastAccess / 1000 / 60); // accesses per minute

    // High hit rate and frequent access = longer TTL
    if (hitRate > 0.8 && accessFrequency > 10) {
      return baseTTL * 2; // Double TTL for hot data
    }
    
    // Medium hit rate = normal TTL
    if (hitRate > 0.5 && accessFrequency > 1) {
      return baseTTL;
    }
    
    // Low hit rate or infrequent access = shorter TTL
    if (hitRate < 0.3 || accessFrequency < 0.1) {
      return Math.max(baseTTL / 2, 30); // Half TTL, minimum 30 seconds
    }

    return baseTTL;
  }

  /**
   * Record cache access for pattern analysis
   */
  recordAccess(key: string, hit: boolean): void {
    if (!this.metricsEnabled) return;

    const pattern = this.accessPatterns.get(key) || {
      key,
      hits: 0,
      misses: 0,
      lastAccess: Date.now(),
      ttl: 0,
    };

    if (hit) {
      pattern.hits++;
    } else {
      pattern.misses++;
    }
    pattern.lastAccess = Date.now();

    this.accessPatterns.set(key, pattern);

    // Cleanup old patterns (keep last 1000)
    if (this.accessPatterns.size > 1000) {
      const sorted = Array.from(this.accessPatterns.entries())
        .sort((a, b) => b[1].lastAccess - a[1].lastAccess)
        .slice(0, 1000);
      this.accessPatterns = new Map(sorted);
    }
  }

  /**
   * Get cache statistics for a key pattern
   */
  getPatternStats(keyPrefix: string): {
    totalKeys: number;
    avgHitRate: number;
    totalHits: number;
    totalMisses: number;
  } {
    const patterns = Array.from(this.accessPatterns.values())
      .filter(p => p.key.startsWith(keyPrefix));

    if (patterns.length === 0) {
      return { totalKeys: 0, avgHitRate: 0, totalHits: 0, totalMisses: 0 };
    }

    const totalHits = patterns.reduce((sum, p) => sum + p.hits, 0);
    const totalMisses = patterns.reduce((sum, p) => sum + p.misses, 0);
    const avgHitRate = totalHits / (totalHits + totalMisses);

    return {
      totalKeys: patterns.length,
      avgHitRate: isNaN(avgHitRate) ? 0 : avgHitRate,
      totalHits,
      totalMisses,
    };
  }

  /**
   * Get top N most accessed keys
   */
  getHotKeys(limit: number = 10): Array<{ key: string; hits: number; hitRate: number }> {
    return Array.from(this.accessPatterns.values())
      .map(p => ({
        key: p.key,
        hits: p.hits,
        hitRate: p.hits / (p.hits + p.misses),
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }

  /**
   * Export access patterns for analysis
   */
  exportPatterns(): CacheAccessPattern[] {
    return Array.from(this.accessPatterns.values());
  }
}

// Singleton instance
let advancedCacheManager: AdvancedCacheManager | null = null;

export function getAdvancedCacheManager(): AdvancedCacheManager {
  if (!advancedCacheManager) {
    advancedCacheManager = new AdvancedCacheManager();
  }
  return advancedCacheManager;
}

/**
 * Smart cache get with adaptive TTL and metrics
 */
export async function smartCacheGet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  baseTTL: number
): Promise<T> {
  const manager = getAdvancedCacheManager();
  
  try {
    const redis = getRedisClient();
    const cached = await redis.get(key);

    if (cached) {
      manager.recordAccess(key, true);
      return JSON.parse(cached) as T;
    }

    // Cache miss
    manager.recordAccess(key, false);

    // Fetch fresh data
    const data = await fetchFn();

    // Calculate adaptive TTL
    const ttl = manager.calculateAdaptiveTTL(key, baseTTL);

    // Cache with adaptive TTL
    await redis.setex(key, ttl, JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('[Smart Cache] Error:', error);
    // Fallback to direct fetch
    return await fetchFn();
  }
}

/**
 * Time-based TTL adjustments for predictable patterns
 */
export function getTimeBasedTTL(baseTTL: number, context: 'product' | 'order' | 'message'): number {
  const hour = new Date().getHours();
  
  // Peak hours: 9am - 9pm (shorter TTL for fresher data)
  const isPeakHours = hour >= 9 && hour <= 21;
  
  // Off-peak hours: longer TTL to reduce database load
  const isOffPeak = hour >= 0 && hour <= 6;

  switch (context) {
    case 'product':
      // Products change less frequently, can have longer TTL off-peak
      return isOffPeak ? baseTTL * 2 : baseTTL;
    
    case 'order':
      // Orders need fresher data during peak hours
      return isPeakHours ? Math.max(baseTTL / 2, 15) : baseTTL;
    
    case 'message':
      // Messages always need short TTL during business hours
      return isPeakHours ? baseTTL : baseTTL * 1.5;
    
    default:
      return baseTTL;
  }
}

/**
 * Granular cache key generators
 */
export const GRANULAR_CACHE_KEYS = {
  // Product keys with filters
  productByPrice: (minPrice: number, maxPrice: number) => 
    `cache:product:price:${minPrice}-${maxPrice}`,
  
  productByFeatured: (featured: boolean, limit?: number) =>
    `cache:product:featured:${featured}:${limit || 'all'}`,
  
  productSearch: (query: string, page: number = 1) =>
    `cache:product:search:${query.toLowerCase()}:page:${page}`,
  
  productTrending: (days: number = 7) =>
    `cache:product:trending:${days}days`,
  
  // Order keys with filters
  orderByStatus: (status: string, page: number = 1) =>
    `cache:order:status:${status}:page:${page}`,
  
  orderByDateRange: (startDate: string, endDate: string) =>
    `cache:order:daterange:${startDate}:${endDate}`,
  
  orderByUser: (userId: string, status?: string) =>
    `cache:order:user:${userId}:${status || 'all'}`,
  
  orderRevenue: (period: 'today' | 'week' | 'month') =>
    `cache:order:revenue:${period}`,
  
  // Message keys
  messageByStatus: (status: string, page: number = 1) =>
    `cache:message:status:${status}:page:${page}`,
  
  messageUnread: (adminId?: string) =>
    `cache:message:unread:${adminId || 'all'}`,
  
  messageByCustomer: (customerId: string) =>
    `cache:message:customer:${customerId}`,
  
  // Call session keys
  callsByDateRange: (startDate: string, endDate: string) =>
    `cache:call:daterange:${startDate}:${endDate}`,
  
  callsByStatus: (status: string) =>
    `cache:call:status:${status}`,
  
  callRecordings: (callId: string) =>
    `cache:call:recording:${callId}`,
  
  // Analytics keys
  dashboardStats: (period: 'today' | 'week' | 'month') =>
    `cache:analytics:dashboard:${period}`,
  
  userActivity: (userId: string, period: 'day' | 'week') =>
    `cache:analytics:user:${userId}:${period}`,
  
  conversionRate: (period: 'day' | 'week' | 'month') =>
    `cache:analytics:conversion:${period}`,
};

/**
 * Bulk invalidation patterns
 */
export async function invalidateByPattern(pattern: string): Promise<number> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) return 0;
    
    await redis.del(...keys);
    console.log(`[Cache] Invalidated ${keys.length} keys matching: ${pattern}`);
    
    return keys.length;
  } catch (error) {
    console.error('[Cache] Invalidation error:', error);
    return 0;
  }
}

/**
 * Invalidate related cache hierarchies
 */
export async function invalidateRelated(context: 'product' | 'order' | 'message', id?: string): Promise<void> {
  const patterns: string[] = [];
  
  switch (context) {
    case 'product':
      patterns.push(
        'cache:product:list:*',
        'cache:product:price:*',
        'cache:product:search:*',
        'cache:product:trending:*',
        'cache:product:featured:*',
        'cache:analytics:dashboard:*'
      );
      if (id) {
        patterns.push(`cache:product:${id}`);
      }
      break;
    
    case 'order':
      patterns.push(
        'cache:order:list:*',
        'cache:order:status:*',
        'cache:order:daterange:*',
        'cache:order:revenue:*',
        'cache:analytics:*'
      );
      if (id) {
        patterns.push(`cache:order:${id}`);
      }
      break;
    
    case 'message':
      patterns.push(
        'cache:message:list:*',
        'cache:message:status:*',
        'cache:message:unread:*'
      );
      if (id) {
        patterns.push(`cache:message:${id}`);
      }
      break;
  }
  
  for (const pattern of patterns) {
    await invalidateByPattern(pattern);
  }
}

export default getAdvancedCacheManager;
