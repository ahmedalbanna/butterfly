'use server';

import { prisma } from '@/lib/db';
import { Order, OrderItem } from '@prisma/client';
import { syncUserToDb } from './users';

export type CreateOrderData = {
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  billingAddress: string;
  paymentMethod: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
};

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: {
      id: string;
      name: string;
      image: string;
    };
  })[];
};

/**
 * Create a new order with items, including stock validation and decrementing
 */
export async function createOrder(data: CreateOrderData): Promise<Order | null> {
  try {
    // 1. Ensure the user exists in our CRM/Contacts database
    // Even if it's a guest order, we want them in "Contacts"
    const { user } = await syncUserToDb({
      id: data.userId,
      email: data.customerEmail,
      name: data.customerName
    });

    const finalUserId = user?.id || data.userId;
    const total = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 2. Perform order creation and stock update in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Validate stock for all items first
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true }
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for: ${product?.name || 'Unknown piece'}`);
        }
      }

      // Decrement stock
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // Create the order
      return await tx.order.create({
        data: {
          userId: finalUserId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          total,
          status: 'pending',
          // paymentMethod: data.paymentMethod,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: true
        }
      });
    });

    return result;
  } catch (error) {
    console.error('Error creating order:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get order by ID with items
 */
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
      }
    });

    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Get orders by a list of IDs
 */
export async function getOrdersByIds(orderIds: string[]): Promise<OrderWithItems[]> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds }
      },
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
    console.error('Error fetching orders by IDs:', error);
    return [];
  }
}

/**
 * Get orders by user ID
 */
export async function getOrdersByUserId(userId: string): Promise<OrderWithItems[]> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
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
    console.error('Error fetching user orders:', error);
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<Order | null> {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
  }
}
