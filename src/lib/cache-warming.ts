import { getRedisClient } from './redis';
import { CACHE_TTL, CACHE_KEYS, cacheProduct, cacheCategory, cacheOrder } from './redis-cache';
import { GRANULAR_CACHE_KEYS, getTimeBasedTTL } from './redis-cache-advanced';

/**
 * Intelligent Cache Warming System
 * Pre-loads frequently accessed data into Redis cache
 * Supports scheduled warming, on-demand warming, and predictive warming
 */

export interface WarmingStrategy {
  name: string;
  priority: number;
  execute: () => Promise<number>;
}

class CacheWarmer {
  private strategies: WarmingStrategy[] = [];
  private isWarming = false;
  private lastWarmTime: Date | null = null;
  private warmingStats = {
    totalWarmed: 0,
    lastDuration: 0,
    lastStrategy: '',
  };

  /**
   * Register warming strategy
   */
  registerStrategy(strategy: WarmingStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute all warming strategies
   */
  async warmAll(): Promise<void> {
    if (this.isWarming) {
      console.log('[Cache Warming] Already in progress, skipping...');
      return;
    }

    this.isWarming = true;
    const startTime = Date.now();
    let totalWarmed = 0;

    console.log('[Cache Warming] Starting cache warming...');

    for (const strategy of this.strategies) {
      try {
        console.log(`[Cache Warming] Executing: ${strategy.name}`);
        const count = await strategy.execute();
        totalWarmed += count;
        console.log(`[Cache Warming] ✅ ${strategy.name}: ${count} items cached`);
      } catch (error) {
        console.error(`[Cache Warming] ❌ ${strategy.name} failed:`, error);
      }
    }

    const duration = Date.now() - startTime;
    this.lastWarmTime = new Date();
    this.warmingStats = {
      totalWarmed,
      lastDuration: duration,
      lastStrategy: 'all',
    };

    console.log(`[Cache Warming] ✅ Complete! ${totalWarmed} items cached in ${duration}ms`);
    this.isWarming = false;
  }

  /**
   * Execute specific strategy
   */
  async warmStrategy(strategyName: string): Promise<number> {
    const strategy = this.strategies.find(s => s.name === strategyName);
    
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyName}`);
    }

    console.log(`[Cache Warming] Executing: ${strategy.name}`);
    const count = await strategy.execute();
    
    this.warmingStats = {
      totalWarmed: count,
      lastDuration: 0,
      lastStrategy: strategyName,
    };

    return count;
  }

  /**
   * Get warming statistics
   */
  getStats() {
    return {
      ...this.warmingStats,
      lastWarmTime: this.lastWarmTime?.toISOString(),
      isWarming: this.isWarming,
      strategiesCount: this.strategies.length,
    };
  }

  /**
   * Check if warming is needed based on time
   */
  shouldWarm(intervalMinutes: number = 60): boolean {
    if (!this.lastWarmTime) return true;
    
    const minutesSinceLastWarm = (Date.now() - this.lastWarmTime.getTime()) / 1000 / 60;
    return minutesSinceLastWarm >= intervalMinutes;
  }
}

// Singleton instance
let cacheWarmer: CacheWarmer | null = null;

export function getCacheWarmer(): CacheWarmer {
  if (!cacheWarmer) {
    cacheWarmer = new CacheWarmer();
    registerDefaultStrategies(cacheWarmer);
  }
  return cacheWarmer;
}

/**
 * Register default warming strategies
 */
function registerDefaultStrategies(warmer: CacheWarmer): void {
  // Strategy 1: Warm featured products (highest priority)
  warmer.registerStrategy({
    name: 'featured-products',
    priority: 100,
    execute: async () => {
      try {
        const { prisma } = await import('./db');
        const redis = getRedisClient();
        const products = await prisma.product.findMany({
          where: { featured: true },
          orderBy: { createdAt: 'desc' },
        });

        let cached = 0;
        for (const product of products) {
          await cacheProduct(product);
          cached++;
        }

        // Cache featured list
        const key = CACHE_KEYS.productList('featured');
        await redis.setex(
          key,
          getTimeBasedTTL(CACHE_TTL.PRODUCT, 'product'),
          JSON.stringify(products)
        );

        return cached + 1;
      } catch (error) {
        console.error('[Cache Warming] featured-products error:', error);
        return 0;
      }
    },
  });

  // Strategy 2: Warm all categories
  warmer.registerStrategy({
    name: 'categories',
    priority: 90,
    execute: async () => {
      try {
        const { prisma } = await import('./db');
        const redis = getRedisClient();
        const categories = await prisma.category.findMany();

        let cached = 0;
        for (const category of categories) {
          await cacheCategory(category);
          cached++;
        }

        // Cache category list
        const key = CACHE_KEYS.categoryList();
        await redis.setex(key, CACHE_TTL.CATEGORY, JSON.stringify(categories));

        return cached + 1;
      } catch (error) {
        console.error('[Cache Warming] categories error:', error);
        return 0;
      }
    },
  });

  // Strategy 3: Warm recent orders
  warmer.registerStrategy({
    name: 'recent-orders',
    priority: 80,
    execute: async () => {
      try {
        const { prisma } = await import('./db');
        const orders = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          include: { items: true },
          take: 50,
        });

        let cached = 0;
        for (const order of orders) {
          await cacheOrder(order);
          cached++;
        }

        return cached;
      } catch (error) {
        console.error('[Cache Warming] recent-orders error:', error);
        return 0;
      }
    },
  });

  // Strategy 4: Warm trending products
  warmer.registerStrategy({
    name: 'trending-products',
    priority: 70,
    execute: async () => {
      try {
        const { prisma } = await import('./db');
        const redis = getRedisClient();
        
        // Get products from recent orders
        const recentOrderItems = await prisma.orderItem.findMany({
          where: {
            order: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
          include: { product: true },
          take: 100,
        });

        // Cache trending products
        const key = GRANULAR_CACHE_KEYS.productTrending(7);
        await redis.setex(key, CACHE_TTL.STATISTICS, JSON.stringify(recentOrderItems));

        return 1;
      } catch (error) {
        console.error('[Cache Warming] trending-products error:', error);
        return 0;
      }
    },
  });

  // Strategy 5: Warm dashboard statistics
  warmer.registerStrategy({
    name: 'dashboard-stats',
    priority: 60,
    execute: async () => {
      try {
        const { prisma } = await import('./db');
        const redis = getRedisClient();
        const periods: Array<'today' | 'week' | 'month'> = ['today', 'week', 'month'];
        
        let cached = 0;
        for (const period of periods) {
          const key = GRANULAR_CACHE_KEYS.dashboardStats(period);
          
          // Calculate stats
          const now = new Date();
          let startDate: Date;
          
          switch (period) {
            case 'today':
              startDate = new Date(now.setHours(0, 0, 0, 0));
              break;
            case 'week':
              startDate = new Date(now.setDate(now.getDate() - 7));
              break;
            case 'month':
              startDate = new Date(now.setMonth(now.getMonth() - 1));
              break;
          }

          const [orders, products, messages] = await Promise.all([
            prisma.order.count({ where: { createdAt: { gte: startDate } } }),
            prisma.product.count(),
            prisma.customerMessage.count({ where: { createdAt: { gte: startDate } } }),
          ]);

          const stats = { orders, products, messages, period };
          await redis.setex(key, CACHE_TTL.STATISTICS, JSON.stringify(stats));
          cached++;
        }

        return cached;
      } catch (error) {
        console.error('[Cache Warming] dashboard-stats error:', error);
        return 0;
      }
    },
  });

  // Strategy 6: Warm active chat sessions
  warmer.registerStrategy({
    name: 'active-chats',
    priority: 50,
    execute: async () => {
      try {
        const { prisma } = await import('./db');
        const redis = getRedisClient();
        const activeSessions = await prisma.activeChatSession.findMany({
          where: {
            OR: [
              { customerConnected: true },
              { adminConnected: true },
            ],
          },
        });

        let cached = 0;
        for (const session of activeSessions) {
          const key = CACHE_KEYS.activeChatSession(session.messageId);
          await redis.setex(key, CACHE_TTL.CHAT_SESSION, JSON.stringify(session));
          cached++;
        }

        return cached;
      } catch (error) {
        console.error('[Cache Warming] active-chats error:', error);
        return 0;
      }
    },
  });

  // Strategy 7: Warm product price ranges (for filters)
  warmer.registerStrategy({
    name: 'product-price-ranges',
    priority: 40,
    execute: async () => {
      try {
        const { prisma } = await import('./db');
        const redis = getRedisClient();
        const priceRanges = [
          { min: 0, max: 50 },
          { min: 50, max: 100 },
          { min: 100, max: 200 },
          { min: 200, max: 500 },
          { min: 500, max: 10000 },
        ];

        let cached = 0;
        for (const range of priceRanges) {
          const products = await prisma.product.findMany({
            where: {
              price: {
                gte: range.min,
                lte: range.max,
              },
            },
          });

          const key = GRANULAR_CACHE_KEYS.productByPrice(range.min, range.max);
          await redis.setex(
            key,
            getTimeBasedTTL(CACHE_TTL.PRODUCT, 'product'),
            JSON.stringify(products)
          );
          cached++;
        }

        return cached;
      } catch (error) {
        console.error('[Cache Warming] product-price-ranges error:', error);
        return 0;
      }
    },
  });
}

/**
 * Predictive cache warming based on time of day
 */
export async function predictiveWarmup(): Promise<void> {
  const hour = new Date().getHours();
  const warmer = getCacheWarmer();

  // Morning rush (8-10 AM): Warm everything
  if (hour >= 8 && hour <= 10) {
    console.log('[Predictive Warming] Morning rush - warming all caches');
    await warmer.warmAll();
  }
  
  // Lunch time (12-2 PM): Warm products and trending
  else if (hour >= 12 && hour <= 14) {
    console.log('[Predictive Warming] Lunch time - warming products');
    await warmer.warmStrategy('featured-products');
    await warmer.warmStrategy('trending-products');
  }
  
  // Evening rush (5-8 PM): Warm products and orders
  else if (hour >= 17 && hour <= 20) {
    console.log('[Predictive Warming] Evening rush - warming products and orders');
    await warmer.warmStrategy('featured-products');
    await warmer.warmStrategy('recent-orders');
  }
  
  // Off-peak: Minimal warming
  else {
    console.log('[Predictive Warming] Off-peak - minimal warming');
    await warmer.warmStrategy('featured-products');
  }
}

/**
 * Schedule automatic cache warming
 */
export function scheduleCacheWarming(intervalMinutes: number = 60): NodeJS.Timer {
  const warmer = getCacheWarmer();
  
  console.log(`[Cache Warming] Scheduling automatic warming every ${intervalMinutes} minutes`);
  
  return setInterval(async () => {
    if (warmer.shouldWarm(intervalMinutes)) {
      console.log('[Cache Warming] Scheduled warming triggered');
      await predictiveWarmup();
    }
  }, intervalMinutes * 60 * 1000);
}

/**
 * Warm cache on demand via API
 */
export async function warmCacheOnDemand(strategy?: string): Promise<{
  success: boolean;
  stats: any;
  message: string;
}> {
  try {
    const warmer = getCacheWarmer();
    
    if (strategy) {
      const count = await warmer.warmStrategy(strategy);
      return {
        success: true,
        stats: warmer.getStats(),
        message: `Warmed ${count} items using strategy: ${strategy}`,
      };
    } else {
      await warmer.warmAll();
      return {
        success: true,
        stats: warmer.getStats(),
        message: 'All warming strategies executed',
      };
    }
  } catch (error) {
    return {
      success: false,
      stats: null,
      message: `Warming failed: ${error}`,
    };
  }
}

export default getCacheWarmer;
