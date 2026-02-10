'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useCurrentUser } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ButterflyLogo } from '@/components/butterfly-logo';
import { 
  User, 
  Mail, 
  Package, 
  LogOut, 
  ArrowLeft, 
  Settings, 
  ShieldCheck, 
  Clock,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { getOrdersByIds, OrderWithItems } from '@/app/actions/orders';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { isLoading, logout } = useAuth();
  const user = useCurrentUser();
  const { toast } = useToast();
  
  const [customerOrders, setCustomerOrders] = useState<OrderWithItems[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Protected route logic
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Load orders from localStorage IDs
  useEffect(() => {
    async function loadOrders() {
      if (typeof window === 'undefined') return;
      setIsOrdersLoading(true);
      try {
        const savedIds = JSON.parse(localStorage.getItem('butterfly_orders') || '[]');
        if (savedIds.length > 0) {
          const orders = await getOrdersByIds(savedIds);
          setCustomerOrders(orders);
        }
      } catch (e) {
        console.error('Error loading profile orders:', e);
      } finally {
        setIsOrdersLoading(false);
      }
    }
    if (user) loadOrders();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Signed Out",
        description: "Your session has been securely closed.",
      });
      router.push('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto p-6 md:p-12 lg:p-20">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-12 w-12 border border-white/10">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white flex items-center justify-center rounded-full shadow-2xl border border-primary/20">
                <ButterflyLogo className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-headline italic tracking-tight">Your Portfolio</h1>
                <p className="text-primary uppercase tracking-[0.3em] text-[10px] font-bold mt-1">Luxury Member</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="border-white/10 text-white hover:bg-destructive hover:border-destructive rounded-none h-12 px-8 uppercase tracking-widest text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" /> Secure Sign Out
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Account Details */}
          <div className="space-y-8">
            <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl rounded-none shadow-2xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-xl font-headline italic flex items-center gap-2">
                  <User className="text-primary w-5 h-5" /> Account Details
                </CardTitle>
                <CardDescription className="text-white/40">Your private collection credentials</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Email Identification</p>
                  <div className="flex items-center gap-2 text-lg font-light text-white/90">
                    <Mail className="w-4 h-4 text-primary/60" />
                    {user.email}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Member Since</p>
                  <div className="flex items-center gap-2 text-lg font-light text-white/90">
                    <Calendar className="w-4 h-4 text-primary/60" />
                    {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Recently Joined'}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 uppercase tracking-widest">Security Status</span>
                    <Badge variant="outline" className="border-green-500/30 text-green-400 uppercase text-[8px] tracking-widest bg-green-500/5">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl rounded-none">
              <CardContent className="pt-6">
                <p className="text-sm text-primary italic leading-relaxed">
                  "Luxury is in each detail. As a member of Butterfly Store, you receive exclusive access to our most meticulous creations."
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order History */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline italic flex items-center gap-3">
                <Package className="text-primary" /> Acquisition History
              </h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{customerOrders.length} Pieces Collected</p>
            </div>

            {isOrdersLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-none bg-white/[0.02]">
                <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="font-body italic text-white/40">Your acquisition history is currently pristine.</p>
                <Link href="/">
                  <Button variant="link" className="text-primary uppercase tracking-widest text-[10px] mt-4">Browse Collection</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {customerOrders.map((order) => (
                  <Link key={order.id} href={`/order/${order.id}`}>
                    <Card className="bg-white/[0.03] border-white/10 hover:border-primary/30 transition-all duration-500 group rounded-none cursor-pointer">
                      <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <p className="font-mono text-sm font-bold text-primary">#{order.id.slice(-8).toUpperCase()}</p>
                              <Badge className={cn(
                                "rounded-none uppercase text-[8px] tracking-[0.2em] px-3",
                                order.status === 'delivered' ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-primary/20 text-primary border-primary/30"
                              )}>
                                {order.status}
                              </Badge>
                            </div>
                            
                            <div className="flex -space-x-3 overflow-hidden">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="relative w-12 h-16 border-2 border-black rounded-sm overflow-hidden flex-shrink-0 bg-neutral-900 shadow-xl">
                                  <img src={item.product.image} alt="piece" className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700" />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col items-end justify-between text-right">
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Acquisition Date</p>
                              <p className="text-sm font-light text-white/80">{new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                              <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Investment</p>
                                <p className="text-xl font-headline font-bold text-primary">${order.total.toLocaleString()}</p>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-colors duration-500">
                                <ChevronRight className="w-5 h-5 text-white group-hover:text-black transition-colors" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
