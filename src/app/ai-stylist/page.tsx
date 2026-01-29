
"use client"

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateAccessorySuggestions } from '@/ai/flows/generate-accessory-suggestions';
import { Sparkles, Image as ImageIcon, Search, Loader2 } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import Link from 'next/link';
import Image from 'next/image';

export default function AIStylistPage() {
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    
    setIsAnalyzing(true);
    setSuggestions([]);
    setSuggestedProducts([]);

    try {
      const result = await generateAccessorySuggestions({
        styleDescription: description
      });

      if (result && result.suggestions) {
        setSuggestions(result.suggestions);
        
        // Find products that match the suggestion keywords
        const matches = result.suggestions.flatMap(keyword => {
          return PRODUCTS.filter(p => 
            p.name.toLowerCase().includes(keyword.toLowerCase()) || 
            p.description.toLowerCase().includes(keyword.toLowerCase()) ||
            p.category.toLowerCase().includes(keyword.toLowerCase())
          );
        });

        // Unique matches
        const uniqueMatches = Array.from(new Set(matches.map(m => m.id)))
          .map(id => matches.find(m => m.id === id))
          .slice(0, 3);
        
        setSuggestedProducts(uniqueMatches);
      }
    } catch (error) {
      console.error("AI Stylist Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 md:py-24 max-w-5xl">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-5xl md:text-6xl font-headline italic">Your Personal Stylist</h1>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Tell us what you're wearing or the mood you're aiming for, and our AI will curate the perfect accessories for your look.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-8 bg-white p-8 border shadow-sm rounded-sm">
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest text-secondary block">
                Describe your style or outfit
              </label>
              <Textarea 
                placeholder="I'm wearing a dark navy cocktail dress for an evening event..."
                className="min-h-[150px] rounded-none bg-muted/30 focus-visible:ring-primary border-none text-lg"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-4">
               <div className="p-6 border-2 border-dashed border-muted flex flex-col items-center justify-center space-y-2 opacity-50 cursor-not-allowed grayscale">
                  <ImageIcon className="w-8 h-8 text-secondary" />
                  <span className="text-xs font-bold uppercase tracking-widest">Upload Photo (Coming Soon)</span>
               </div>
            </div>

            <Button 
              className="w-full h-14 bg-primary text-white rounded-none uppercase tracking-widest font-bold text-lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !description}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Look...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" /> Get Recommendations
                </>
              )}
            </Button>
          </div>

          <div className="space-y-8">
            {isAnalyzing && (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-muted w-1/2" />
                <div className="h-64 bg-muted w-full rounded-sm" />
                <div className="h-64 bg-muted w-full rounded-sm" />
              </div>
            )}

            {!isAnalyzing && suggestedProducts.length > 0 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-headline italic">We recommend...</h2>
                  <p className="text-sm text-secondary">Based on your description: {suggestions.join(', ')}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {suggestedProducts.map(product => (
                    <Link 
                      key={product.id} 
                      href={`/product/${product.id}`}
                      className="group flex gap-6 p-4 border rounded-sm hover:shadow-md transition-all bg-white"
                    >
                      <div className="relative w-24 h-32 shrink-0 overflow-hidden bg-muted">
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="flex flex-col justify-center space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-primary">{product.category}</span>
                        <h3 className="text-xl font-headline group-hover:text-primary transition-colors">{product.name}</h3>
                        <p className="text-sm font-medium">${product.price.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <Link href="/shop" className="block text-center text-sm font-bold uppercase tracking-widest text-primary hover:underline">
                  Browse Full Collection
                </Link>
              </div>
            )}

            {!isAnalyzing && suggestedProducts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-sm opacity-50">
                <Sparkles className="w-12 h-12 text-muted mb-4" />
                <p className="text-center text-secondary">Your AI-curated recommendations will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
