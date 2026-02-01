'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingCart, 
  Sparkles,
  ArrowLeft,
  MessageSquare,
  Phone,
  Wand2
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Live Chat',
    href: '/admin/live-chat',
    icon: MessageSquare
  },
  {
    name: 'Messages',
    href: '/admin/messages',
    icon: MessageSquare
  },
  {
    name: 'Voice Calls',
    href: '/admin/calls',
    icon: Phone
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package
  },
  {
    name: 'AI Product Creator',
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

  return (
    <div className="flex flex-col h-full bg-black border-r border-white/10">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-sm rotate-45 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            <Sparkles className="text-white w-5 h-5 -rotate-45" />
          </div>
          <div>
            <h2 className="text-2xl font-headline font-bold text-primary tracking-tighter">LuxeFinds</h2>
            <p className="text-[8px] uppercase tracking-[0.3em] text-white/40 font-bold">Admin Panel</p>
          </div>
        </div>
        
        {/* Back to Store */}
        <Link 
          href="/"
          className="flex items-center gap-2 text-xs text-white/60 hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          <span className="uppercase tracking-wider font-bold">Back to Store</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-300 group",
                isActive 
                  ? "bg-primary/20 text-primary border-l-2 border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                  : "text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.6)]"
              )} />
              <span className="font-headline text-lg">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-bold">
            No Authentication Required
          </p>
          <p className="text-[10px] text-white/20 mt-1 italic">
            Luxury Management Suite
          </p>
        </div>
      </div>
    </div>
  );
}
