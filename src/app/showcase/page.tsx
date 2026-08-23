"use client"

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PRODUCTS } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { generateAccessorySuggestions } from '@/ai/flows/generate-accessory-suggestions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload, Wand2, ShoppingBag, Loader2 } from 'lucide-react';

export default function ShowcasePage() {
  const [styleDescription, setStyleDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please use an image under 4MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUri(reader.result as string);
      setStyleDescription('');
    };
    reader.readAsDataURL(file);
  };

  const handleSuggest = async () => {
    if (!imageUri && !styleDescription.trim()) {
      toast({ title: "Add your style", description: "Upload an outfit photo or describe your style.", variant: "destructive" });
      return;
    }
    if (imageUri && styleDescription.trim()) {
      toast({ title: "Choose one", description: "Use either image or description, not both.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await generateAccessorySuggestions(imageUri ? { imageUri } : { styleDescription: styleDescription.trim() });
      setSuggestions(result.suggestions);
      if (result.suggestions.length === 0) {
        toast({ title: "No matches", description: "Try a different style description." });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to generate suggestions";
      const isConfig = msg.includes('GEMINI_API_KEY');
      toast({ title: isConfig ? "Stylist unavailable" : "Failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedProducts = suggestions.map(name => PRODUCTS.find(p => p.name === name)).filter(Boolean) as typeof PRODUCTS;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="text-center mb-10">
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full uppercase text-[10px] tracking-[0.2em] mb-4"><Sparkles className="w-3 h-3 mr-1" /> Style AI</Badge>
          <h1 className="text-4xl md:text-5xl font-headline">Find Your Exquisite Match</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Upload an outfit photo or describe your aesthetic. The Luxe Stylist will curate 3–5 pieces from our boutique — grounded in our real catalog, never hallucinated.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="space-y-6 border bg-card p-6 rounded-sm">
            <div>
              <Label className="uppercase text-xs tracking-widest font-bold flex items-center gap-2"><Upload className="w-4 h-4" /> Outfit Photo (optional)</Label>
              <Input type="file" accept="image/*" onChange={handleImageChange} className="mt-2 rounded-none" />
              {imageUri && (
                <div className="mt-4 relative aspect-[4/3] overflow-hidden rounded-sm border">
                  <Image src={imageUri} alt="Outfit preview" fill className="object-cover" />
                </div>
              )}
              {imageUri && <Button variant="ghost" size="sm" onClick={() => setImageUri(null)} className="mt-2 text-xs uppercase">Remove image</Button>}
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">Max 4MB. Use image OR description.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div>
              <Label htmlFor="style" className="uppercase text-xs tracking-widest font-bold">Style Description</Label>
              <Textarea
                id="style"
                value={styleDescription}
                onChange={(e) => { setStyleDescription(e.target.value); if (e.target.value) setImageUri(null); }}
                placeholder="e.g., Minimalist Scandinavian office wear, neutral tones, love gold jewelry and silk..."
                rows={5}
                className="mt-2 rounded-none"
                disabled={!!imageUri}
              />
              <p className="text-[10px] text-muted-foreground mt-2">{styleDescription.length}/400</p>
            </div>

            <Button onClick={handleSuggest} disabled={isLoading} className="w-full h-12 bg-primary text-white rounded-none uppercase tracking-widest font-bold">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Curating...</> : <><Wand2 className="w-4 h-4 mr-2" /> Curate My Look</>}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">Powered by Gemini 2.5 Flash • Catalog-grounded</p>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <h2 className="font-headline text-2xl">Curated Selection</h2>
            {suggestions.length === 0 && !isLoading && (
              <div className="border border-dashed p-10 text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Your personalized suggestions will appear here.</p>
              </div>
            )}
            {isLoading && (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-sm" />)}
              </div>
            )}
            <div className="grid gap-4">
              {suggestedProducts.map(p => (
                <div key={p.id} className="flex gap-4 border bg-card p-4">
                  <Link href={`/product/${p.id}`} className="relative w-24 h-28 shrink-0 bg-muted overflow-hidden block">
                    <Image src={p.image} alt={p.name} fill className="object-cover" sizes="96px" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${p.id}`} className="font-headline hover:text-primary line-clamp-1">{p.name}</Link>
                    <p className="text-xs uppercase tracking-widest text-primary font-bold">{p.category} • ${p.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.materials}</p>
                    <Link href={`/product/${p.id}`} className="inline-flex mt-3">
                      <Button size="sm" className="rounded-none bg-primary text-white h-8 text-xs uppercase tracking-widest"><ShoppingBag className="w-3 h-3 mr-1" /> View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {suggestions.length > 0 && suggestedProducts.length === 0 && (
              <div className="text-sm text-muted-foreground">
                <p>AI suggested: {suggestions.join(', ')}</p>
                <p className="mt-2">These names didn’t match catalog after filtering. Try again.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
