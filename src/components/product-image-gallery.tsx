'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export default function ProductImageGallery({
  images,
  productName,
  selectedIndex,
  onSelectIndex,
}: ProductImageGalleryProps) {
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay || images.length <= 1) return;

    const timer = setInterval(() => {
      onSelectIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoplay, images.length, onSelectIndex]);

  const handlePrevious = () => {
    setAutoplay(false);
    onSelectIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setAutoplay(false);
    onSelectIndex((prev) => (prev + 1) % images.length);
  };

  const currentImage = images[selectedIndex] || images[0];

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div
        className="relative w-full aspect-square bg-white/5 rounded-lg overflow-hidden group cursor-pointer"
        onMouseEnter={() => setAutoplay(false)}
        onMouseLeave={() => setAutoplay(true)}
      >
        {currentImage && (
          <Image
            src={currentImage}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={selectedIndex === 0}
          />
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              size="icon"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              size="icon"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setAutoplay(false);
                onSelectIndex(index);
              }}
              className={cn(
                'relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all border-2',
                selectedIndex === index
                  ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]'
                  : 'border-white/10 hover:border-white/30'
              )}
            >
              <Image
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Progress Bar for Autoplay */}
      {autoplay && images.length > 1 && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary animate-pulse"
            style={{
              animation: 'progress 5s linear infinite',
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
