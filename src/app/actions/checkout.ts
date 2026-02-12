'use server';

import { z } from 'zod';
import { createOrder, CreateOrderData } from './orders';
import { clearCart } from './cart';

// Validation schema for checkout form
const CheckoutFormSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  customerAddress: z.string().min(10, 'Please enter a complete address'),
  paymentMethod: z.enum(['bank_transfer', 'credit_card', 'crypto', 'concierge'], {
    required_error: "Please select a payment method",
  }),
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
 * @param formData - Customer and payment information
 * @param cartItems - Items being purchased
 * @param userId - Optional user ID for authenticated users (to clear their database cart)
 */
export async function processCheckout(
  formData: CheckoutFormData,
  cartItems: CartItemForOrder[],
  userId?: string
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
    const orderData: CreateOrderData = {
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone,
      customerAddress: validatedData.customerAddress,
      paymentMethod: validatedData.paymentMethod,
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

    // Clear cart for authenticated user
    if (userId) {
      const clearResult = await clearCart(userId);
      if (!clearResult.success) {
        console.warn('[processCheckout] Failed to clear cart for user:', userId);
        // Don't fail the checkout if cart clearing fails - order was already created
      }
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      success: true,
      orderId: order.id,
      total: total
    };
  } catch (error) {
    console.error('[processCheckout]', error);
    
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
