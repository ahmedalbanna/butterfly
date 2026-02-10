
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ButterflyLogo } from '@/components/butterfly-logo';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      setIsSent(true);
      toast({
        title: "Email Sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not send reset email. Please check the address.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <p className="text-xs uppercase tracking-[0.3em] text-white/40 mt-1">Recovery</p>
      </div>

      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <CardHeader>
          <CardTitle className="text-2xl font-headline italic text-white">Reset Password</CardTitle>
          <CardDescription className="text-white/40">
            {isSent 
              ? "Reset link has been dispatched to your email" 
              : "Enter your email to receive a secure reset link"}
          </CardDescription>
        </CardHeader>
        {isSent ? (
          <CardContent className="py-8 text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto animate-in zoom-in duration-500" />
            <p className="text-sm text-white/80 italic">Please check your inbox. The link will remain active for 1 hour.</p>
            <Button asChild variant="outline" className="w-full border-white/10 text-white hover:bg-white/10 rounded-none h-12 uppercase tracking-widest text-[10px] font-bold">
              <Link href="/login" title="Back to sign in">Back to Login</Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleReset}>
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary hover:bg-white hover:text-primary text-white font-bold uppercase tracking-widest h-12 rounded-none transition-all duration-500"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Dispatch Reset Link"}
              </Button>
              <p className="text-xs text-white/40 text-center">
                Remember your password?{" "}
                <Link href="/login" title="Return to sign in" className="text-primary hover:text-white font-bold transition-colors">Sign In</Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>

      <Link href="/" className="mt-8 text-white/20 hover:text-white/60 text-[10px] uppercase tracking-[0.4em] font-bold flex items-center gap-2 transition-all group">
        <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
        Return to Boutique
      </Link>
    </div>
  );
}
