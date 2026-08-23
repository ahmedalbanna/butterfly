import { describe, it, expect, beforeEach } from 'vitest';
import { createOrderFromCart, saveOrder, getOrders } from './orders';

describe('orders', () => {
  beforeEach(() => localStorage.clear());

  it('creates order from cart', () => {
    const order = createOrderFromCart({
      email: 'test@example.com',
      items: [{ id: 'p1', name: 'Ring', price: 100, image: 'http://img', quantity: 2 }],
      subtotal: 200,
    });
    expect(order.id).toMatch(/^LX-/);
    expect(order.total).toBe(200);
    expect(order.status).toBe('confirmed');
    expect(new Date(order.createdAt).toISOString()).toBe(order.createdAt);
  });

  it('persists and retrieves', () => {
    const order = createOrderFromCart({ email: 'a@b.com', items: [], subtotal: 0 });
    saveOrder(order);
    const orders = getOrders();
    expect(orders[0].id).toBe(order.id);
  });
});
