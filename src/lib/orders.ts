import { z } from 'zod';
import { CartItemSchema } from '@/lib/cart-schema';

export const OrderSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  items: z.array(CartItemSchema),
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
  createdAt: z.string(), // ISO
  status: z.enum(['pending', 'confirmed', 'shipped']),
});

export type Order = z.infer<typeof OrderSchema>;

const STORAGE_KEY = 'luxefinds_orders';

export function saveOrder(order: Order) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: Order[] = raw ? JSON.parse(raw) : [];
    list.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
  } catch (e) {
    console.warn('Failed to save order locally', e);
  }
  // TODO: when Firebase configured, also write to Firestore:
  // await addDoc(collection(db, 'orders'), order)
}

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const result = z.array(OrderSchema).safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function createOrderFromCart(input: {
  email: string;
  items: z.infer<typeof CartItemSchema>[];
  subtotal: number;
}): Order {
  const tax = 0;
  const shipping = 0;
  return {
    id: `LX-${Date.now().toString(36).toUpperCase()}`,
    email: input.email,
    items: input.items,
    subtotal: input.subtotal,
    shipping,
    tax,
    total: input.subtotal + shipping + tax,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
  };
}
