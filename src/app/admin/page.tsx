import { getAllProductsForAdmin } from '@/app/actions/admin-products';
import { getCategoriesWithCounts } from '@/app/actions/categories';
import { getOrderStats } from '@/app/actions/admin-orders';
import { getActiveChatCount, getActiveChatSessions } from '@/app/actions/messages';
import { getIncomingCallCount, getActiveCalls } from '@/app/actions/calls';
import { 
  Package, 
  FolderTree, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  Phone,
  Sparkles,
  ArrowUpRight,
  Clock,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default async function AdminDashboard() {
  const [
    products, 
    categories, 
    orderStats, 
    activeChatCount, 
    chatSessionsResult, 
    incomingCallsCount, 
    activeCallsResult
  ] = await Promise.all([
    getAllProductsForAdmin(),
    getCategoriesWithCounts(),
    getOrderStats(),
    getActiveChatCount(),
    getActiveChatSessions(),
    getIncomingCallCount(),
    getActiveCalls()
  ]);
  
  const activeChats = chatSessionsResult.sessions?.slice(0, 5) || [];
  const incomingCalls = activeCallsResult.calls?.filter((c: any) => c.status === 'ringing').slice(0, 5) || [];

  const mainStats = [
    {
      title: 'Total Revenue',
      value: `$${orderStats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'Total boutique investment',
      color: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    {
      title: 'Active Orders',
      value: orderStats.pending + orderStats.confirmed,
      icon: ShoppingCart,
      description: `${orderStats.pending} awaiting processing`,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Collection Size',
      value: products.length,
      icon: Package,
      description: 'Luxury items curated',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      title: 'Active Chats',
      value: activeChatCount.count,
      icon: MessageSquare,
      description: 'Client inquiries',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      link: '/admin/chat'
    }
  ];

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-primary w-6 h-6" />
            <h1 className="text-4xl font-headline italic text-white">Boutique Intelligence</h1>
          </div>
          <p className="text-xs text-white/40 uppercase tracking-[0.3em] font-bold">Real-time performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-bold text-white uppercase tracking-tighter">Systems Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          const CardWrapper = stat.link ? Link : 'div';
          const cardProps = stat.link ? { href: stat.link } : {};
          
          return (
            <CardWrapper key={stat.title} {...cardProps}>
              <Card className="bg-black/40 border-white/10 hover:border-primary/30 transition-all duration-500 group cursor-pointer overflow-hidden relative">
                <div className={cn("absolute top-0 left-0 w-1 h-full", stat.color.replace('text-', 'bg-'))} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                    {stat.title}
                  </CardTitle>
                  <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", stat.bg)}>
                    <Icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-headline font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/40 font-medium italic">{stat.description}</p>
                    <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </CardWrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Communications */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Live Communications Widget */}
            <Card className="bg-black/40 border-white/10 flex flex-col">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-headline italic flex items-center gap-2">
                    <Phone className="w-4 h-4 text-orange-400" /> Incoming Calls
                  </CardTitle>
                  {incomingCallsCount.count > 0 && (
                    <Badge variant="default" className="bg-orange-500 animate-pulse rounded-none text-[8px] tracking-widest uppercase">
                      {incomingCallsCount.count} Waiting
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                {incomingCalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-20">
                    <Phone className="w-10 h-10 mb-2" />
                    <p className="text-xs uppercase tracking-widest">No active calls</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {incomingCalls.map((call: any) => (
                      <Link key={call.id} href="/admin/calls">
                        <div className="p-4 hover:bg-white/5 transition-colors group flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-400/10 flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-orange-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{call.customerName}</p>
                              <p className="text-[9px] text-white/40 uppercase tracking-widest">Ringing...</p>
                            </div>
                          </div>
                          <Clock className="w-3 h-3 text-white/20" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Chats Widget */}
            <Card className="bg-black/40 border-white/10 flex flex-col">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-headline italic flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-400" /> Active Chats
                  </CardTitle>
                  <Badge variant="default" className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-none text-[8px] tracking-widest uppercase">
                    {activeChatCount.count} Online
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                {activeChats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-20">
                    <MessageSquare className="w-10 h-10 mb-2" />
                    <p className="text-xs uppercase tracking-widest">Quiet in the lounge</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {activeChats.map((session: any) => (
                      <Link key={session.id} href="/admin/chat">
                        <div className="p-4 hover:bg-white/5 transition-colors group flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-400/10 flex items-center justify-center relative">
                              <UserCheck className="w-4 h-4 text-green-400" />
                              {session.customerConnected && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-black" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{session.message.customerName}</p>
                              <p className="text-[9px] text-white/40 uppercase tracking-widest truncate max-w-[120px]">{session.message.customerEmail}</p>
                            </div>
                          </div>
                          <span className="text-[9px] text-white/30 italic">
                            {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Acquisition Performance Table */}
          <Card className="bg-black/40 border-white/10 overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-xl font-headline italic text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Recent Acquisitions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40 font-bold bg-white/[0.01]">
                      <th className="px-6 py-4">Piece</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Market Price</th>
                      <th className="px-6 py-4">Inventory</th>
                      <th className="px-6 py-4">Portfolio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.slice(0, 6).map((product) => (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{product.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="rounded-none border-white/10 text-[9px] tracking-widest uppercase">
                            {product.category.name}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-primary font-bold font-mono text-sm">${product.price.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("text-xs font-mono", product.stock < 10 ? "text-destructive" : "text-white/60")}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {product.featured ? (
                            <Badge className="bg-primary/20 text-primary border-primary/30 rounded-none text-[8px] tracking-widest uppercase">Spotlight</Badge>
                          ) : (
                            <span className="text-[10px] text-white/20 uppercase tracking-widest">Standard</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Inventory & Category Insights */}
        <div className="space-y-8">
          {/* Category Distribution */}
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-lg font-headline italic flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-primary" /> Curated Segments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold">
                      <span className="text-white/60">{category.name}</span>
                      <span className="text-primary">{category.productCount} Items</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${(category.productCount / products.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Operational Quick Actions */}
          <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-headline italic text-primary">Concierge Quick Links</CardTitle>
              <CardDescription className="text-white/40 text-xs italic">Efficiency in management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Review Pending Orders', icon: ShoppingCart, href: '/admin/orders' },
                { label: 'Manage Elite Collection', icon: Package, href: '/admin/products' },
                { label: 'AI Inventory Generation', icon: Sparkles, href: '/admin/products/ai-create' },
                { label: 'CRM / Collector History', icon: UserCheck, href: '/admin/contacts' }
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button variant="ghost" className="w-full justify-start text-white/60 hover:text-primary hover:bg-primary/10 rounded-none h-12 text-[10px] uppercase tracking-widest font-bold border-b border-white/5">
                    <action.icon className="w-4 h-4 mr-3" /> {action.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
