import { z } from 'zod';

// Validation schema for checkout form
export const CheckoutFormSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  customerAddress: z.string().min(10, 'Please enter a complete address'),
});