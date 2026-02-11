import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Middleware to verify admin access
 */
async function verifyAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  return user?.isAdmin === true;
}

/**
 * GET /api/admin/analytics
 * Fetch dashboard analytics data for admin
 * 
 * Returns:
 * - Order statistics (total, by status)
 * - Revenue statistics (total, today, this week, this month)
 * - Recent orders (last 10)
 * - Low stock products (stock < 10)
 * - Product statistics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const isAdmin = await verifyAdmin(user.userId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - admin access required' },
        { status: 403 }
      );
    }

    // Get date boundaries for revenue calculations
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel data fetching for performance
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      recentOrders,
      lowStockProducts,
      totalProducts,
      outOfStockProducts,
    ] = await Promise.all([
      // Order counts
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'processing' } }),
      prisma.order.count({ where: { status: 'shipped' } }),
      prisma.order.count({ where: { status: 'delivered' } }),
      prisma.order.count({ where: { status: 'cancelled' } }),

      // Revenue calculations
      prisma.order.aggregate({
        where: { status: { not: 'cancelled' } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          status: { not: 'cancelled' },
          createdAt: { gte: todayStart },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          status: { not: 'cancelled' },
          createdAt: { gte: weekStart },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          status: { not: 'cancelled' },
          createdAt: { gte: monthStart },
        },
        _sum: { total: true },
      }),

      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
            },
          },
        },
      }),

      // Low stock products
      prisma.product.findMany({
        where: {
          stock: { lt: 10 },
        },
        orderBy: { stock: 'asc' },
        take: 20,
        select: {
          id: true,
          name: true,
          stock: true,
          price: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Product statistics
      prisma.product.count(),
      prisma.product.count({ where: { stock: 0 } }),
    ]);

    // Build response
    const analytics = {
      orders: {
        total: totalOrders,
        byStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        today: todayRevenue._sum.total || 0,
        thisWeek: weekRevenue._sum.total || 0,
        thisMonth: monthRevenue._sum.total || 0,
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        customer: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        },
        itemCount: order.items.length,
      })),
      lowStockProducts: lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        price: product.price,
        categoryName: product.category.name,
        suggestedRestock: Math.max(20, 10 - product.stock), // Suggest restocking to at least 20
      })),
      products: {
        total: totalProducts,
        outOfStock: outOfStockProducts,
        lowStock: lowStockProducts.length,
      },
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[Admin Analytics]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
