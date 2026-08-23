"use client"

import { useState } from 'react';
import { useCart } from '@/context/cart-context';
import { useVoiceCall } from '@/context/voice-call-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { saveOrder, createOrderFromCart } from '@/lib/orders';
import { track } from '@/lib/analytics';

const checkoutSchema = z.object({
  email: z.string().email('Valid email required'),
  fullName: z.string().min(2, 'Full name required').max(60),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  postalCode: z.string().min(3, 'Postal code required'),
  country: z.string().min(2, 'Country required'),
  cardNumber: z.string().regex(/^\d{16}$/, '16-digit card number'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'MM/YY'),
  cvc: z.string().regex(/^\d{3,4}$/, '3-4 digit CVC'),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, isHydrated } = useCart();
  const { isCalling, startCall } = useVoiceCall();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: '',
      fullName: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      cardNumber: '',
      expiry: '',
      cvc: '',
    },
  });

  const shipping = 0;
  const taxRate = 0.0;
  const tax = Math.round(cartTotal * taxRate);
  const total = cartTotal + shipping + tax;

  const onSubmit = (values: CheckoutValues) => {
    if (cart.length === 0) {
      toast({ title: "Bag empty", description: "Add pieces before checkout.", variant: "destructive" });
      return;
    }
    const order = createOrderFromCart({ email: values.email, items: cart, subtotal: cartTotal });
    saveOrder(order);
    track('purchase', { total: order.total, count: cart.length, orderId: order.id });
    setOrderId(order.id);
    setIsSuccess(true);
    toast({
      title: "Order confirmed",
      description: `Order ${order.id} confirmed. Confirmation sent to ${values.email}.`,
    });
    clearCart();
  };

  if (!isHydrated) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading boutique...</div>;
  }

  if (isSuccess && orderId) {
    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 flex items-center justify-center">
        <div className="max-w-lg w-full text-center space-y-8 border border-white/10 bg-white/5 p-12">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
          <div>
            <h1 className="text-3xl font-headline italic">Thank you</h1>
            <p className="text-primary uppercase tracking-widest text-xs mt-2">Order {orderId} confirmed</p>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">A confirmation has been prepared. Our stylist will contact you shortly. Your exquisite pieces are being curated for shipment.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/shop"><Button className="bg-primary text-white rounded-none uppercase tracking-widest">Continue Shopping</Button></Link>
            <Link href="/"><Button variant="outline" className="border-white/20 text-white rounded-none uppercase tracking-widest">Back to Collection</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-20">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:text-primary gap-2 px-0">
              <ArrowLeft className="w-4 h-4" /> Back to Collection
            </Button>
          </Link>
          <div className="text-left md:text-right">
            <h1 className="text-3xl md:text-5xl font-headline italic">Checkout</h1>
            <p className="text-primary uppercase tracking-widest text-xs mt-2">Secure Luxury Checkout</p>
          </div>
        </header>

        {cart.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10">
            <p className="font-headline text-2xl mb-4">Your bag is empty</p>
            <p className="text-white/60 mb-8">Discover our curated collection.</p>
            <Link href="/shop"><Button className="bg-primary text-white rounded-none uppercase tracking-widest">Browse Boutique</Button></Link>
          </div>
        ) : (
          <main className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Form */}
            <section className="lg:col-span-3 space-y-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white/5 border border-white/10 p-6 md:p-8">
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-widest border-b border-white/10 pb-3 mb-6">Contact & Shipping</h2>
                    <div className="grid gap-4">
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel className="text-white/80 uppercase text-xs tracking-widest">Email</FormLabel><FormControl><Input placeholder="you@example.com" className="bg-black/40 border-white/20 text-white rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel className="text-white/80 uppercase text-xs tracking-widest">Full Name</FormLabel><FormControl><Input placeholder="Alexandra Rose" className="bg-black/40 border-white/20 text-white rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel className="text-white/80 uppercase text-xs tracking-widest">Address</FormLabel><FormControl><Input placeholder="123 Luxury Ave" className="bg-black/40 border-white/20 text-white rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem><FormLabel className="text-white/80 uppercase text-xs tracking-widest">City</FormLabel><FormControl><Input placeholder="Paris" className="bg-black/40 border-white/20 text-white rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="postalCode" render={({ field }) => (
                          <FormItem><FormLabel className="text-white/80 uppercase text-xs tracking-widest">Postal Code</FormLabel><FormControl><Input placeholder="75001" className="bg-black/40 border-white/20 text-white rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem><FormLabel className="text-white/80 uppercase text-xs tracking-widest">Country</FormLabel><FormControl><Input placeholder="France" className="bg-black/40 border-white/20 text-white rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-widest border-b border-white/10 pb-3 mb-6">Payment</h2>
                    <div className="grid gap-4">
                      <FormField control={form.control} name="cardNumber" render={({ field }) => (
                        <FormItem><FormLabel className="text-white/80 uppercase text-xs tracking-widest">Card Number</FormLabel><FormControl><Input placeholder="4242424242424242" maxLength={16} className="bg-black/40 border-white/20 text-white rounded-none tracking-widest" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="expiry" render={({ field }) => (
                          <FormItem><FormLabel className="text-white/80 uppercase text-xs tracking-widest">Expiry (MM/YY)</FormLabel><FormControl><Input placeholder="12/28" className="bg-black/40 border-white/20 text-white rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="cvc" render={({ field }) => (
                          <FormItem><FormLabel className="text-white/80 uppercase text-xs tracking-widest">CVC</FormLabel><FormControl><Input placeholder="123" className="bg-black/40 border-white/20 text-white rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Demo checkout — no real charge. Use test card 4242...</p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 bg-primary hover:bg-white hover:text-primary text-white rounded-none uppercase tracking-widest font-bold transition-all">
                    Pay ${total.toLocaleString()} — Complete Order
                  </Button>
                </form>
              </Form>
            </section>

            {/* Summary */}
            <section className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 md:p-8 space-y-6 h-fit sticky top-6">
                <h2 className="text-lg font-bold uppercase tracking-widest border-b border-white/10 pb-3">Order Summary</h2>
                <div className="space-y-4 max-h-[40vh] overflow-auto pr-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="relative w-16 h-20 bg-white/5 rounded-sm overflow-hidden border border-white/10 shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{item.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-headline text-sm truncate">{item.name}</h3>
                        <p className="text-white/40 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-primary font-bold text-sm">${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs uppercase tracking-widest text-white/60">
                    <span>Subtotal</span><span>${cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs uppercase tracking-widest text-white/60">
                    <span>Shipping</span><span className="text-green-400">Complimentary</span>
                  </div>
                  <div className="flex justify-between text-xs uppercase tracking-widest text-white/60">
                    <span>Tax</span><span>${tax.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between text-xl font-headline font-bold">
                    <span>Total</span><span className="text-primary">${total.toLocaleString()}</span>
                  </div>
                </div>
                {!isCalling && (
                  <Button variant="outline" onClick={() => startCall({ name: cart[0].name, materials: "selected items" })} className="w-full h-11 border-white/20 text-white hover:bg-white/10 rounded-none uppercase tracking-widest text-xs">
                    <Phone className="w-4 h-4 mr-2" /> Request Call Support
                  </Button>
                )}
                <div className="flex items-center justify-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" /> Secure Luxury Checkout
                </div>
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
