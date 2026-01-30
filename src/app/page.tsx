
"use client"

import Image from 'next/image';
import { PRODUCTS, CATEGORIES } from '@/lib/products';
import { ShoppingBag, Sparkles, MessageCircle, ChevronLeft, ChevronRight, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ChevronDown, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';

interface SparkleEffect {
  id: number;
  x: number;
  y: number;
}

export default function Home() {
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();
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

  const handlePurchase = () => {
    toast({
      title: "Order Placed",
      description: "Thank you for your purchase! Our team will process your order immediately.",
    });
    clearCart();
  };

  const handleImageInteraction = (e: React.MouseEvent<HTMLDivElement>, productId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSparkle = { id: Date.now(), x, y };
    setSparkles(prev => [...prev, newSparkle]);
    
    // Toggle zoom
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
          <h2 className="text-lg md:text-2xl font-headline font-bold text-white tracking-tighter drop-shadow-lg">LuxeFinds</h2>
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
          <SheetContent side="right" className="bg-black/98 border-l-primary/30 text-white w-full sm:max-w-md p-0 overflow-hidden flex flex-col box-border">
            <SheetHeader className="p-6 md:p-8 border-b border-white/10">
              <SheetTitle className="text-2xl md:text-3xl font-headline italic text-white flex items-center gap-3">
                <ShoppingBag className="text-primary" /> Your Selection
              </SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="flex-1 px-6 md:px-8 py-6">
              {cart.length === 0 ? (
                <div className="h-[40vh] flex flex-col items-center justify-center space-y-4 opacity-50">
                  <ShoppingBag className="w-12 h-12" />
                  <p className="font-body italic text-lg text-center px-4">Your shopping bag is waiting for its first treasure.</p>
                </div>
              ) : (
                <div className="space-y-8 md:space-y-10">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 md:gap-6 group box-border">
                      <div className="relative w-20 h-28 md:w-24 md:h-32 bg-white/5 shrink-0 overflow-hidden rounded-sm border border-white/10">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
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
                              className="text-white/40 hover:text-primary transition-colors p-1"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-white/40 hover:text-destructive transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 md:mt-4">
                          <div className="flex items-center border border-white/10 rounded-none bg-white/5">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 hover:text-primary transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 hover:text-primary transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="font-bold text-primary text-sm md:text-base">${(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="p-6 md:p-8 bg-white/5 border-t border-white/10 space-y-4 md:space-y-6 box-border">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between text-[10px] md:text-xs text-white/60 uppercase tracking-widest">
                    <span>Estimated Subtotal</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl md:text-2xl font-headline font-bold">
                    <span className="italic">Total</span>
                    <span className="text-primary">${cartTotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 md:gap-3">
                  <Button 
                    onClick={handlePurchase}
                    className="w-full h-11 sm:h-12 md:h-14 lg:h-16 bg-primary text-white rounded-none uppercase tracking-widest font-bold hover:bg-white hover:text-primary transition-all duration-500 text-[10px] sm:text-xs md:text-sm"
                  >
                    Complete Purchase <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" /> Secure & Private Checkout
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

                  {/* Desktop Nav Hints */}
                  {productIndex < group.products.length - 1 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-4 z-20 group-hover/media:translate-x-0 translate-x-4 opacity-0 group-hover/media:opacity-100 transition-all duration-500">
                      <div className="w-10 h-10 flex items-center justify-center bg-primary/20 backdrop-blur-md rounded-full border border-primary/50 text-white hover:bg-primary transition-colors cursor-pointer animate-bounce">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="w-full lg:w-1/2 h-[60vh] md:h-[55vh] lg:h-full relative z-10 flex flex-col justify-center px-6 md:px-12 lg:px-20 xl:px-32 text-white bg-black box-border overflow-hidden">
                  <div className="max-w-xl w-full space-y-6 md:space-y-10 box-border">
                    
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

                    {/* Title */}
                    <div className={cn(
                      "transition-content delay-100",
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                    )}>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-headline italic leading-tight md:leading-none">
                        {product.name}
                      </h1>
                    </div>

                    {/* Details Grid */}
                    <div className={cn(
                      "grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-12 border-l-2 border-primary/30 pl-6 lg:pl-8 transition-content delay-200",
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    )}>
                      <div className="space-y-1">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Market Price</p>
                        <p className="text-2xl md:text-4xl lg:text-5xl font-body font-light tabular-nums">
                          <span className="text-primary text-lg md:text-2xl mr-1">$</span>
                          {product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Materials</p>
                        <p className="text-xs md:text-base lg:text-lg italic font-body text-white/80 leading-relaxed line-clamp-2">
                          {product.materials}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={cn(
                      "flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-8 transition-content delay-300 w-full box-border",
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    )}>
                      <Button 
                        onClick={() => handleAddToCart(product)}
                        className="w-full sm:w-auto bg-primary hover:bg-white hover:text-primary text-white rounded-none px-6 sm:px-8 md:px-12 h-11 sm:h-12 md:h-14 lg:h-16 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-500 box-border"
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" /> Add To Bag
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => handleInquiry(product.name)}
                        className="w-full sm:w-auto bg-white/5 backdrop-blur-xl text-white border-white/20 hover:bg-white/20 hover:border-white rounded-none px-6 sm:px-8 md:px-12 h-11 sm:h-12 md:h-14 lg:h-16 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-500 box-border"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" /> Inquiry
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
