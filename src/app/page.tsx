
"use client"

import Image from 'next/image';
import { PRODUCTS, CATEGORIES } from '@/lib/products';
import { ShoppingBag, Sparkles, MessageCircle, ChevronLeft, ChevronRight, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ChevronDown, MousePointer2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/cart-context';
import { useVoiceCall } from '@/context/voice-call-context';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface SparkleEffect {
  id: number;
  x: number;
  y: number;
}

const TypewriterEffect = ({ text, delay = 0, speed = 30, active = false }: { text: string, delay?: number, speed?: number, active?: boolean }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!active) {
      setDisplayText('');
      return;
    }

    let current = '';
    let index = 0;
    const initialTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (index < text.length) {
          current += text[index];
          setDisplayText(current);
          index++;
        } else {
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);

    return () => {
      clearTimeout(initialTimeout);
      setDisplayText('');
    };
  }, [text, active, delay, speed]);

  return <span>{displayText}</span>;
};

export default function Home() {
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { startCall } = useVoiceCall();
  const { toast } = useToast();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeProductIndices, setActiveProductIndices] = useState<Record<number, number>>({});
  const [sparkles, setSparkles] = useState<SparkleEffect[]>([]);
  const [isZoomed, setIsZoomed] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const groupedProducts = useMemo(() => {
    return CATEGORIES.filter(cat => cat !== 'All').map(cat => ({
      name: cat,
      products: PRODUCTS.filter(p => p.category === cat)
    })).filter(group => group.products.length > 0);
  }, []);

  useEffect(() => {
    const initialIndices: Record<number, number> = {};
    groupedProducts.forEach((_, idx) => {
      initialIndices[idx] = 0;
    });
    setActiveProductIndices(initialIndices);

    const categoryObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-category-index'));
            setActiveCategoryIndex(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    document.querySelectorAll('section[data-category-index]').forEach((section) => {
      categoryObserver.observe(section);
    });

    const productObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const catIndex = Number(entry.target.getAttribute('data-parent-category-index'));
            const prodIndex = Number(entry.target.getAttribute('data-product-index'));
            setActiveProductIndices(prev => ({
              ...prev,
              [catIndex]: prodIndex
            }));
          }
        });
      },
      { threshold: 0.6 }
    );

    document.querySelectorAll('div[data-product-index]').forEach((div) => {
      productObserver.observe(div);
    });

    return () => {
      categoryObserver.disconnect();
      productObserver.disconnect();
    };
  }, [groupedProducts]);

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    toast({
      title: "Added to Bag",
      description: `${product.name} has been added to your shopping bag.`,
    });
  };

  const handleInquiry = (productName: string) => {
    toast({
      title: "Inquiry Sent",
      description: `A personal stylist will contact you regarding ${productName} shortly.`,
    });
  };

  const handleImageInteraction = (e: React.MouseEvent<HTMLDivElement>, productId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSparkle = { id: Date.now(), x, y };
    setSparkles(prev => [...prev, newSparkle]);
    
    setIsZoomed(prev => ({ ...prev, [productId]: !prev[productId] }));

    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
    }, 1000);
  };

  return (
    <div ref={containerRef} className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black hide-scrollbar selection:bg-primary selection:text-white box-border">
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes sparkle-anim {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
          100% { transform: scale(2) rotate(360deg); opacity: 0; }
        }
        .animate-magic-sparkle {
          animation: sparkle-anim 0.8s ease-out forwards;
        }
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        .animate-subtle-zoom {
          animation: subtle-zoom 20s infinite alternate ease-in-out;
        }
        .transition-content {
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>

      {/* Brand Logo */}
      <div className="fixed top-4 left-4 md:top-8 md:left-12 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary flex items-center justify-center rounded-sm rotate-45 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            <Sparkles className="text-white w-4 h-4 md:w-5 md:h-5 -rotate-45" />
          </div>
          <h2 className="text-lg md:text-2xl font-headline font-bold text-white tracking-tighter drop-shadow-lg text-primary">LuxeFinds</h2>
        </div>
      </div>

      {/* Floating Cart UI */}
      <div className="fixed top-4 right-4 md:top-8 md:right-12 z-50 flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-primary hover:scale-110 rounded-full h-10 w-10 md:h-12 md:w-12 border border-white/20 backdrop-blur-xl transition-all duration-500 bg-black/20"
              >
                <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-in zoom-in ring-2 ring-black">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#0a0a0a] border-l border-white/10 text-white w-full sm:max-w-md p-0 overflow-hidden flex flex-col box-border shadow-2xl">
            <SheetHeader className="p-6 md:p-8 border-b border-white/10 bg-black/20 backdrop-blur-md">
              <SheetTitle className="text-2xl md:text-3xl font-headline italic text-white flex items-center gap-3">
                <ShoppingBag className="text-primary" /> Your Selection
              </SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="flex-1 px-6 md:px-8 py-6">
              {cart.length === 0 ? (
                <div className="h-[50vh] flex flex-col items-center justify-center space-y-6 opacity-30">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <p className="font-body italic text-lg text-center px-4">Your boutique bag is empty.</p>
                </div>
              ) : (
                <div className="space-y-8 md:space-y-10">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 md:gap-6 group box-border animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="relative w-20 h-28 md:w-24 md:h-32 bg-white/[0.03] shrink-0 overflow-hidden rounded-sm border border-white/5 transition-colors group-hover:border-primary/30">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <h4 className="font-headline text-lg md:text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2">{item.name}</h4>
                            <p className="font-bold text-primary/80 text-sm">${item.price.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-1 md:gap-2">
                            <button 
                              onClick={() => handleInquiry(item.name)}
                              className="text-white/20 hover:text-primary transition-colors p-1"
                              title="Expert Inquiry"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-white/20 hover:text-destructive transition-colors p-1"
                              title="Remove Piece"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 md:mt-4">
                          <div className="flex items-center border border-white/10 rounded-sm bg-white/5 overflow-hidden">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-white/10 transition-colors disabled:opacity-20"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold font-mono">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-white/10 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="font-bold text-primary text-sm md:text-base tracking-tighter">${(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="p-6 md:p-8 bg-black/40 backdrop-blur-xl border-t border-white/10 space-y-4 md:space-y-6 box-border">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] md:text-xs text-white/40 uppercase tracking-[0.2em]">
                    <span>Subtotal</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl md:text-2xl font-headline italic">Estimated Total</span>
                    <span className="text-2xl md:text-3xl font-headline font-bold text-primary">${cartTotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <Link href="/checkout" className="w-full">
                    <Button 
                      className="w-full h-12 md:h-16 bg-primary text-white rounded-none uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-primary transition-all duration-500 text-[10px] sm:text-xs md:text-sm box-border shadow-[0_4px_20px_rgba(var(--primary),0.2)]"
                    >
                      Process Order <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-[8px] md:text-[10px] text-white/30 uppercase tracking-[0.3em]">
                  <ShieldCheck className="w-3 h-3 text-primary/50" /> Secure Boutique Checkout
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Sections */}
      {groupedProducts.map((group, categoryIndex) => (
        <section 
          key={group.name} 
          data-category-index={categoryIndex}
          className="h-screen w-full snap-start relative flex overflow-x-scroll snap-x snap-mandatory hide-scrollbar bg-black box-border"
        >
          {group.products.map((product, productIndex) => {
            const isVisible = activeCategoryIndex === categoryIndex && activeProductIndices[categoryIndex] === productIndex;
            const zoomed = isZoomed[product.id];

            return (
              <div 
                key={product.id}
                data-parent-category-index={categoryIndex}
                data-product-index={productIndex}
                className="h-screen w-screen snap-center shrink-0 relative flex flex-col lg:flex-row items-center overflow-hidden bg-black box-border"
              >
                {/* Product Visuals */}
                <div 
                  onClick={(e) => handleImageInteraction(e, product.id)}
                  className="w-full lg:w-1/2 h-[40vh] md:h-[45vh] lg:h-full relative overflow-hidden bg-muted/10 group/media cursor-crosshair box-border"
                >
                  {product.image && (
                    <Image 
                      src={product.image} 
                      alt={product.name} 
                      fill 
                      priority={categoryIndex === 0 && productIndex === 0}
                      className={cn(
                        "object-cover transition-all duration-1000",
                        isVisible ? "opacity-100" : "opacity-0",
                        isVisible && !zoomed ? "animate-subtle-zoom" : "",
                        zoomed ? "scale-125 brightness-110" : "scale-100"
                      )}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  )}
                  
                  {/* Magic Sparkles */}
                  {sparkles.map(sparkle => (
                    <div 
                      key={sparkle.id} 
                      className="absolute z-50 pointer-events-none animate-magic-sparkle"
                      style={{ left: sparkle.x, top: sparkle.y }}
                    >
                      <Sparkles className="text-primary w-6 h-6 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  ))}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black pointer-events-none" />
                  
                  {/* Tap Hint */}
                  {isVisible && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                        <MousePointer2 className="w-3 h-3 text-primary animate-pulse" />
                        <span className="text-[8px] uppercase tracking-widest font-bold text-white">Tap to Explore Detail</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="w-full lg:w-1/2 h-[60vh] md:h-[55vh] lg:h-full relative z-10 flex flex-col justify-center px-6 md:px-12 lg:px-20 xl:px-32 text-white bg-black box-border overflow-hidden">
                  <div className="max-w-xl w-full space-y-6 md:space-y-10 box-border overflow-hidden">
                    
                    {/* Category Header */}
                    <div className={cn(
                      "transition-content",
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                    )}>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="inline-flex items-center gap-2 py-1 px-3 md:px-4 bg-primary/20 border border-primary/50 text-primary font-bold tracking-[0.3em] uppercase text-[8px] md:text-[10px] backdrop-blur-md rounded-full">
                          {group.name}
                        </span>
                        <div className="h-[1px] flex-1 bg-white/10" />
                      </div>
                      <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-[0.4em] font-medium">Piece 0{productIndex + 1} / 0{group.products.length}</p>
                    </div>

                    {/* Title with Typewriter & Clipping */}
                    <div className={cn(
                      "transition-content delay-100",
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                    )}>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-headline italic leading-tight md:leading-none min-h-[1.2em] line-clamp-2 overflow-hidden">
                        <TypewriterEffect text={product.name} active={isVisible} speed={50} />
                      </h1>
                    </div>

                    {/* Details Grid with Fixed Spacing */}
                    <div className={cn(
                      "grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-12 border-l-2 border-primary/30 pl-6 lg:pl-8 transition-content delay-200",
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    )}>
                      <div className="space-y-1 overflow-hidden">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Market Price</p>
                        <p className="text-2xl md:text-4xl lg:text-5xl font-body font-light tabular-nums truncate">
                          <span className="text-primary text-lg md:text-2xl mr-1">$</span>
                          <TypewriterEffect text={product.price.toLocaleString()} active={isVisible} speed={40} delay={600} />
                        </p>
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Materials</p>
                        <p className="text-xs md:text-base lg:text-lg italic font-body text-white/80 leading-relaxed min-h-[3em] line-clamp-2 overflow-hidden">
                          <TypewriterEffect text={product.materials} active={isVisible} speed={25} delay={1000} />
                        </p>
                      </div>
                    </div>

                    {/* Actions with Clipping Safety - Simplified to 2 main buttons */}
                    <div className={cn(
                      "flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-8 transition-content delay-300 w-full box-border",
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    )}>
                      <Button 
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 min-w-[140px] bg-primary hover:bg-white hover:text-primary text-white rounded-none h-12 md:h-16 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-500 box-border overflow-hidden"
                      >
                        <ShoppingBag className="mr-2 h-4 w-4 shrink-0" /> <span className="truncate">Add To Bag</span>
                      </Button>
                      
                      <Button 
                        onClick={() => startCall({ name: product.name, materials: product.materials })}
                        className="flex-1 min-w-[140px] bg-green-600/20 border border-green-500/50 hover:bg-green-500 text-green-400 hover:text-white rounded-none h-12 md:h-16 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-500 box-border overflow-hidden"
                      >
                        <Phone className="mr-2 h-4 w-4 shrink-0" /> <span className="truncate">Voice Stylist</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress Dot Bar (Mobile) */}
                <div className="absolute bottom-16 left-0 w-full flex justify-center lg:hidden gap-1.5 z-40 px-6 box-border">
                  {group.products.map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1 transition-all duration-500 rounded-full",
                        productIndex === i ? "w-8 bg-primary" : "w-3 bg-white/20"
                      )} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ))}

      {/* Side Nav Dots */}
      <div className="fixed right-4 lg:right-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-6 z-40">
        {groupedProducts.map((group, i) => (
          <button
            key={i}
            onClick={() => document.querySelectorAll('section[data-category-index]')[i].scrollIntoView({ behavior: 'smooth' })}
            className="group relative flex items-center justify-end"
          >
            <div className="absolute right-12 flex flex-col items-end opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">{group.name}</span>
            </div>
            <div 
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-700 border border-primary",
                activeCategoryIndex === i ? 'bg-primary scale-[2.5] shadow-[0_0_20px_hsl(var(--primary))]' : 'bg-white/20 hover:bg-white/40'
              )} 
            />
          </button>
        ))}
      </div>

      {/* Unified Help Overlay */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 text-white/40 z-40 pointer-events-none px-6 backdrop-blur-sm py-2 rounded-full border border-white/5 bg-black/20 box-border">
        <div className="flex items-center gap-2">
          <ChevronLeft className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[7px] md:text-[9px] uppercase tracking-[0.2em] font-bold text-white">Swipe Designs</span>
          <ChevronRight className="w-3 h-3 text-primary animate-pulse" />
        </div>
        <div className="w-px h-4 bg-white/20" />
        <div className="flex items-center gap-2">
          <span className="text-[7px] md:text-[9px] uppercase tracking-[0.2em] font-bold text-white">Explore Categories</span>
          <ChevronDown className="w-4 h-4 text-primary animate-bounce" />
        </div>
      </div>
    </div>
  );
}
