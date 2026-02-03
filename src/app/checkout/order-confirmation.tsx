'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Package, ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';

type OrderConfirmationProps = {
  orderId: string;
  total: number;
  customerEmail?: string;
};

export function OrderConfirmation({
  orderId,
  total,
  customerEmail
}: OrderConfirmationProps) {
  // Save order ID to localStorage so user can see it in home page later
  useEffect(() => {
    if (typeof window !== 'undefined' && orderId) {
      try {
        const key = 'butterfly_orders';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.includes(orderId)) {
          localStorage.setItem(key, JSON.stringify([...existing, orderId]));
        }
      } catch (e) {
        console.error('Failed to save order ID to localStorage', e);
      }
    }
  }, [orderId]);

  return (
    <div className="space-y-12 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <CheckCircle2 className="w-24 h-24 text-primary relative" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-4">
        <h2 className="text-4xl md:text-5xl font-headline">Order Confirmed</h2>
        <p className="text-white/60 text-lg">
          Thank you for your refined selection. Your order has been received.
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-8 space-y-6 max-w-md mx-auto">
        <div>
          <p className="text-white/40 uppercase tracking-widest text-xs mb-2">Order ID</p>
          <p className="font-mono text-2xl font-bold text-primary break-all">{orderId}</p>
        </div>

        <div className="h-px bg-white/10" />

        <div>
          <p className="text-white/40 uppercase tracking-widest text-xs mb-2">Total Amount</p>
          <p className="text-3xl font-bold">
            ${total.toLocaleString()}
          </p>
        </div>

        <div className="h-px bg-white/10" />

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-center gap-3 text-white/80">
            <Mail className="w-4 h-4" />
            <span>Confirmation sent to your email</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-white/80">
            <Package className="w-4 h-4" />
            <span>We are now preparing your order</span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 max-w-md mx-auto">
        <p className="text-sm text-primary">
          💎 <strong>Exquisite Care:</strong> Our team will meticulously prepare your luxury pieces. Expect a shipping notification within 24 hours.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <Link href={`/order/${orderId}`} className="w-full">
          <Button
            variant="outline"
            className="w-full h-12 border-primary text-primary hover:bg-primary hover:text-white rounded-none uppercase tracking-widest font-bold text-sm transition-all duration-300"
          >
            View Order Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>

        <Link href={`/contact?orderId=${orderId}`} className="w-full">
          <Button
            variant="outline"
            className="w-full h-12 border-white/20 text-white/80 hover:border-primary hover:text-primary rounded-none uppercase tracking-widest font-bold text-sm transition-all duration-300"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Need help with this order?
          </Button>
        </Link>

        <Link href="/" className="w-full">
          <Button className="w-full h-12 bg-primary hover:bg-white hover:text-primary text-white rounded-none uppercase tracking-widest font-bold text-sm transition-all duration-300">
            Return to Boutique
          </Button>
        </Link>
      </div>

      {/* Support Info */}
      <p className="text-white/40 text-xs">
        Questions? Reference Order <span className="text-primary font-mono">{orderId.substring(0, 8)}</span>.
        Our team is always here to assist you.
      </p>
    </div>
  );
}
