import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/api/middleware/auth-middleware';
import { prisma } from '@/lib/db';

/**
 * GET /api/cart
 * Fetch the current user's shopping cart
 * Supports: Authorization header (Bearer token) or cookies
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: user.userId },
        select: {
          id: true,
          userId: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                  stock: true,
                },
              },
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!cart) {
        return NextResponse.json({
          success: true,
          data: {
            id: null,
            userId: user.userId,
            items: [],
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error('[Cart Get]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch cart' },
        { status: 500 }
      );
    }
  });
}
