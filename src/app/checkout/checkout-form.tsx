'use client';

import { useState } from 'react';
import { processCheckout, CheckoutFormData, CartItemForOrder } from '@/app/actions/checkout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Loader2, CheckCircle2, Landmark, CreditCard, Bitcoin, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

type CheckoutFormProps = {
  cartItems: CartItemForOrder[];
  cartTotal: number;
  onOrderComplete: (orderId: string, total: number) => void;
};

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Landmark, description: 'Direct IBAN settlement' },
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard, description: 'Global processing' },
  { id: 'crypto', label: 'Digital Assets', icon: Bitcoin, description: 'BTC / ETH / SOL' },
  { id: 'concierge', label: 'Concierge', icon: UserRound, description: 'Personalized invoice' },
];

export function CheckoutForm({ cartItems, cartTotal, onOrderComplete }: CheckoutFormProps) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'credit_card',
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
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-semibold">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="space-y-6">
        <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-primary">
          I. Collector Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">
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
              className="bg-white/5 border-white/10 text-white rounded-none h-12 focus:border-primary/50"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Email Address *
            </label>
            <Input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              placeholder="jane@example.com"
              required
              disabled={isLoading}
              className="bg-white/5 border-white/10 text-white rounded-none h-12 focus:border-primary/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Phone Number (Optional)
          </label>
          <Input
            type="tel"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            disabled={isLoading}
            className="bg-white/5 border-white/10 text-white rounded-none h-12 focus:border-primary/50"
          />
        </div>
      </div>

      {/* Delivery Address */}
      <div className="space-y-6">
        <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-primary">
          II. Delivery Destination
        </h3>
        
        <div className="space-y-4">
          <Textarea
            name="customerAddress"
            value={formData.customerAddress}
            onChange={handleChange}
            placeholder="Street address, city, state, ZIP code"
            required
            disabled={isLoading}
            rows={3}
            className="bg-white/5 border-white/10 text-white rounded-none resize-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Payment Options */}
      <div className="space-y-6">
        <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-primary">
          III. Acquisition Protocol
        </h3>

        <RadioGroup 
          value={formData.paymentMethod} 
          onValueChange={(val) => setFormData(prev => ({ ...prev, paymentMethod: val as any }))}
          className="grid grid-cols-2 gap-4"
        >
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = formData.paymentMethod === method.id;
            return (
              <label
                key={method.id}
                className={cn(
                  "relative flex flex-col p-4 border transition-all duration-500 cursor-pointer group hover:bg-white/[0.02]",
                  isSelected 
                    ? "bg-primary/5 border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                    : "bg-white/[0.01] border-white/10"
                )}
              >
                <RadioGroupItem value={method.id} className="sr-only" />
                <div className="flex items-center justify-between mb-3">
                  <Icon className={cn(
                    "w-5 h-5 transition-colors duration-500",
                    isSelected ? "text-primary" : "text-white/20 group-hover:text-white/40"
                  )} />
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-primary" />}
                </div>
                <p className={cn(
                  "text-[10px] uppercase tracking-widest font-bold mb-1",
                  isSelected ? "text-white" : "text-white/40"
                )}>
                  {method.label}
                </p>
                <p className="text-[8px] text-white/20 uppercase tracking-tighter line-clamp-1">
                  {method.description}
                </p>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Order Summary */}
      <div className="bg-white/[0.02] border border-white/5 p-8 space-y-4">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
          <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} Curated Pieces</span>
          <span>${cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
          <span>White Glove Logistics</span>
          <span className="text-green-400">Complimentary</span>
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex justify-between items-center pt-2">
          <span className="font-headline italic text-xl">Investment Total</span>
          <span className="text-3xl font-headline font-bold text-primary">
            ${cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || cartItems.length === 0}
        className="w-full h-16 bg-primary hover:bg-white hover:text-primary text-white rounded-none uppercase tracking-[0.3em] font-bold text-[10px] transition-all duration-700 disabled:opacity-20 shadow-xl shadow-primary/10"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-3 animate-spin" />
            Initializing Protocol...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-3" />
            Complete Acquisition
          </>
        )}
      </Button>

      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-[8px] text-white/20 uppercase tracking-[0.4em] font-bold">
          Butterfly Store acquisition ledger is legally binding.
        </p>
      </div>
    </form>
  );
}
