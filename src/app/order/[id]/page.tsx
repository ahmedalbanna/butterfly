import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Truck, CheckCircle2, MessageCircle, ShieldCheck, Sparkles, Receipt, Calendar, User, MapPin, Landmark, CreditCard, Bitcoin, UserRound, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getOrderById } from '@/app/actions/orders';
import { getOrderForDisplay } from '@/app/actions/checkout';
import { cn } from '@/lib/utils';

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);

  if (!order) {
    notFound();
  }

  const statusSteps = [
    { 
      status: 'pending', 
      label: 'Acquisition Logged', 
      description: 'Your selection has been securely registered in our boutique ledger.',
      icon: Receipt 
    },
    { 
      status: 'confirmed', 
      label: 'Meticulous Preparation', 
      description: 'Our curators are meticulously preparing your pieces for delivery.',
      icon: Sparkles 
    },
    { 
      status: 'shipped', 
      label: 'Dispatch Initialized', 
      description: 'Your luxury items are currently in transit via our secure logistics network.',
      icon: Truck 
    },
    { 
      status: 'delivered', 
      label: 'Collection Complete', 
      description: 'The pieces have reached their final destination.',
      icon: CheckCircle2 
    },
  ];

  const currentStatusIndex = statusSteps.findIndex(step => step.status === order.status);
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getPaymentMethodInfo = (method: string | undefined) => {
    switch (method) {
      case 'bank_transfer': return { label: 'Bank Transfer', icon: Landmark };
      case 'crypto': return { label: 'Digital Assets', icon: Bitcoin };
      case 'concierge': return { label: 'Concierge Invoice', icon: UserRound };
      default: return { label: 'Credit Card', icon: CreditCard };
    }
  };

  const payment = getPaymentMethodInfo(order.paymentMethod);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto p-6 md:p-12 lg:p-20 space-y-16">
        {/* Luxury Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/10 pb-12">
          <div>
            <Link href="/">
              <Button variant="ghost" className="text-white/40 hover:text-primary gap-2 p-0 h-auto mb-6 uppercase tracking-[0.3em] text-[10px] font-bold">
                <ArrowLeft className="w-3 h-3" /> Return to Boutique
              </Button>
            </Link>
            <h1 className="text-5xl md:text-7xl font-headline italic tracking-tighter mb-2">Acquisition Status</h1>
            <p className="text-primary uppercase tracking-[0.4em] text-xs font-bold">Butterfly Store Ledger • Verified Authentic</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Order Identifier</p>
            <p className="font-mono text-xl font-bold text-primary">#{order.id.slice(-12).toUpperCase()}</p>
          </div>
        </header>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/[0.03] border border-white/10 p-6 backdrop-blur-xl group hover:border-primary/30 transition-all duration-500">
            <div className="flex items-center gap-3 mb-3 opacity-40 group-hover:opacity-100 transition-opacity">
              <Calendar className="w-3 h-3 text-primary" />
              <span className="text-[8px] uppercase tracking-widest font-bold">Log Date</span>
            </div>
            <p className="text-lg font-headline italic">{orderDate}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 p-6 backdrop-blur-xl group hover:border-primary/30 transition-all duration-500">
            <div className="flex items-center gap-3 mb-3 opacity-40 group-hover:opacity-100 transition-opacity">
              <User className="w-3 h-3 text-primary" />
              <span className="text-[8px] uppercase tracking-widest font-bold">Collector</span>
            </div>
            <p className="text-lg font-headline italic truncate">{order.customerName}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 p-6 backdrop-blur-xl group hover:border-primary/30 transition-all duration-500">
            <div className="flex items-center gap-3 mb-3 opacity-40 group-hover:opacity-100 transition-opacity">
              <payment.icon className="w-3 h-3 text-primary" />
              <span className="text-[8px] uppercase tracking-widest font-bold">Protocol</span>
            </div>
            <p className="text-lg font-headline italic truncate">{payment.label}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 p-6 backdrop-blur-xl group hover:border-primary/30 transition-all duration-500">
            <div className="flex items-center gap-3 mb-3 opacity-40 group-hover:opacity-100 transition-opacity">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span className="text-[8px] uppercase tracking-widest font-bold">Investment</span>
            </div>
            <p className="text-xl font-headline font-bold text-primary">${order.total.toLocaleString()}</p>
          </div>
        </div>

        {/* Cinematic Status Timeline */}
        <div className="bg-white/[0.02] border border-white/5 p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-xl font-headline italic mb-12 flex items-center gap-3">
            <Clock className="text-primary w-5 h-5" /> Progression Timeline
          </h2>
          <div className="space-y-12 relative">
            {/* Vertical Line for Mobile */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10 md:hidden" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const isPending = index > currentStatusIndex;
                return (
                  <div key={step.status} className={cn(
                    "relative flex flex-col items-center text-center transition-all duration-1000",
                    isPending ? "opacity-30 grayscale" : "opacity-100"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-6 border-2 transition-all duration-700",
                      isCompleted ? "bg-primary border-primary text-black" : 
                      isCurrent ? "bg-black border-primary text-primary shadow-[0_0_30px_rgba(var(--primary),0.3)] animate-pulse" : 
                      "bg-white/5 border-white/10 text-white/20"
                    )}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className={cn(
                      "text-[10px] uppercase tracking-[0.2em] font-bold mb-3",
                      isCurrent ? "text-primary" : "text-white/80"
                    )}>
                      {step.label}
                    </h3>
                    <p className="text-[10px] leading-relaxed text-white/40 italic px-2 max-w-[180px]">
                      {step.description}
                    </p>

                    {/* Desktop Connector Line */}
                    {index < statusSteps.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-white/10">
                        <div className={cn("h-full bg-primary transition-all duration-1000", isCompleted ? "w-full" : "w-0")} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Curated Pieces */}
        <div className="space-y-8">
          <h2 className="text-2xl font-headline italic flex items-center gap-3">
            <Package className="text-primary w-6 h-6" /> Curated Collection
          </h2>
          <div className="grid gap-6">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="bg-white/[0.03] border border-white/10 p-8 rounded-none flex flex-col md:flex-row gap-8 items-center group transition-all hover:border-primary/20"
              >
                <div className="relative w-32 h-40 bg-neutral-900 rounded-sm overflow-hidden flex-shrink-0 shadow-2xl transition-transform duration-700 group-hover:scale-105">
                  <Image src={item.product.image} alt={item.product.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <h3 className="text-3xl font-headline italic mb-1">{item.product.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Limited Edition Piece</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-8 text-[10px] uppercase tracking-widest font-bold">
                    <div className="space-y-1"><p className="text-primary/60">Quantity</p><p className="text-lg font-mono">0{item.quantity}</p></div>
                    <div className="space-y-1"><p className="text-primary/60">Unit Price</p><p className="text-lg font-mono">${item.price.toLocaleString()}</p></div>
                    <div className="space-y-1"><p className="text-primary/60">Subtotal</p><p className="text-xl font-bold text-primary">${(item.price * item.quantity).toLocaleString()}</p></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          <div className="bg-white/[0.03] border border-white/5 p-10 space-y-6">
            <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Delivery Destination
            </h3>
            <p className="text-xl font-headline italic text-white/80 leading-relaxed whitespace-pre-line">{order.customerAddress}</p>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] uppercase tracking-widest text-white/20 font-bold mb-1">Contact Channel</p>
              <p className="text-sm font-mono text-white/60">{order.customerPhone || 'Not Provided'}</p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 p-10 flex flex-col justify-center items-center text-center space-y-6 backdrop-blur-xl">
            <p className="text-sm text-primary italic max-w-[280px]">"If you require personalized guidance regarding this acquisition, our elite concierge team is standing by."</p>
            <Link href={`/contact?orderId=${order.id}`} className="w-full">
              <Button className="w-full h-14 bg-primary text-white rounded-none uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-primary transition-all duration-500 shadow-xl shadow-primary/10">
                <MessageCircle className="w-4 h-4 mr-2" /> Concierge Support
              </Button>
            </Link>
          </div>
        </div>

        <footer className="pt-20 text-center space-y-6 border-t border-white/5">
          <div className="inline-flex items-center gap-4 text-white/10 text-[8px] uppercase tracking-[0.6em] font-bold">
            <ShieldCheck className="w-4 h-4" /> Secure Acquisition Protocol • Verified by Butterfly Store
          </div>
          <p className="text-[9px] text-white/20 italic max-w-lg mx-auto leading-loose">
            Every piece in this order has been meticulously curated and verified. This digital record serves as proof of original acquisition. Butterfly Store maintains the highest standards of luxury ethics and logistics transparency.
          </p>
        </footer>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const order = await getOrderForDisplay(params.id);
  return {
    title: order ? `Butterfly Store | Status ${order.id.slice(-8).toUpperCase()}` : 'Order Not Found',
    description: 'View your luxury acquisition details and tracking information.'
  };
}
