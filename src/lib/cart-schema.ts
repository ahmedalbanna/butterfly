import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  image: z.string(),
  quantity: z.number().int().min(1),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export const CartArraySchema = z.array(CartItemSchema);
