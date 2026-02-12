'use server';

import { prisma } from '@/lib/db';
import { Order, OrderItem } from '@prisma/client';
import { syncUserToDb } from './users';
import { 
  getCachedOrder, 
  cacheOrder, 
  invalidateOrder,
  CACHE_TTL 
} from '@/lib/redis-cache';
import { 
  smartCacheGet, 
  GRANULAR_CACHE_KEYS,
  getTimeBasedTTL,
  invalidateRelated,
} from '@/lib/redis-cache-advanced';

/**
 * Type definitions
 */
export type CreateOrderData = {
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress: string;
  paymentMethod: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
};

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: {
      id: string;
      name: string;
      image: string;
    };
  })[];
};

/**
 * ============================================================================
 * CORE ORDER OPERATIONS
 * ============================================================================
 */

/**
 * Create a new order with items, including stock validation and decrementing
 */
export async function createOrder(data: CreateOrderData): Promise<Order | null> {
  try {
    // 1. Ensure the user exists in our CRM/Contacts database
    // Even if it's a guest order, we want them in "Contacts"
    const { user } = await syncUserToDb({
      id: data.userId,
      email: data.customerEmail,
      name: data.customerName
    });

    const finalUserId = user?.id || data.userId;
    const total = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 2. Perform order creation and stock update in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Validate stock for all items first
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true }
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for: ${product?.name || 'Unknown piece'}`);
        }
      }

      // Decrement stock
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // Create the order
      return await tx.order.create({
        data: {
          userId: finalUserId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          total,
          status: 'pending',
          paymentMethod: data.paymentMethod,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: true
        }
      });
    });

    return result;
  } catch (error) {
    console.error('Error creating order:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get order by ID with items (with Redis caching)
 */
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  try {
    // Try cache first
    const cached = await getCachedOrder(orderId);
    
    if (cached) {
      console.log(`[Orders] Cache hit for order ${orderId}`);
      return cached;
    }

    // Cache miss - fetch from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    });

    // Cache the result
    if (order) {
      await cacheOrder(order);
    }

    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Get orders by a list of IDs
 */
export async function getOrdersByIds(orderIds: string[]): Promise<OrderWithItems[]> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return orders;
  } catch (error) {
    console.error('Error fetching orders by IDs:', error);
    return [];
  }
}

/**
 * Get orders by user ID
 */
export async function getOrdersByUserId(userId: string): Promise<OrderWithItems[]> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return orders;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

/**
 * Update order status (invalidates cache)
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<Order | null> {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    // Invalidate cache for this order
    await invalidateOrder(orderId);

    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
  }
}

/**
 * ============================================================================
 * ENHANCED ORDER OPERATIONS (with granular caching)
 * ============================================================================
 */

/**
 * Get orders by status with pagination and granular caching
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

/**
 * Get orders by date range with granular caching
 */
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

/**
 * Get user orders with optional status filter and granular caching
 */
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

/**
 * Get revenue statistics for a given period
 */
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
 * ============================================================================
 * CACHE INVALIDATION
 * ============================================================================
 */

/**
 * Invalidate order caches when order changes
 */
export async function invalidateOrderCaches(orderId?: string): Promise<void> {
  if (orderId) {
    await invalidateOrder(orderId);
  }
  await invalidateRelated('order', orderId);
}
