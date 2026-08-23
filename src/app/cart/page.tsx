"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, isHydrated } = useCart();

  if (!isHydrated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">Loading boutique bag...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-12 flex-1">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-4xl font-headline">Your Bag</h1>
          <span className="text-sm text-muted-foreground">{cartCount} {cartCount === 1 ? 'piece' : 'pieces'}</span>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20 border border-dashed">
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 opacity-40" />
            </div>
            <h2 className="font-headline text-2xl mb-2">Your boutique bag is empty</h2>
            <p className="text-muted-foreground mb-8">Discover exquisite pieces in our collection.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/shop"><Button className="bg-primary text-white rounded-none uppercase tracking-widest">Browse Boutique</Button></Link>
              <Link href="/"><Button variant="outline" className="rounded-none uppercase tracking-widest">Cinematic Experience</Button></Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 md:gap-6 border bg-card p-4">
                  <Link href={`/product/${item.id}`} className="relative w-24 h-32 bg-muted shrink-0 overflow-hidden block">
                    {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                  </Link>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link href={`/product/${item.id}`} className="font-headline text-lg hover:text-primary">{item.name}</Link>
                        <p className="text-sm font-bold text-primary">${item.price.toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border rounded-sm overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="p-2 hover:bg-muted disabled:opacity-30" aria-label="Decrease quantity"><Minus className="w-3 h-3" /></button>
                        <span className="w-10 text-center text-sm font-mono">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-muted" aria-label="Increase quantity"><Plus className="w-3 h-3" /></button>
                      </div>
                      <p className="font-bold">${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border p-6 md:p-8 space-y-6 sticky top-24">
                <h2 className="font-bold uppercase tracking-widest text-sm border-b pb-3">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${cartTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span className="text-green-600">Complimentary</span></div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">${cartTotal.toLocaleString()}</span></div>
                </div>
                <Link href="/checkout" className="block">
                  <Button className="w-full h-12 bg-primary text-white rounded-none uppercase tracking-widest font-bold">Process Order <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </Link>
                <Link href="/shop" className="block">
                  <Button variant="outline" className="w-full rounded-none uppercase tracking-widest text-xs">Continue Shopping</Button>
                </Link>
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest"><ShieldCheck className="w-3 h-3" /> Secure Checkout</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
