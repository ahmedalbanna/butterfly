
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('luxefinds_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Debounced localStorage save (500ms delay)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('luxefinds_cart', JSON.stringify(cart));
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cart]);

  // Memoized cart operations to prevent re-renders
  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // Memoized computed values
  const cartTotal = useMemo(() => 
    cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(() => 
    cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
