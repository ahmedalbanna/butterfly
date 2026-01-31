'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Package, ArrowRight } from 'lucide-react';

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
          Thank you for your exquisite selection. Your order has been received.
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-8 space-y-6 max-w-md mx-auto">
        <div>
          <p className="text-white/40 uppercase tracking-widest text-xs mb-2">Order Number</p>
          <p className="font-mono text-2xl font-bold text-primary break-all">{orderId}</p>
        </div>

        <div className="h-px bg-white/10" />

        <div>
          <p className="text-white/40 uppercase tracking-widest text-xs mb-2">Order Total</p>
          <p className="text-3xl font-bold">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            <span>We'll prepare your items for shipment</span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 max-w-md mx-auto">
        <p className="text-sm text-blue-300">
          💎 <strong>Premium Care:</strong> Our team will prepare your luxurious items with meticulous attention to detail. You can expect a shipping confirmation within 24 hours.
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

        <Link href="/" className="w-full">
          <Button className="w-full h-12 bg-primary hover:bg-white hover:text-primary text-white rounded-none uppercase tracking-widest font-bold text-sm transition-all duration-300">
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Support Info */}
      <p className="text-white/40 text-xs">
        Have questions? Your order number is <span className="text-primary font-mono">{orderId.substring(0, 8)}</span> for reference. 
        Contact our concierge for any assistance.
      </p>
    </div>
  );
}
