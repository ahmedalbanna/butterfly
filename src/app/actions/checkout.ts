'use server';

import { createOrder, CreateOrderData } from './orders';
import { z } from 'zod';

// Validation schema for checkout form
export const CheckoutFormSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().min(10, 'Please enter a complete address'),
  billingAddress: z.string().min(10, 'Please enter a complete address'),
  useSameAddress: z.boolean().optional(),
});

export type CheckoutFormData = z.infer<typeof CheckoutFormSchema>;

export type CartItemForOrder = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

/**
 * Process checkout and create order in database
 */
export async function processCheckout(
  formData: CheckoutFormData,
  cartItems: CartItemForOrder[]
): Promise<{
  success: boolean;
  orderId?: string;
  total?: number;
  error?: string;
}> {
  try {
    // Validate form data
    const validatedData = CheckoutFormSchema.parse(formData);

    // Validate cart
    if (!cartItems || cartItems.length === 0) {
      return {
        success: false,
        error: 'Your cart is empty'
      };
    }

    // Prepare order data
    const billingAddress = validatedData.useSameAddress 
      ? validatedData.shippingAddress 
      : validatedData.billingAddress;

    const orderData: CreateOrderData = {
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone,
      shippingAddress: validatedData.shippingAddress,
      billingAddress: billingAddress,
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    // Create order in database
    const order = await createOrder(orderData);

    if (!order) {
      return {
        success: false,
        error: 'Failed to create order. Please try again.'
      };
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      success: true,
      orderId: order.id,
      total: total
    };
  } catch (error) {
    console.error('Checkout error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed'
      };
    }

    return {
      success: false,
      error: 'An error occurred during checkout. Please try again.'
    };
  }
}

/**
 * Get order by ID for confirmation/tracking
 */
export async function getOrderForDisplay(orderId: string) {
  try {
    const { getOrderById } = await import('./orders');
    const order = await getOrderById(orderId);
    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}
