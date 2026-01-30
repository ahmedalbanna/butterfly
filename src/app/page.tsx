
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { PRODUCTS } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Home() {
  const featuredProducts = PRODUCTS.filter(p => p.featured);
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] w-full flex items-center overflow-hidden">
        <Image 
          src={heroImage?.imageUrl || ''} 
          alt="Luxe Collection" 
          fill 
          priority
          className="object-cover"
          data-ai-hint="luxury jewelry"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="container relative mx-auto px-4 text-white">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-6xl md:text-8xl font-headline font-light leading-tight">
              Elegance in <br /><span className="italic font-bold text-primary">Every Detail</span>
            </h1>
            <p className="text-lg md:text-xl font-body max-w-lg opacity-90">
              Discover a curated collection of artisanal accessories designed to elevate your style and celebrate life's finest moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/shop">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white border-none px-8 py-7 text-lg rounded-none">
                  SHOP THE COLLECTION
                </Button>
              </Link>
              <Link href="/ai-stylist">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md text-white border-white/40 hover:bg-white/20 px-8 py-7 text-lg rounded-none">
                  <Sparkles className="mr-2 h-5 w-5" /> TRY AI STYLIST
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Carousel Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
              <span className="text-primary font-bold tracking-widest text-xs uppercase">Curated For You</span>
              <h2 className="text-4xl md:text-5xl font-headline italic">Seasonal Highlights</h2>
            </div>
            <Link href="/shop" className="group hidden sm:flex items-center gap-2 text-sm font-bold tracking-widest uppercase hover:text-primary transition-colors">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full relative"
          >
            <CarouselContent className="-ml-4 md:-ml-8">
              {featuredProducts.map((product) => (
                <CarouselItem key={product.id} className="pl-4 md:pl-8 basis-full sm:basis-1/2 lg:basis-1/4">
                  <Link href={`/product/${product.id}`} className="group space-y-4 block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted rounded-sm shadow-sm">
                      <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-secondary font-bold tracking-widest uppercase">{product.category}</span>
                      <h3 className="text-xl font-headline group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                      <p className="text-lg font-body font-medium text-primary">${product.price.toLocaleString()}</p>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="flex justify-center mt-12 gap-4">
              <CarouselPrevious className="static translate-y-0 h-12 w-12 rounded-none border-primary text-primary hover:bg-primary hover:text-white" />
              <CarouselNext className="static translate-y-0 h-12 w-12 rounded-none border-primary text-primary hover:bg-primary hover:text-white" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* AI CTA Banner */}
      <section className="bg-primary/5 py-24 border-y">
        <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-8">
          <div className="p-4 bg-white rounded-full shadow-lg">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div className="max-w-3xl space-y-4">
            <h2 className="text-4xl md:text-5xl font-headline">Meet Your AI Personal Stylist</h2>
            <p className="text-lg text-secondary max-w-xl mx-auto italic">
              "Not sure which accessory matches your outfit? Our AI will suggest the perfect pairings from our collection."
            </p>
          </div>
          <Link href="/ai-stylist">
            <Button size="lg" className="bg-primary text-white rounded-none px-12 h-14 text-lg font-bold tracking-widest uppercase">
              GET RECOMMENDATIONS
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-16 bg-white">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          <div className="space-y-4">
            <h3 className="text-2xl font-headline font-bold text-primary">LuxeFinds</h3>
            <p className="text-sm text-secondary italic">Crafting elegance through artisanal accessories since 2024.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-xs tracking-widest uppercase">SHOP</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li><Link href="/shop" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors">Jewelry</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors">Watches</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-xs tracking-widest uppercase">SUPPORT</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li><Link href="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Care Guide</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-xs tracking-widest uppercase">NEWSLETTER</h4>
            <p className="text-sm text-secondary mb-6">Join our list for exclusive releases and private viewings.</p>
            <div className="flex flex-col gap-2">
              <input className="bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary rounded-none" placeholder="Email Address" />
              <Button className="bg-primary text-white rounded-none font-bold uppercase tracking-widest">JOIN</Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-16 pt-8 border-t text-center text-[10px] text-secondary tracking-widest uppercase">
          © 2024 LUXEFINDS. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
