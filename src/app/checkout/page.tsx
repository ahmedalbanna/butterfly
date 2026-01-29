
"use client"

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cartTotal, clearCart } = useCart();
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      clearCart();
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center text-center space-y-6">
          <CheckCircle2 className="w-20 h-20 text-primary animate-in zoom-in duration-500" />
          <div className="space-y-2">
            <h1 className="text-4xl font-headline">Order Confirmed</h1>
            <p className="text-secondary max-w-md mx-auto">
              Your order has been successfully placed. We've sent a confirmation email to your inbox.
            </p>
          </div>
          <p className="text-sm font-bold text-primary tracking-widest">ORDER #LX-9948210</p>
          <Link href="/shop">
            <Button variant="outline" className="rounded-none border-primary text-primary hover:bg-primary/5 px-8">
              CONTINUE SHOPPING
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <header className="flex justify-between items-end">
            <Link href="/cart" className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Return to bag
            </Link>
            <h1 className="text-3xl font-headline italic">Checkout</h1>
          </header>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-headline border-b pb-2">Shipping Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fname">First Name</Label>
                    <Input id="fname" required className="rounded-none bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lname">Last Name</Label>
                    <Input id="lname" required className="rounded-none bg-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" required className="rounded-none bg-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" required className="rounded-none bg-white" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-headline border-b pb-2">Payment Details</h2>
                <div className="bg-muted p-4 flex items-center justify-between rounded-sm border mb-4">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Secure Payment Gateway
                  </span>
                  <div className="flex gap-2">
                    <div className="w-8 h-5 bg-secondary/20 rounded" />
                    <div className="w-8 h-5 bg-secondary/20 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card">Card Number</Label>
                  <Input id="card" placeholder="0000 0000 0000 0000" required className="rounded-none bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" required className="rounded-none bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" required className="rounded-none bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 space-y-6 border shadow-sm">
                <h2 className="text-2xl font-headline italic">Your Order</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Subtotal</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Shipping</span>
                    <span>Complimentary</span>
                  </div>
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-xl font-headline font-bold pt-4 border-t">
                    <span>Total</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || cartTotal === 0}
                  className="w-full h-14 bg-primary text-white rounded-none uppercase tracking-widest font-bold hover:bg-primary/90"
                >
                  {loading ? "Processing..." : `Pay $${cartTotal.toLocaleString()}`}
                </Button>
              </div>
              
              <div className="flex items-start gap-4 text-xs text-secondary leading-relaxed px-4">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <p>Your transaction is secure and encrypted. We do not store your full payment details on our servers.</p>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
