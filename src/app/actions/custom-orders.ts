'use server';

import { prisma } from '@/lib/db';
import { Order } from '@prisma/client';
import { 
  smartCacheGet, 
  GRANULAR_CACHE_KEYS,
  getTimeBasedTTL,
  invalidateRelated,
} from '@/lib/redis-cache-advanced';
import { CACHE_TTL } from '@/lib/redis-cache';

/**
 * Enhanced order actions with granular caching
 */

export async function getOrdersByStatus(
  status: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const key = GRANULAR_CACHE_KEYS.orderByStatus(status, page);
  const ttl = getTimeBasedTTL(CACHE_TTL.ORDER, 'order');
  
  return await smartCacheGet(
    key,
    async () => {
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { status },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where: { status } }),
      ]);

      return {
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    },
    ttl
  );
}

export async function getOrdersByDateRange(
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const key = GRANULAR_CACHE_KEYS.orderByDateRange(
    startDate.toISOString(),
    endDate.toISOString()
  );
  const ttl = CACHE_TTL.ORDER;
  
  return await smartCacheGet(
    key,
    async () => {
      return await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },
    ttl
  );
}

export async function getUserOrders(
  userId: string,
  status?: string
): Promise<Order[]> {
  const key = GRANULAR_CACHE_KEYS.orderByUser(userId, status);
  const ttl = getTimeBasedTTL(CACHE_TTL.ORDER, 'order');
  
  return await smartCacheGet(
    key,
    async () => {
      return await prisma.order.findMany({
        where: {
          userId,
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
      });
    },
    ttl
  );
}

export async function getRevenueStats(
  period: 'today' | 'week' | 'month'
): Promise<{
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}> {
  const key = GRANULAR_CACHE_KEYS.orderRevenue(period);
  const ttl = CACHE_TTL.STATISTICS;
  
  return await smartCacheGet(
    key,
    async () => {
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

      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { notIn: ['cancelled', 'refunded'] },
        },
      });

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const orderCount = orders.length;
      const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

      return {
        totalRevenue,
        orderCount,
        averageOrderValue,
      };
    },
    ttl
  );
}

/**
 * Invalidate order caches when order changes
 */
export async function invalidateOrderCaches(orderId?: string): Promise<void> {
  await invalidateRelated('order', orderId);
}
