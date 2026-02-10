'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ButterflyLogo } from '@/components/butterfly-logo';
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid Link',
        description: 'No reset token provided. Please request a new password reset.',
        variant: 'destructive',
      });
      router.push('/forgot-password');
    }
  }, [token, router, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: 'Error',
        description: 'Invalid reset token.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Reset Failed',
          description: data.error || 'Could not reset password. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: 'Success',
        description: 'Your password has been reset. Redirecting to login...',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
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
        <p className="text-xs uppercase tracking-[0.3em] text-white/40 mt-1">Reset Your Password</p>
      </div>

      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
        {!isSuccess ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-headline italic text-white">Reset Password</CardTitle>
              <CardDescription className="text-white/40">Enter your new password below</CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="bg-white/5 border-white/10 text-white rounded-none focus:border-primary/50 transition-colors"
                  />
                  <p className="text-[10px] text-white/40">Minimum 8 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
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
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                </Button>
                <p className="text-xs text-white/40 text-center">
                  Remember your password?{' '}
                  <Link href="/login" className="text-primary hover:text-white font-bold transition-colors">
                    Sign In
                  </Link>
                </p>
              </CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline italic text-white">Password Reset</CardTitle>
              <CardDescription className="text-white/40">Your password has been reset successfully</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/60 text-center text-sm">
                Redirecting you to the login page...
              </p>
            </CardContent>
          </>
        )}
      </Card>

      <Link href="/" className="mt-8 text-white/20 hover:text-white/60 text-[10px] uppercase tracking-[0.4em] font-bold flex items-center gap-2 transition-all group">
        <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
        Return to Boutique
      </Link>
    </div>
  );
}
