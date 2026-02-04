'use server';

import { prisma } from '@/lib/db';

/**
 * Get all customers with their order summary and contact info
 */
export async function getAllContacts() {
  try {
    // We fetch all users from the PostgreSQL table.
    // Every registered user and guest buyer is now mirrored here.
    const users = await prisma.user.findMany({
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to include calculated stats
    const contacts = users.map(user => {
      const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0);
      const lastOrder = user.orders.length > 0 ? user.orders[0] : null;
      
      return {
        id: user.id,
        name: user.name || 'Anonymous Collector',
        email: user.email,
        totalOrders: user.orders.length,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt || null,
        memberSince: user.createdAt,
      };
    });

    return { success: true, contacts };
  } catch (error) {
    console.error('[Admin Contacts] Error:', error);
    return { success: false, error: 'Failed to fetch boutique contacts' };
  }
}

/**
 * Get contact statistics for the dashboard
 */
export async function getContactStats() {
  try {
    const [totalUsers, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    const revenueResult = await prisma.order.aggregate({
      _avg: {
        total: true
      }
    });

    return {
      success: true,
      stats: {
        totalContacts: totalUsers,
        newThisMonth: recentUsers,
        averageLTV: Math.round(revenueResult._avg.total || 0),
      }
    };
  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return { success: false, error: 'Failed to fetch contact statistics' };
  }
}
