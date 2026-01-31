'use client';

import { useState } from 'react';
import { processCheckout, CheckoutFormData, CartItemForOrder } from '@/app/actions/checkout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

type CheckoutFormProps = {
  cartItems: CartItemForOrder[];
  cartTotal: number;
  onOrderComplete: (orderId: string, total: number) => void;
};

export function CheckoutForm({ cartItems, cartTotal, onOrderComplete }: CheckoutFormProps) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    billingAddress: '',
    useSameAddress: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await processCheckout(formData, cartItems);

      if (result.success && result.orderId && result.total !== undefined) {
        onOrderComplete(result.orderId, result.total);
      } else {
        setError(result.error || 'Failed to process order');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-semibold">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="text-sm uppercase tracking-widest font-bold text-primary">
          Your Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
              Full Name *
            </label>
            <Input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
              disabled={isLoading}
              className="bg-white/5 border-white/10 text-white rounded-none"
            />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
              Email *
            </label>
            <Input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              placeholder="jane@example.com"
              required
              disabled={isLoading}
              className="bg-white/5 border-white/10 text-white rounded-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
            Phone Number
          </label>
          <Input
            type="tel"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            disabled={isLoading}
            className="bg-white/5 border-white/10 text-white rounded-none"
          />
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <h3 className="text-sm uppercase tracking-widest font-bold text-primary">
          Shipping Address
        </h3>
        
        <Textarea
          name="shippingAddress"
          value={formData.shippingAddress}
          onChange={handleChange}
          placeholder="Street address, city, state, ZIP code"
          required
          disabled={isLoading}
          rows={4}
          className="bg-white/5 border-white/10 text-white rounded-none resize-none"
        />
      </div>

      {/* Billing Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="useSameAddress"
            name="useSameAddress"
            checked={formData.useSameAddress}
            onCheckedChange={(checked) =>
              setFormData(prev => ({ ...prev, useSameAddress: checked as boolean }))
            }
            disabled={isLoading}
            className="rounded"
          />
          <label
            htmlFor="useSameAddress"
            className="text-sm text-white/80 cursor-pointer"
          >
            Billing address same as shipping
          </label>
        </div>

        {!formData.useSameAddress && (
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
              Billing Address *
            </label>
            <Textarea
              name="billingAddress"
              value={formData.billingAddress}
              onChange={handleChange}
              placeholder="Street address, city, state, ZIP code"
              required={!formData.useSameAddress}
              disabled={isLoading}
              rows={4}
              className="bg-white/5 border-white/10 text-white rounded-none resize-none"
            />
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-white/5 border border-white/10 p-6 space-y-3">
        <div className="flex justify-between text-sm text-white/60">
          <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items</span>
          <span>${cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm text-white/60">
          <span>Shipping</span>
          <span className="text-green-400">Complimentary</span>
        </div>
        <div className="h-px bg-white/10" />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-primary">
            ${cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || cartItems.length === 0}
        className="w-full h-14 bg-primary hover:bg-white hover:text-primary text-white rounded-none uppercase tracking-widest font-bold text-sm transition-all duration-500 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Order...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Complete Purchase
          </>
        )}
      </Button>

      <p className="text-xs text-white/40 text-center">
        Your order will be saved and you'll receive a confirmation email.
      </p>
    </form>
  );
}
