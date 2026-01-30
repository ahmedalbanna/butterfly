
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS } from '@/lib/products';
import { X, ShoppingBag, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function ShowcasePage() {
  const [activeSection, setActiveSection] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);

  // تحديث موقع مؤشر الماوس المخصص والتحقق من نوع الجهاز
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

  // نستخدم Intersection Observer لمعرفة القسم الظاهر حالياً
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
          0% { transform: scale(1.05); }
          100% { transform: scale(1.15); }
        }
        .animate-subtle-zoom {
          animation: subtle-zoom 20s infinite alternate ease-in-out;
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

      {/* Custom Cursor - Visible only on Desktop */}
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
        className="fixed top-4 right-4 md:top-8 md:right-8 z-50 animate-in fade-in zoom-in duration-1000 delay-500"
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

      {/* Floating Animated Logo */}
      <div className="fixed top-4 left-4 md:top-8 md:left-8 z-50 animate-in fade-in slide-in-from-top duration-1000">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary flex items-center justify-center rounded-sm rotate-45 animate-pulse">
            <Sparkles className="text-white w-4 h-4 md:w-5 md:h-5 -rotate-45" />
          </div>
          <h2 className="text-lg md:text-2xl font-headline font-bold text-white tracking-tighter">LuxeFinds</h2>
        </div>
      </div>

      {PRODUCTS.map((product, index) => (
        <section 
          key={product.id} 
          data-index={index}
          className="h-screen w-full snap-start relative flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image 
              src={product.image} 
              alt={product.name} 
              fill 
              priority={index === 0}
              className="object-cover opacity-50 md:opacity-60 animate-subtle-zoom"
            />
            {/* Gradients for better text readability on all screens */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-transparent to-transparent hidden lg:block" />
            <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
          </div>

          {/* Content Container */}
          <div className="relative z-10 container mx-auto px-6 md:px-12 h-full flex flex-col justify-center text-white">
            <div className="max-w-5xl space-y-6 md:space-y-12">
              
              {/* Category Badge */}
              <div className={`${activeSection === index ? 'animate-in slide-in-from-left fade-in duration-1000' : 'opacity-0'}`}>
                <span className="inline-flex items-center gap-2 py-1 px-4 md:px-6 bg-primary/20 border border-primary/50 text-primary font-bold tracking-[0.2em] md:tracking-[0.4em] uppercase text-[8px] md:text-[10px] mb-2 md:mb-6 backdrop-blur-md rounded-full">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-ping" />
                  {product.category}
                </span>
              </div>

              {/* Product Name */}
              <div className={`${activeSection === index ? 'animate-in slide-in-from-left fade-in delay-200 duration-1000' : 'opacity-0'}`}>
                <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] font-headline italic leading-none drop-shadow-2xl mb-4 text-white">
                  {product.name.split(' ').map((word, i) => (
                    <span key={i} className="inline-block mr-2 md:mr-6 last:text-primary">{word} </span>
                  ))}
                </h1>
              </div>

              {/* Specs Grid */}
              <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 border-l-2 border-primary/30 pl-6 md:pl-10 py-2 md:py-6",
                activeSection === index ? 'animate-in slide-in-from-bottom fade-in delay-500 duration-1000' : 'opacity-0'
              )}>
                <div className="space-y-1 md:space-y-3 group cursor-default">
                  <p className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-primary font-bold transition-all group-hover:tracking-[0.6em]">Premium Price</p>
                  <p className="text-3xl md:text-7xl font-body font-light tabular-nums">
                    <span className="text-primary text-xl md:text-3xl mr-1">$</span>
                    {product.price.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1 md:space-y-3 group cursor-default">
                  <p className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-primary font-bold transition-all group-hover:tracking-[0.6em]">Composition</p>
                  <p className="text-sm md:text-2xl italic font-body text-white/80 leading-relaxed max-w-sm">
                    {product.materials}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Buy and Inquire */}
              <div className={cn(
                "flex flex-col sm:flex-row gap-4 md:gap-6 pt-6 md:pt-10",
                activeSection === index ? 'animate-in fade-in slide-in-from-bottom delay-700 duration-1000' : 'opacity-0'
              )}>
                <Link 
                  href={`/product/${product.id}`}
                  onMouseEnter={() => handleMouseEnter("Purchase")}
                  onMouseLeave={handleMouseLeave}
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full sm:w-auto bg-primary hover:bg-white hover:text-primary text-white rounded-none px-6 md:px-12 h-14 md:h-20 text-sm md:text-md font-bold uppercase tracking-widest transition-all duration-500 hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]">
                    <ShoppingBag className="mr-2 md:mr-3 h-4 md:h-5 w-4 md:w-5" /> Buy Piece
                  </Button>
                </Link>
                
                <Link 
                  href={`/product/${product.id}`}
                  onMouseEnter={() => handleMouseEnter("Inquiry")}
                  onMouseLeave={handleMouseLeave}
                  className="w-full sm:w-auto"
                >
                  <Button variant="outline" className="w-full sm:w-auto bg-white/5 backdrop-blur-xl text-white border-white/20 hover:bg-white/20 hover:border-white rounded-none px-6 md:px-12 h-14 md:h-20 text-sm md:text-md font-bold uppercase tracking-widest transition-all duration-500">
                    <MessageCircle className="mr-2 md:mr-3 h-4 md:h-5 w-4 md:w-5" /> Inquire Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Enhanced Scroll Indicator */}
          {index < PRODUCTS.length - 1 && (
            <div className={cn(
              "absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-4 transition-all duration-1000",
              activeSection === index ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-10'
            )}>
               <span className="text-[8px] md:text-[10px] uppercase tracking-[0.5em] md:tracking-[0.8em] text-white font-bold ml-[0.5em]">Next Piece</span>
               <div className="w-px h-8 md:h-16 bg-gradient-to-b from-primary to-transparent animate-bounce" />
            </div>
          )}

          {/* Side Nav Dots - Hidden on Mobile */}
          <div className="fixed right-4 md:right-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-6 z-40">
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
