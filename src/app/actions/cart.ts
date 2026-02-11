'use server';

import { prisma } from '@/lib/db';

/**
 * Cart item type for API responses
 */
export type CartItemData = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  productId: string;
};

/**
 * Get user's cart from database
 * Returns cart items with product details
 */
export async function getCartForUser(userId: string): Promise<{
  success: boolean;
  data?: CartItemData[];
  error?: string;
}> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      // No cart exists, return empty cart
      return { success: true, data: [] };
    }

    // Transform cart items to frontend format
    const items: CartItemData[] = cart.items.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      productId: item.product.id,
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error('[getCartForUser]', error);
    return { success: false, error: 'Failed to fetch cart' };
  }
}

/**
 * Add or update item in user's cart
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number
): Promise<{
  success: boolean;
  data?: CartItemData;
  error?: string;
}> {
  try {
    if (!userId || !productId || quantity < 1) {
      return { success: false, error: 'Invalid input parameters' };
    }

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Verify product exists and get details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        stock: true,
      },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Check stock availability
    if (product.stock < quantity) {
      return { success: false, error: `Only ${product.stock} items available` };
    }

    // Upsert cart item (create or update quantity)
    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });

    return {
      success: true,
      data: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: cartItem.quantity,
        productId: product.id,
      },
    };
  } catch (error) {
    console.error('[addToCart]', error);
    return { success: false, error: 'Failed to add item to cart' };
  }
}

/**
 * Remove item from user's cart
 */
export async function removeFromCart(
  userId: string,
  productId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!userId || !productId) {
      return { success: false, error: 'Invalid input parameters' };
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

    await prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[removeFromCart]', error);
    return { success: false, error: 'Failed to remove item from cart' };
  }
}

/**
 * Update quantity of item in user's cart
 */
export async function updateCartQuantity(
  userId: string,
  productId: string,
  quantity: number
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!userId || !productId || quantity < 0) {
      return { success: false, error: 'Invalid input parameters' };
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

    // If quantity is 0, delete the item
    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });
      return { success: true };
    }

    // Verify product exists and check stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.stock < quantity) {
      return { success: false, error: `Only ${product.stock} items available` };
    }

    // Update quantity
    await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      data: { quantity },
    });

    return { success: true };
  } catch (error) {
    console.error('[updateCartQuantity]', error);
    return { success: false, error: 'Failed to update cart item quantity' };
  }
}

/**
 * Clear entire cart for user
 */
export async function clearCart(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return { success: true }; // No cart to clear
    }

    // Delete all cart items (cascade will handle this, but explicit is clearer)
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { success: true };
  } catch (error) {
    console.error('[clearCart]', error);
    return { success: false, error: 'Failed to clear cart' };
  }
}

/**
 * Sync cart from localStorage to database (bulk operation)
 * Used when user logs in or to ensure consistency
 */
export async function syncCart(
  userId: string,
  cartItems: Array<{ id: string; quantity: number }>
): Promise<{
  success: boolean;
  data?: CartItemData[];
  error?: string;
}> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Clear existing items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Add new items
    if (cartItems.length > 0) {
      // Verify all products exist and get their details
      const productIds = cartItems.map(item => item.id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, image: true, stock: true },
      });

      const productMap = new Map(products.map(p => [p.id, p]));

      // Create cart items with validation
      for (const item of cartItems) {
        const product = productMap.get(item.id);
        if (!product) {
          console.warn(`[syncCart] Product not found: ${item.id}`);
          continue;
        }

        if (product.stock < item.quantity) {
          console.warn(`[syncCart] Insufficient stock for ${item.id}: requested ${item.quantity}, available ${product.stock}`);
          continue;
        }

        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.id,
            quantity: item.quantity,
          },
        });
      }
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!updatedCart) {
      return { success: true, data: [] };
    }

    const items: CartItemData[] = updatedCart.items.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      productId: item.product.id,
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error('[syncCart]', error);
    return { success: false, error: 'Failed to sync cart' };
  }
}
