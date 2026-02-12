import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/api/middleware/auth-middleware';
import { prisma } from '@/lib/db';

/**
 * GET /api/orders/:id
 * Fetch a single order with all details
 * Supports: Authorization header (Bearer token) or cookies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      // Check ownership
      if (order.userId !== user.userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('[Order Detail]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch order' },
        { status: 500 }
      );
    }
  });
}
