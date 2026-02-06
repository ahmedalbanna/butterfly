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

// Type for custom orders
export interface CustomOrder {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  referenceImages: string[];
  quotedPrice?: number;
  quoteNotes?: string;
  status: 'pending' | 'quoted' | 'approved' | 'in_production' | 'completed' | 'cancelled';
  createdAt: Date;
  quotedAt?: Date;
  approvedAt?: Date;
  completedAt?: Date;
}

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

/**
 * Create a new custom order with images
 */
export async function createCustomOrder(formData: FormData): Promise<{
  success: boolean;
  customOrderId?: string;
  error?: string;
}> {
  try {
    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const customerPhone = formData.get('customerPhone') as string;
    const description = formData.get('description') as string;
    const customerId = formData.get('customerId') as string;
    const images = formData.getAll('images') as File[];

    if (!customerName || !customerEmail || !description) {
      return {
        success: false,
        error: 'Missing required fields'
      };
    }

    if (images.length === 0) {
      return {
        success: false,
        error: 'At least one image is required'
      };
    }

    // Convert images to base64 or URLs (in production, upload to cloud storage)
    const referenceImages: string[] = [];
    for (const image of images) {
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      referenceImages.push(`data:${image.type};base64,${base64}`);
    }

    // Create custom order in database
    const customOrder = await prisma.customOrder.create({
      data: {
        customerId: customerId || undefined,
        customerName,
        customerEmail,
        customerPhone: customerPhone || undefined,
        description,
        referenceImages,
        status: 'pending'
      }
    });

    return {
      success: true,
      customOrderId: customOrder.id
    };
  } catch (error) {
    console.error('Error creating custom order:', error);
    return {
      success: false,
      error: 'Failed to create custom order'
    };
  }
}

/**
 * Get a custom order by ID
 */
export async function getCustomOrderById(id: string): Promise<CustomOrder | null> {
  try {
    const customOrder = await prisma.customOrder.findUnique({
      where: { id }
    });
    return customOrder as CustomOrder | null;
  } catch (error) {
    console.error('Error fetching custom order:', error);
    return null;
  }
}

/**
 * Get all custom orders for admin
 */
export async function getCustomOrdersForAdmin(): Promise<{
  success: boolean;
  customOrders?: CustomOrder[];
  error?: string;
}> {
  try {
    const customOrders = await prisma.customOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return {
      success: true,
      customOrders: customOrders as CustomOrder[]
    };
  } catch (error) {
    console.error('Error fetching custom orders for admin:', error);
    return {
      success: false,
      error: 'Failed to fetch custom orders'
    };
  }
}

/**
 * Update custom order quote
 */
export async function updateCustomOrderQuote(
  id: string,
  quotedPrice: number,
  quoteNotes?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.customOrder.update({
      where: { id },
      data: {
        quotedPrice,
        quoteNotes: quoteNotes || undefined,
        status: 'quoted',
        quotedAt: new Date()
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating custom order quote:', error);
    return {
      success: false,
      error: 'Failed to update quote'
    };
  }
}

/**
 * Update custom order status
 */
export async function updateCustomOrderStatus(
  id: string,
  status: 'pending' | 'quoted' | 'approved' | 'in_production' | 'completed' | 'cancelled'
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const updateData: any = { status };
    
    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    await prisma.customOrder.update({
      where: { id },
      data: updateData
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating custom order status:', error);
    return {
      success: false,
      error: 'Failed to update status'
    };
  }
}

/**
 * Approve a custom order
 */
export async function approveCustomOrder(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.customOrder.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date()
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Error approving custom order:', error);
    return {
      success: false,
      error: 'Failed to approve custom order'
    };
  }
}
