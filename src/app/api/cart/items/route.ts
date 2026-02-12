import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/api/middleware/auth-middleware';
import { prisma } from '@/lib/db';

/**
 * POST /api/cart/items
 * Add an item to the shopping cart
 * Supports: Authorization header (Bearer token) or cookies
 * 
 * Body:
 * {
 *   productId: string
 *   quantity: number
 * }
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { productId, quantity } = await request.json();

      if (!productId || !quantity || quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'Invalid productId or quantity' },
          { status: 400 }
        );
      }

      // Verify product exists and has stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, stock: true, price: true, name: true },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          { success: false, error: `Only ${product.stock} items in stock` },
          { status: 400 }
        );
      }

      // Get or create cart
      let cart = await prisma.cart.findUnique({
        where: { userId: user.userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId: user.userId,
          },
        });
      }

      // Check if item already in cart
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          return NextResponse.json(
            { success: false, error: `Only ${product.stock} items in stock` },
            { status: 400 }
          );
        }

        const updatedItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
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
      } else {
        // Create new item
        const newItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
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
          data: newItem,
        });
      }
    } catch (error) {
      console.error('[Cart Add Item]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to add item to cart' },
        { status: 500 }
      );
    }
  });
}
