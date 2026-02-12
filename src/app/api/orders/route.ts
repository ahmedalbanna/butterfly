import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/api/middleware/auth-middleware';
import { prisma } from '@/lib/db';

/**
 * GET /api/orders
 * Fetch the current user's orders with pagination
 * Supports: Authorization header (Bearer token) or cookies
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const skip = (page - 1) * limit;

      // Fetch total count
      const total = await prisma.order.count({
        where: { userId: user.userId },
      });

      // Fetch orders
      const orders = await prisma.order.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          total: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('[Orders List]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/orders
 * Create a new order from the shopping cart
 * Supports: Authorization header (Bearer token) or cookies
 * 
 * Body:
 * {
 *   shippingAddress: string (required)
 *   billingAddress: string (required)
 *   customerEmail: string (required)
 *   customerName: string (required)
 *   customerPhone: string (optional)
 *   paymentMethod: string (optional, default: 'credit_card')
 * }
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { 
        shippingAddress, 
        billingAddress,
        customerEmail,
        customerName,
        customerPhone,
        paymentMethod = 'credit_card' 
      } = await request.json();

      // Validate required fields
      if (!shippingAddress) {
        return NextResponse.json(
          { success: false, error: 'Shipping address is required' },
          { status: 400 }
        );
      }

      if (!billingAddress) {
        return NextResponse.json(
          { success: false, error: 'Billing address is required' },
          { status: 400 }
        );
      }

      if (!customerEmail) {
        return NextResponse.json(
          { success: false, error: 'Customer email is required' },
          { status: 400 }
        );
      }

      if (!customerName) {
        return NextResponse.json(
          { success: false, error: 'Customer name is required' },
          { status: 400 }
        );
      }

      // Get user's cart
      const cart = await prisma.cart.findUnique({
        where: { userId: user.userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Cart is empty' },
          { status: 400 }
        );
      }

      // Create order in a transaction
      const order = await prisma.$transaction(async (tx) => {
        // Verify and validate stock for all items
        for (const item of cart.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product || product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.product.name}`);
          }
        }

        // Calculate total
        const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        // Create order
        const newOrder = await tx.order.create({
          data: {
            userId: user.userId,
            status: 'pending',
            total,
            shippingAddress,
            billingAddress,
            customerEmail,
            customerName,
            customerPhone: customerPhone || null,
            paymentMethod,
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        });

        // Reduce stock for each product
        for (const item of cart.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Clear cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return newOrder;
      });

      return NextResponse.json({
        success: true,
        data: order,
      }, { status: 201 });
    } catch (error) {
      console.error('[Order Create]', error);
      
      const message = error instanceof Error ? error.message : 'Failed to create order';
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }
  });
}
