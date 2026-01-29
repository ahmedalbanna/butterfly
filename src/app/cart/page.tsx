
"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-headline mb-12 italic">Shopping Bag</h1>

        {cart.length === 0 ? (
          <div className="text-center py-24 space-y-6">
            <p className="text-xl text-secondary">Your bag is currently empty.</p>
            <Link href="/shop">
              <Button className="bg-primary text-white rounded-none px-12 h-14 uppercase tracking-widest font-bold">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-8">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-6 pb-8 border-b">
                  <div className="relative w-24 h-32 md:w-32 md:h-40 bg-muted shrink-0 rounded-sm overflow-hidden">
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg md:text-xl font-headline mb-1">{item.name}</h3>
                        <p className="text-sm text-secondary font-medium">${item.price.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-secondary hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border rounded-none">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-accent disabled:opacity-30"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-accent"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-bold text-primary">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-8 space-y-6 border shadow-sm">
                <h2 className="text-2xl font-headline italic">Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Subtotal ({cartCount} items)</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Shipping</span>
                    <span>Complimentary</span>
                  </div>
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Estimated Tax</span>
                    <span>$0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-headline font-bold">
                    <span>Total</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                </div>
                <Link href="/checkout">
                  <Button className="w-full h-14 bg-primary text-white rounded-none uppercase tracking-widest font-bold hover:bg-primary/90 mt-4">
                    Secure Checkout <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-[10px] text-center text-secondary uppercase tracking-wider">
                  Taxes and shipping calculated at checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
