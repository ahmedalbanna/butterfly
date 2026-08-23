
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  image: z.string(),
  quantity: z.number().int().min(1),
});

export type CartItem = z.infer<typeof CartItemSchema>;

const CartArraySchema = z.array(CartItemSchema);

const STORAGE_KEY = 'luxefinds_cart';

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isHydrated: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function safeParseCart(value: string | null): CartItem[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    const result = CartArraySchema.safeParse(parsed);
    if (!result.success) {
      console.warn('Invalid cart data in localStorage, resetting', result.error.flatten());
      return null;
    }
    return result.data;
  } catch (e) {
    console.warn('Failed to parse cart from localStorage', e);
    return null;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedCart = safeParseCart(localStorage.getItem(STORAGE_KEY));
    if (savedCart) {
      setCart(savedCart);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }, [cart, isHydrated]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = safeParseCart(e.newValue);
      if (next) setCart(next);
      else if (e.newValue === null) setCart([]);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, isHydrated }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
