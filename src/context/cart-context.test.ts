import { describe, it, expect } from 'vitest';
import { CartItemSchema } from '@/lib/cart-schema';

describe('CartItemSchema', () => {
  it('validates correct item', () => {
    const result = CartItemSchema.safeParse({ id: 'p1', name: 'Ring', price: 100, image: 'http://img', quantity: 1 });
    expect(result.success).toBe(true);
  });
  it('rejects invalid quantity', () => {
    const result = CartItemSchema.safeParse({ id: 'p1', name: 'Ring', price: 100, image: 'http://img', quantity: 0 });
    expect(result.success).toBe(false);
  });
  it('rejects negative price', () => {
    const result = CartItemSchema.safeParse({ id: 'p1', name: 'Ring', price: -1, image: 'http://img', quantity: 1 });
    expect(result.success).toBe(false);
  });
});
