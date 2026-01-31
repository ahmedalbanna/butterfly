import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Truck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getOrderById } from '@/app/actions/orders';
import { getOrderForDisplay } from '@/app/actions/checkout';

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);

  if (!order) {
    notFound();
  }

  const statusSteps = [
    { status: 'pending', label: 'Order Placed', icon: CheckCircle2 },
    { status: 'confirmed', label: 'Confirmed', icon: Package },
    { status: 'shipped', label: 'Shipped', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const currentStatusIndex = statusSteps.findIndex(step => step.status === order.status);
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:text-primary gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Collection
            </Button>
          </Link>
          <div className="text-right">
            <h1 className="text-3xl md:text-5xl font-headline italic">Order Tracking</h1>
            <p className="text-primary uppercase tracking-widest text-xs mt-2">Order Details</p>
          </div>
        </header>

        {/* Order Number & Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
            <p className="text-white/40 uppercase tracking-widest text-xs mb-2">Order Number</p>
            <p className="font-mono text-lg font-bold text-primary break-all">{order.id}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
            <p className="text-white/40 uppercase tracking-widest text-xs mb-2">Order Date</p>
            <p className="text-lg font-bold">{orderDate}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
            <p className="text-white/40 uppercase tracking-widest text-xs mb-2">Order Total</p>
            <p className="text-lg font-bold text-primary">
              ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-lg">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-8">Order Status</h2>
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStatusIndex;
              const isCurrentStep = index === currentStatusIndex;

              return (
                <div key={step.status} className="flex flex-col items-center w-full">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isActive
                        ? 'bg-primary text-black'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <p
                    className={`text-xs uppercase tracking-widest font-bold text-center ${
                      isActive ? 'text-primary' : 'text-white/40'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrentStep && (
                    <p className="text-xs text-white/60 mt-2">Current</p>
                  )}
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`w-0.5 h-8 mt-2 ${
                        index < currentStatusIndex ? 'bg-primary' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold uppercase tracking-widest">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 p-6 rounded-lg flex gap-6 items-start"
              >
                <div className="relative w-24 h-32 bg-white/5 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline text-lg mb-2">{item.product.name}</h3>
                  <div className="space-y-1 text-sm text-white/60">
                    <p>Quantity: <span className="text-white font-bold">{item.quantity}</span></p>
                    <p>Unit Price: <span className="text-white font-bold">${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                    <p className="pt-2 text-primary font-bold">
                      Subtotal: ${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
            <h3 className="font-bold uppercase tracking-widest mb-4 text-primary">Shipping Address</h3>
            <p className="text-white/80 whitespace-pre-line text-sm">{order.shippingAddress}</p>
            {order.customerPhone && (
              <p className="text-white/60 text-sm mt-4">Phone: {order.customerPhone}</p>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
            <h3 className="font-bold uppercase tracking-widest mb-4 text-primary">Billing Address</h3>
            <p className="text-white/80 whitespace-pre-line text-sm">{order.billingAddress}</p>
            <p className="text-white/60 text-sm mt-4">Email: {order.customerEmail}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-lg space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Subtotal</span>
            <span>${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Shipping</span>
            <span className="text-green-400">Complimentary</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">
              ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
          <p className="text-sm text-blue-300 mb-4">
            Have questions about your order? Contact our concierge team.
          </p>
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none uppercase tracking-widest text-xs px-6">
              Contact Support
            </Button>
          </Link>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-none uppercase tracking-widest">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const order = await getOrderForDisplay(params.id);
  
  return {
    title: order ? `Order ${order.id.substring(0, 8)}` : 'Order Not Found',
    description: 'View your LuxeFinds order details and tracking information.'
  };
}
