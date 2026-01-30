
"use client"

import { useCart } from '@/context/cart-context';
import { useVoiceCall } from '@/context/voice-call-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, ShieldCheck, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { isCalling, startCall } = useVoiceCall();

  const handleCompleteOrder = () => {
    alert("Thank you for your order! Our representative will call you shortly.");
    clearCart();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:text-primary gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Collection
            </Button>
          </Link>
          <div className="text-right">
            <h1 className="text-3xl md:text-5xl font-headline italic">Your Selection</h1>
            <p className="text-primary uppercase tracking-widest text-xs mt-2">Finalize Purchase</p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <section className="space-y-8">
            <h2 className="text-xl font-bold uppercase tracking-widest border-b border-white/10 pb-4">Order Summary</h2>
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-6 items-center">
                  <div className="relative w-20 h-24 bg-white/5 rounded-sm overflow-hidden border border-white/10">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline text-lg">{item.name}</h3>
                    <p className="text-white/40 text-sm">Qty: {item.quantity}</p>
                    <p className="text-primary font-bold mt-1">${(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="italic opacity-50">Your bag is empty.</p>}
            </div>
          </section>

          <section className="bg-white/5 p-8 border border-white/10 space-y-8 h-fit">
            <div className="space-y-4">
              <div className="flex justify-between text-sm uppercase tracking-widest text-white/60">
                <span>Subtotal</span>
                <span>${cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm uppercase tracking-widest text-white/60">
                <span>Shipping</span>
                <span className="text-green-400">Complimentary</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between text-2xl font-headline font-bold">
                <span>Total</span>
                <span className="text-primary">${cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleCompleteOrder}
                disabled={cart.length === 0}
                className="w-full h-16 bg-primary hover:bg-white hover:text-primary text-white rounded-none uppercase tracking-widest font-bold transition-all duration-500"
              >
                Complete Purchase
              </Button>
              
              {!isCalling && cart.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => startCall({ name: cart[0].name, materials: "selected items" })}
                  className="w-full h-12 border-white/20 text-white hover:bg-white/10 rounded-none uppercase tracking-widest text-xs"
                >
                  <Phone className="w-4 h-4 mr-2" /> Request Call Support
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-white/40 uppercase tracking-widest pt-4">
              <ShieldCheck className="w-3 h-3" /> Secure Luxury Checkout
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
