'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ButterflyLogo } from '@/components/butterfly-logo';
import { Loader2, ArrowRight } from 'lucide-react';
import { syncUserToDb } from '@/app/actions/users';

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // 1. Create user profile in Firestore (for roles/auth)
      await setDoc(doc(firestore, 'users', newUser.uid), {
        id: newUser.uid,
        email: email,
        isAdmin: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Mirror user in PostgreSQL (for Contacts/CRM)
      await syncUserToDb({
        id: newUser.uid,
        email: email,
        name: email.split('@')[0], // Default name from email
      });

      toast({
        title: "Account Created",
        description: "Welcome to the Butterfly Store family.",
      });
      router.push('/');
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
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
        <h1 className="text-3xl font-headline font-bold text-primary tracking-tighter text-center">Butterfly Store</h1>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40 mt-1">New Membership</p>
      </div>

      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <CardHeader>
          <CardTitle className="text-2xl font-headline italic text-white">Create Account</CardTitle>
          <CardDescription className="text-white/40">Join our exclusive collection of accessories</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
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
              <Label htmlFor="password" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white rounded-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
            </Button>
            <p className="text-xs text-white/40 text-center">
              Already have an account?{" "}
              <Link href="/login" title="Sign in to existing account" className="text-primary hover:text-white font-bold transition-colors">Sign In</Link>
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
