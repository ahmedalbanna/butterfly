'use client';

import { useAuth, useCurrentUser } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: authLoading } = useAuth();
  const user = useCurrentUser();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Only proceed once auth loading is finished
    if (!authLoading) {
      if (!user) {
        // No user found, redirect to login
        router.push('/login?redirect=/admin');
      } else if (user.isAdmin === true) {
        // User is an admin, grant access
        setIsAuthorized(true);
      } else {
        // User is authenticated but NOT an admin
        setIsAuthorized(false);
      }
    }
  }, [user, authLoading, router]);

  // 1. Initial Loading Screen
  if (authLoading || isAuthorized === null) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4 relative" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Verifying Admin Credentials</p>
      </div>
    );
  }

  // 2. Access Denied Screen
  if (isAuthorized === false) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 border border-destructive/20">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-3xl font-headline italic mb-2">Restricted Access</h2>
        <p className="text-white/40 max-w-md mb-8 text-sm uppercase tracking-widest font-bold">
          Your account does not possess administrative privileges for the Butterfly Management Suite.
        </p>
        <Link href="/">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-none uppercase tracking-widest text-[10px] h-12 px-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Boutique
          </Button>
        </Link>
      </div>
    );
  }

  // 3. Authenticated Admin View
  return (
    <div className="h-screen w-full flex bg-black text-white overflow-hidden selection:bg-primary selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-20">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a] relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
