'use client';

import { useEffect, useState } from 'react';
import { getAllOrders, deleteOrder, getOrderStats } from '@/app/actions/admin-orders';
import { updateOrderStatus } from '@/app/actions/orders';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Package, Eye, ShoppingCart, TrendingUp, Search, Filter, ArrowUpRight, DollarSign, Clock, CheckCircle2, Landmark, CreditCard, Bitcoin, UserRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order, OrderItem, Product } from '@prisma/client';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: {
      id: string;
      name: string;
      image: string;
    };
  })[];
};

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [ordersData, statsData] = await Promise.all([
      getAllOrders(),
      getOrderStats()
    ]);
    setOrders(ordersData);
    setStats(statsData);
    setIsLoading(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result) {
      toast({
        title: 'Boutique Ledger Updated',
        description: `Order #${orderId.slice(-8).toUpperCase()} is now ${newStatus.toUpperCase()}.`
      });
      loadData();
    } else {
      toast({
        title: 'System Error',
        description: 'Failed to update acquisition status.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (order: OrderWithItems) => {
    if (!confirm(`Are you sure you want to purge order #${order.id.slice(0, 8)} from the boutique ledger?`)) return;

    const result = await deleteOrder(order.id);
    if (result.success) {
      toast({
        title: 'Record Purged',
        description: 'Order history has been updated.'
      });
      loadData();
    } else {
      toast({
        title: 'Integrity Warning',
        description: result.error || 'Failed to delete order.',
        variant: 'destructive'
      });
    }
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getPaymentIcon = (method: string | undefined) => {
    switch (method) {
      case 'bank_transfer': return <Landmark className="w-3 h-3" />;
      case 'crypto': return <Bitcoin className="w-3 h-3" />;
      case 'concierge': return <UserRound className="w-3 h-3" />;
      default: return <CreditCard className="w-3 h-3" />;
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-headline italic text-white mb-2">Acquisition Management</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Butterfly Store Logistics Protocol</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input 
              placeholder="Search IDs, Clients, or Emails..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border-white/10 pl-10 h-12 text-sm rounded-none focus:border-primary/50"
            />
          </div>
          <Button variant="outline" className="h-12 rounded-none border-white/10 text-white/60 hover:bg-white/5 uppercase tracking-widest text-[10px] font-bold">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
            { label: 'Active Orders', value: stats.pending + stats.confirmed, icon: ShoppingCart, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Fulfilled Pieces', value: stats.delivered, icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Pending Processing', value: stats.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' }
          ].map((stat) => (
            <Card key={stat.label} className="bg-black/40 border-white/10 overflow-hidden relative group hover:border-primary/30 transition-all duration-500">
              <div className={cn("absolute top-0 left-0 w-1 h-full", stat.color.replace('text-', 'bg-'))} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{stat.label}</span>
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                </div>
                <div className="text-2xl font-headline font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Orders Table */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-32 bg-black/20 border border-dashed border-white/10">
          <Package className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 italic font-headline text-2xl">No acquisitions found in the boutique ledger</p>
        </div>
      ) : (
      <div className="bg-black/40 border border-white/10 rounded-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/60 border-b border-white/10">
            <tr className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
              <th className="px-6 py-5">Piece Identifier</th>
              <th className="px-6 py-5">Collector Profile</th>
              <th className="px-6 py-5">Protocol</th>
              <th className="px-6 py-5">Date & Time</th>
              <th className="px-6 py-5">Investment</th>
                <th className="px-6 py-5">Logistic Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="w-8 h-10 bg-neutral-900 border border-black rounded-sm overflow-hidden relative shadow-lg">
                              <Image src={item.product.image} alt={item.product.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            </div>
                          ))}
                        </div>
                      <span className="font-mono text-sm font-bold text-primary">#{order.id.slice(-8).toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-headline text-white group-hover:text-primary transition-colors">{order.customerName}</p>
                      <p className="text-[10px] text-white/40 tracking-widest uppercase truncate max-w-[150px]">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="outline" className="rounded-none border-white/5 text-[8px] uppercase tracking-widest gap-1 text-white/40">
                      {getPaymentIcon(order.paymentMethod)}
                      {order.paymentMethod?.replace('_', ' ') || 'credit_card'}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[10px] uppercase tracking-widest text-white/60">
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="opacity-40">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-white font-bold font-mono">${order.total.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5">
                    <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                      <SelectTrigger className={cn("w-36 h-8 text-[9px] uppercase font-bold tracking-[0.2em] rounded-none bg-black/40", statusConfig.color)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
                        {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="text-[9px] uppercase tracking-widest font-bold">
                              {status.label}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                          className="h-8 w-8 text-white/40 hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(order)}
                          className="h-8 w-8 text-white/40 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto rounded-none p-0">
          <DialogHeader className="p-8 border-b border-white/10 bg-black/40">
            <div className="flex justify-between items-end">
              <DialogTitle className="text-3xl font-headline italic text-primary">
                Order Log #{selectedOrder?.id.slice(-12).toUpperCase()}
              </DialogTitle>
              <Badge variant="outline" className="rounded-none border-primary/30 text-primary uppercase text-[8px] tracking-[0.3em] h-6 px-3">
                {selectedOrder?.status}
              </Badge>
            </div>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-2 gap-8 text-[10px] uppercase tracking-[0.2em] font-bold">
                <div className="space-y-3">
                  <p className="text-white/20">Collector Identification</p>
                  <div className="bg-white/[0.03] p-4 border border-white/5 space-y-1">
                    <p className="text-white text-sm font-headline italic">{selectedOrder.customerName}</p>
                    <p className="text-white/40 font-mono">{selectedOrder.customerEmail}</p>
                    {selectedOrder.customerPhone && <p className="text-white/40 font-mono">{selectedOrder.customerPhone}</p>}
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-primary">
                      {getPaymentIcon(selectedOrder.paymentMethod)}
                      <span className="opacity-80">Protocol: {selectedOrder.paymentMethod?.replace('_', ' ') || 'Credit Card'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-white/20">Logistic Destination</p>
                  <div className="bg-white/[0.03] p-4 border border-white/5">
                    <p className="text-white/60 font-body leading-relaxed whitespace-pre-wrap">{selectedOrder.shippingAddress}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">Curated Inventory</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-6 bg-white/[0.02] p-4 border border-white/5 hover:border-primary/20 transition-all group">
                      <div className="w-16 h-20 bg-neutral-900 rounded-sm overflow-hidden relative shrink-0 shadow-xl">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-headline text-lg italic text-white mb-1">{item.product.name}</p>
                        <p className="text-[9px] uppercase tracking-widest text-white/40">Unit Price: ${item.price.toLocaleString()} • Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold font-mono">${(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Total Boutique Investment</p>
                  <p className="text-4xl font-headline font-bold text-primary">${selectedOrder.total.toLocaleString()}</p>
                </div>
                <Button className="h-12 bg-white text-black hover:bg-primary hover:text-white rounded-none uppercase tracking-widest font-bold text-[10px] px-8 transition-all">
                  <TrendingUp className="w-4 h-4 mr-2" /> Finalize Processing
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
