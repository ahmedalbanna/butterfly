'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingCart, 
  ArrowLeft,
  MessageSquare,
  Phone,
  Wand2,
  Users,
  LogOut
} from 'lucide-react';
import { ButterflyLogo } from '@/components/butterfly-logo';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const navigation = [
  {
    name: 'Intelligence',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Elite Contacts',
    href: '/admin/contacts',
    icon: Users
  },
  {
    name: 'Orders History',
    href: '/admin/orders',
    icon: ShoppingCart
  },
  {
    name: 'Live Chat',
    href: '/admin/chat',
    icon: MessageSquare
  },
  {
    name: 'Voice Calls',
    href: '/admin/calls',
    icon: Phone
  },
  {
    name: 'Products Collection',
    href: '/admin/products',
    icon: Package
  },
  {
    name: 'AI Creator',
    href: '/admin/products/ai-create',
    icon: Wand2
  },
  {
    name: 'Categories',
    href: '/admin/categories',
    icon: FolderTree
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "Admin session securely closed.",
      });
      router.push('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-black border-r border-white/10">
      {/* Brand Header */}
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)] border border-primary/20">
            <ButterflyLogo className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-headline font-bold text-primary tracking-tighter">Butterfly</h2>
            <p className="text-[8px] uppercase tracking-[0.4em] text-white/40 font-bold -mt-1">Management</p>
          </div>
        </div>
        
        {/* Back to Store */}
        <Link 
          href="/"
          className="flex items-center gap-3 text-[10px] text-white/40 hover:text-primary transition-all group uppercase tracking-[0.2em] font-bold"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          <span>Exit Suite</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto hide-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-4 transition-all duration-500 group relative",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)]" />}
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-500 group-hover:scale-110",
                isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.6)]"
              )} />
              <span className="font-headline text-lg italic tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 space-y-4">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 w-full text-white/40 hover:text-destructive hover:bg-destructive/5 transition-all group uppercase tracking-[0.2em] font-bold text-[9px]"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Secure Sign Out</span>
        </button>
        <div className="text-center">
          <p className="text-[7px] uppercase tracking-[0.5em] text-white/20 font-bold">
            Vers. 2.0 • Luxury Core
          </p>
        </div>
      </div>
    </div>
  );
}
