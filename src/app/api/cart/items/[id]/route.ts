import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/api/middleware/auth-middleware';
import { prisma } from '@/lib/db';

/**
 * PUT /api/cart/items/:id
 * Update a cart item's quantity
 * Supports: Authorization header (Bearer token) or cookies
 * 
 * Body:
 * {
 *   quantity: number
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;
      const { quantity } = await request.json();

      if (!quantity || quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'Invalid quantity' },
          { status: 400 }
        );
      }

      const cartItem = await prisma.cartItem.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!cartItem) {
        return NextResponse.json(
          { success: false, error: 'Cart item not found' },
          { status: 404 }
        );
      }

      const cart = await prisma.cart.findUnique({
        where: { id: cartItem.cartId },
      });

      if (cart?.userId !== user.userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      if (cartItem.product.stock < quantity) {
        return NextResponse.json(
          { success: false, error: `Only ${cartItem.product.stock} items in stock` },
          { status: 400 }
        );
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id },
        data: { quantity },
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
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedItem,
      });
    } catch (error) {
      console.error('[Cart Update Item]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update cart item' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/cart/items/:id
 * Remove an item from the shopping cart
 * Supports: Authorization header (Bearer token) or cookies
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;

      const cartItem = await prisma.cartItem.findUnique({
        where: { id },
        include: { cart: true },
      });

      if (!cartItem) {
        return NextResponse.json(
          { success: false, error: 'Cart item not found' },
          { status: 404 }
        );
      }

      if (cartItem.cart.userId !== user.userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      await prisma.cartItem.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
      });
    } catch (error) {
      console.error('[Cart Delete Item]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to remove item from cart' },
        { status: 500 }
      );
    }
  });
}
