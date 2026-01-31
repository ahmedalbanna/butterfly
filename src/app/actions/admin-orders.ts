'use server';

import { prisma } from '@/lib/db';
import { Order } from '@prisma/client';
import { OrderWithItems } from './orders';

/**
 * Get all orders for admin dashboard
 */
export async function getAllOrders(): Promise<OrderWithItems[]> {
  try {
    const orders = await prisma.order.findMany({
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
    console.error('Error fetching all orders:', error);
    return [];
  }
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(status: string): Promise<OrderWithItems[]> {
  try {
    const orders = await prisma.order.findMany({
      where: { status },
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
    console.error('Error fetching orders by status:', error);
    return [];
  }
}

/**
 * Get order statistics
 */
export async function getOrderStats(): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}> {
  try {
    const [total, pending, confirmed, shipped, delivered, cancelled, revenueResult] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'confirmed' } }),
      prisma.order.count({ where: { status: 'shipped' } }),
      prisma.order.count({ where: { status: 'delivered' } }),
      prisma.order.count({ where: { status: 'cancelled' } }),
      prisma.order.aggregate({
        _sum: {
          total: true
        },
        where: {
          status: {
            notIn: ['cancelled']
          }
        }
      })
    ]);

    return {
      total,
      pending,
      confirmed,
      shipped,
      delivered,
      cancelled,
      totalRevenue: revenueResult._sum.total || 0
    };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0
    };
  }
}

/**
 * Delete an order (admin only)
 */
export async function deleteOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.order.delete({
      where: { id: orderId }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return {
      success: false,
      error: 'Failed to delete order'
    };
  }
}
