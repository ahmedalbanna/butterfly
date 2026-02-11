
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ButterflyLogo } from '@/components/butterfly-logo';
import { Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login(email, password);
      toast({
        title: "Welcome Back",
        description: "Successfully signed in to your account.",
      });
      
      // Redirect admin users to admin dashboard, regular users to home
      if (userData.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-16 h-16 bg-white flex items-center justify-center rounded-full shadow-2xl border border-primary/20 mx-auto mb-4">
          <ButterflyLogo className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-headline font-bold text-primary tracking-tighter">Butterfly Store</h1>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40 mt-1">Luxury Access</p>
      </div>

      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <CardHeader>
          <CardTitle className="text-2xl font-headline italic text-white">Sign In</CardTitle>
          <CardDescription className="text-white/40">Enter your credentials to access the boutique</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@luxury.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white rounded-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Password</Label>
                <Link href="/forgot-password" title="Recover account" className="text-[10px] text-primary hover:text-white uppercase tracking-widest transition-colors">Forgot Password?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white rounded-none focus:border-primary/50 transition-colors"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-white hover:text-primary text-white font-bold uppercase tracking-widest h-12 rounded-none transition-all duration-500"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
            <p className="text-xs text-white/40 text-center">
              Don't have an account?{" "}
              <Link href="/signup" title="Create new account" className="text-primary hover:text-white font-bold transition-colors">Sign Up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <Link href="/" className="mt-8 text-white/20 hover:text-white/60 text-[10px] uppercase tracking-[0.4em] font-bold flex items-center gap-2 transition-all group">
        <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
        Return to Boutique
      </Link>
    </div>
  );
}
