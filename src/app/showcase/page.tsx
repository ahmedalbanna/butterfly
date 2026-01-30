
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS } from '@/lib/products';
import { X, ShoppingBag, Sparkles, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ShowcasePage() {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDevice();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveSection(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    document.querySelectorAll('section[data-index]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = (text: string = "") => {
    if (isDesktop) {
      setIsHovering(true);
      setCursorText(text);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setCursorText("");
  };

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

  return (
    <div className={cn(
      "h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black hide-scrollbar selection:bg-primary selection:text-white",
      isDesktop ? "cursor-none" : "cursor-auto"
    )}>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-subtle-zoom {
          animation: subtle-zoom 15s infinite alternate ease-in-out;
        }
        @media (min-width: 1024px) {
          body {
            cursor: none !important;
          }
          a, button {
            cursor: none !important;
          }
        }
      `}</style>

      {/* Custom Cursor */}
      {isDesktop && (
        <div 
          className={cn(
            "fixed top-0 left-0 w-8 h-8 rounded-full border border-primary pointer-events-none z-[9999] transition-transform duration-300 ease-out flex items-center justify-center mix-blend-difference overflow-hidden",
            isHovering ? 'scale-[3] bg-primary/20 border-white' : 'scale-100 bg-transparent'
          )}
          style={{ 
            transform: `translate(${mousePos.x - 16}px, ${mousePos.y - 16}px) scale(${isHovering ? 2.5 : 1})`,
          }}
        >
          {cursorText && (
            <span className="text-[4px] uppercase font-bold text-white tracking-tighter animate-in fade-in zoom-in duration-300">
              {cursorText}
            </span>
          )}
        </div>
      )}

      {/* Back Button */}
      <Link 
        href="/" 
        className="fixed top-4 right-4 md:top-8 md:right-8 z-50"
        onMouseEnter={() => handleMouseEnter("Back")}
        onMouseLeave={handleMouseLeave}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-primary hover:scale-110 rounded-full h-10 w-10 md:h-14 md:w-14 border border-white/20 backdrop-blur-xl transition-all duration-500 group"
        >
          <X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-500" />
        </Button>
      </Link>

      {/* Logo */}
      <div className="fixed top-4 left-4 md:top-8 md:left-8 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary flex items-center justify-center rounded-sm rotate-45">
            <Sparkles className="text-white w-4 h-4 md:w-5 md:h-5 -rotate-45" />
          </div>
          <h2 className="text-lg md:text-2xl font-headline font-bold text-white tracking-tighter">LuxeFinds</h2>
        </div>
      </div>

      {PRODUCTS.map((product, index) => (
        <section 
          key={product.id} 
          data-index={index}
          className="h-screen w-full snap-start relative flex flex-col lg:flex-row items-center overflow-hidden bg-black"
        >
          {/* Side Image Carousel Container */}
          <div className="w-full lg:w-1/2 h-[45vh] lg:h-full relative overflow-hidden group/image">
            <Carousel className="h-full w-full" opts={{ loop: true }}>
              <CarouselContent className="h-full w-full ml-0">
                {(product.images && product.images.length > 0 ? product.images : [product.image]).map((img, i) => (
                  <CarouselItem key={i} className="h-full w-full p-0">
                    <div className="relative h-full w-full overflow-hidden">
                      <Image 
                        src={img} 
                        alt={`${product.name} ${i + 1}`} 
                        fill 
                        priority={index === 0 && i === 0}
                        className="object-cover animate-subtle-zoom"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* Overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/40 pointer-events-none" />
              
              {/* Show navigation buttons if more than one image */}
              {(product.images && product.images.length > 1) && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 pointer-events-none opacity-0 group-hover/image:opacity-100 transition-opacity duration-500">
                  <CarouselPrevious className="static pointer-events-auto h-10 w-10 rounded-none bg-white/10 hover:bg-primary border-white/20 text-white translate-y-0" />
                  <CarouselNext className="static pointer-events-auto h-10 w-10 rounded-none bg-white/10 hover:bg-primary border-white/20 text-white translate-y-0" />
                </div>
              )}
            </Carousel>
          </div>

          {/* Content Container */}
          <div className="w-full lg:w-1/2 h-[55vh] lg:h-full relative z-10 flex flex-col justify-center px-6 md:px-12 lg:px-20 text-white bg-black">
            <div className="max-w-xl space-y-6 md:space-y-10">
              
              <div className={`${activeSection === index ? 'animate-in slide-in-from-left fade-in duration-1000' : 'opacity-0'}`}>
                <span className="inline-flex items-center gap-2 py-1 px-4 bg-primary/20 border border-primary/50 text-primary font-bold tracking-[0.3em] uppercase text-[10px] mb-2 backdrop-blur-md rounded-full">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                  {product.category}
                </span>
              </div>

              <div className={`${activeSection === index ? 'animate-in slide-in-from-left fade-in delay-200 duration-1000' : 'opacity-0'}`}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-headline italic leading-none drop-shadow-2xl mb-4">
                  {product.name.split(' ').map((word, i) => (
                    <span key={i} className="inline-block mr-3 md:mr-5 last:text-primary">{word} </span>
                  ))}
                </h1>
              </div>

              <div className={cn(
                "grid grid-cols-2 gap-8 lg:gap-12 border-l-2 border-primary/30 pl-6 lg:pl-8 py-2 md:py-4",
                activeSection === index ? 'animate-in slide-in-from-bottom fade-in delay-500 duration-1000' : 'opacity-0'
              )}>
                <div className="space-y-1 group cursor-default">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold transition-all group-hover:tracking-[0.5em]">Exclusive Price</p>
                  <p className="text-3xl md:text-5xl font-body font-light tabular-nums">
                    <span className="text-primary text-xl md:text-2xl mr-1">$</span>
                    {product.price.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1 group cursor-default">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold transition-all group-hover:tracking-[0.5em]">Composition</p>
                  <p className="text-xs md:text-lg italic font-body text-white/80 leading-relaxed line-clamp-2">
                    {product.materials}
                  </p>
                </div>
              </div>

              <div className={cn(
                "flex flex-col sm:flex-row gap-4 pt-6 md:pt-8",
                activeSection === index ? 'animate-in fade-in slide-in-from-bottom delay-700 duration-1000' : 'opacity-0'
              )}>
                <div 
                  onMouseEnter={() => handleMouseEnter("Purchase")}
                  onMouseLeave={handleMouseLeave}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full sm:w-auto bg-primary hover:bg-white hover:text-primary text-white rounded-none px-8 md:px-12 h-14 md:h-16 text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-500"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" /> Buy Piece
                  </Button>
                </div>
                
                <Link 
                  href={`/product/${product.id}`}
                  onMouseEnter={() => handleMouseEnter("Inquiry")}
                  onMouseLeave={handleMouseLeave}
                  className="w-full sm:w-auto"
                >
                  <Button variant="outline" className="w-full sm:w-auto bg-white/5 backdrop-blur-xl text-white border-white/20 hover:bg-white/20 hover:border-white rounded-none px-8 md:px-12 h-14 md:h-16 text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-500">
                    <MessageCircle className="mr-2 h-4 w-4" /> Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          {index < PRODUCTS.length - 1 && (
            <div className={cn(
              "absolute bottom-4 right-4 lg:bottom-12 lg:left-1/2 lg:-translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-1000 z-50",
              activeSection === index ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-10'
            )}>
               <span className="hidden lg:block text-[8px] uppercase tracking-[0.8em] text-white font-bold ml-[0.8em]">Next Piece</span>
               <div className="w-px h-6 lg:h-16 bg-gradient-to-b from-primary to-transparent animate-bounce" />
            </div>
          )}

          {/* Side Nav (Pagination Dots) */}
          <div className="fixed right-4 lg:right-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-6 z-40">
            {PRODUCTS.map((_, i) => (
              <button
                key={i}
                onClick={() => document.querySelectorAll('section')[i].scrollIntoView({ behavior: 'smooth' })}
                onMouseEnter={() => handleMouseEnter(`0${i+1}`)}
                onMouseLeave={handleMouseLeave}
                className="group relative flex items-center justify-end"
              >
                <span className={cn(
                  "absolute right-8 text-[10px] uppercase tracking-widest font-bold text-primary transition-all duration-500",
                  activeSection === i ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                )}>
                  0{i + 1}
                </span>
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-700 border border-primary",
                    activeSection === i ? 'bg-primary scale-[2.5] shadow-[0_0_15px_hsl(var(--primary))]' : 'bg-white/20'
                  )} 
                />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
