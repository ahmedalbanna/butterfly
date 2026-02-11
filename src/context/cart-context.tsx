
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getCartForUser, addToCart as dbAddToCart, removeFromCart as dbRemoveFromCart, updateCartQuantity as dbUpdateCartQuantity, clearCart as dbClearCart, syncCart as dbSyncCart } from '@/app/actions/cart';

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
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get user ID from auth API and listen for login events
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const { user } = await response.json();
          setUserId(user?.id || null);
        }
      } catch (err) {
        console.error('Failed to check auth:', err);
        setUserId(null);
      }
    };

    checkAuth();

    // Listen for login events to refresh cart
    const handleUserLoggedIn = (event: CustomEvent) => {
      const newUserId = (event as CustomEvent).detail?.userId;
      if (newUserId) {
        setUserId(newUserId);
      }
    };

    window.addEventListener('user-logged-in', handleUserLoggedIn as EventListener);

    return () => {
      window.removeEventListener('user-logged-in', handleUserLoggedIn as EventListener);
    };
  }, []);

  // Load cart on mount and when userId changes
  useEffect(() => {
    const loadCart = async () => {
      try {
        setIsLoading(true);

        if (userId) {
          // Authenticated user: load from database
          const result = await getCartForUser(userId);
          if (result.success && result.data) {
            setCart(result.data);
          } else {
            // Fallback to localStorage if database fails
            const savedCart = localStorage.getItem('luxefinds_cart');
            if (savedCart) {
              setCart(JSON.parse(savedCart));
            }
          }
        } else {
          // Guest user: load from localStorage
          const savedCart = localStorage.getItem('luxefinds_cart');
          if (savedCart) {
            setCart(JSON.parse(savedCart));
          }
        }
      } catch (err) {
        console.error('Error loading cart:', err);
        // Fallback to localStorage
        const savedCart = localStorage.getItem('luxefinds_cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [userId]);

  // Save cart to localStorage or database (debounced)
  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        if (userId) {
          // Authenticated user: sync to database
          const cartForSync = cart.map(item => ({ id: item.id, quantity: item.quantity }));
          const result = await dbSyncCart(userId, cartForSync);
          
          if (!result.success) {
            // If database sync fails, save to localStorage as backup
            localStorage.setItem('luxefinds_cart', JSON.stringify(cart));
          }
        } else {
          // Guest user: save to localStorage only
          localStorage.setItem('luxefinds_cart', JSON.stringify(cart));
        }
      } catch (err) {
        console.error('Error syncing cart:', err);
        // Fallback to localStorage
        localStorage.setItem('luxefinds_cart', JSON.stringify(cart));
      }
    }, 500);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [cart, userId]);

  // Memoized cart operations to prevent re-renders
  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    // Also sync to database if authenticated
    if (userId) {
      dbAddToCart(userId, item.id, 1).catch(err => {
        console.error('Failed to add to database cart:', err);
      });
    }
  }, [userId]);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));

    // Also sync to database if authenticated
    if (userId) {
      dbRemoveFromCart(userId, id).catch(err => {
        console.error('Failed to remove from database cart:', err);
      });
    }
  }, [userId]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 0) return;
    
    if (quantity === 0) {
      removeFromCart(id);
      return;
    }

    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));

    // Also sync to database if authenticated
    if (userId) {
      dbUpdateCartQuantity(userId, id, quantity).catch(err => {
        console.error('Failed to update database cart quantity:', err);
      });
    }
  }, [userId, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);

    // Also sync to database if authenticated
    if (userId) {
      dbClearCart(userId).catch(err => {
        console.error('Failed to clear database cart:', err);
      });
    }
  }, [userId]);

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
    cartCount,
    isLoading
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, isLoading]);

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
