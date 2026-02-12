'use client';

import { useEffect, useState } from 'react';
import { getAllOrders, deleteOrder, getOrderStats } from '@/app/actions/admin-orders';
import { updateOrderStatus } from '@/app/actions/orders';
import { getCustomOrdersForAdmin, updateCustomOrderQuote, updateCustomOrderStatus } from '@/app/actions/custom-orders';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Package, Eye, ShoppingCart, TrendingUp, Search, Filter, ArrowUpRight, DollarSign, Clock, CheckCircle2, Landmark, CreditCard, Bitcoin, UserRound, Sparkles, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order, OrderItem, Product } from '@prisma/client';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [selectedCustomOrder, setSelectedCustomOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCustomDetailOpen, setIsCustomDetailOpen] = useState(false);
  const [quotedPrice, setQuotedPrice] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [ordersData, statsData, customOrdersData] = await Promise.all([
      getAllOrders(),
      getOrderStats(),
      getCustomOrdersForAdmin()
    ]);
    setOrders(ordersData);
    setStats(statsData);
    if (customOrdersData.success) {
      setCustomOrders(customOrdersData.customOrders || []);
    }
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

  const filteredCustomOrders = customOrders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomOrderClick = (customOrder: any) => {
    setSelectedCustomOrder(customOrder);
    setQuotedPrice(customOrder.quotedPrice?.toString() || '');
    setQuoteNotes(customOrder.quoteNotes || '');
    setIsCustomDetailOpen(true);
  };

  const handleSubmitQuote = async () => {
    if (!selectedCustomOrder || !quotedPrice) {
      toast({
        title: 'Missing information',
        description: 'Please enter a quoted price',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingQuote(true);
    try {
      const result = await updateCustomOrderQuote(
        selectedCustomOrder.id,
        parseFloat(quotedPrice),
        quoteNotes
      );

      if (result.success) {
        toast({
          title: 'Quote submitted',
          description: 'Customer will be notified of the quote',
        });
        await loadData();
        setIsCustomDetailOpen(false);
      } else {
        toast({
          title: 'Failed to submit quote',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleCustomOrderStatusChange = async (orderId: string, newStatus: string) => {
    const result = await updateCustomOrderStatus(orderId, newStatus);
    if (result.success) {
      toast({
        title: 'Status updated',
        description: `Custom order is now ${newStatus}`,
      });
      await loadData();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const getCustomOrderStatusConfig = (status: string) => {
    const configs: any = {
      pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      quoted: { label: 'Quoted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      in_production: { label: 'In Production', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      completed: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    };
    return configs[status] || configs.pending;
  };

  const pendingCustomOrdersCount = customOrders.filter(o => o.status === 'pending').length;

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

      {/* Tabs for Orders and Custom Orders */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1">
          <TabsTrigger value="orders" className="data-[state=active]:bg-white/10 data-[state=active]:text-yellow-500">
            All Orders
          </TabsTrigger>
          <TabsTrigger value="custom" className="data-[state=active]:bg-white/10 data-[state=active]:text-yellow-500">
            <Sparkles className="w-4 h-4 mr-2" />
            Custom Orders
            {pendingCustomOrdersCount > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-black">{pendingCustomOrdersCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Regular Orders Tab */}
        <TabsContent value="orders" className="mt-6">
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
        </TabsContent>

        {/* Custom Orders Tab */}
        <TabsContent value="custom" className="mt-6">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredCustomOrders.length === 0 ? (
            <div className="text-center py-32 bg-black/20 border border-dashed border-white/10">
              <Sparkles className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 italic font-headline text-2xl">No custom order requests</p>
            </div>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-none overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black/60 border-b border-white/10">
                  <tr className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    <th className="px-6 py-5">Request ID</th>
                    <th className="px-6 py-5">Customer</th>
                    <th className="px-6 py-5">Images</th>
                    <th className="px-6 py-5">Submitted</th>
                    <th className="px-6 py-5">Quoted Price</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCustomOrders.map((customOrder) => {
                    const statusConfig = getCustomOrderStatusConfig(customOrder.status);
                    return (
                      <tr key={customOrder.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-5">
                          <span className="font-mono text-sm font-bold text-primary">#{customOrder.id.slice(-8).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-headline text-white group-hover:text-primary transition-colors">{customOrder.customerName}</p>
                            <p className="text-[10px] text-white/40 tracking-widest uppercase truncate max-w-[150px]">{customOrder.customerEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex -space-x-2">
                            {customOrder.referenceImages.slice(0, 3).map((img: string, idx: number) => (
                              <div key={idx} className="w-10 h-10 bg-neutral-900 border border-black rounded-sm overflow-hidden relative shadow-lg">
                                <Image src={img} alt={`Ref ${idx + 1}`} fill className="object-cover" />
                              </div>
                            ))}
                            {customOrder.referenceImages.length > 3 && (
                              <div className="w-10 h-10 bg-neutral-800 border border-black rounded-sm flex items-center justify-center text-xs text-white/60">
                                +{customOrder.referenceImages.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-[10px] uppercase tracking-widest text-white/60">
                            <p>{new Date(customOrder.createdAt).toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {customOrder.quotedPrice ? (
                            <span className="text-white font-bold font-mono">${customOrder.quotedPrice.toLocaleString()}</span>
                          ) : (
                            <span className="text-white/40 text-sm">Not quoted</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <Select value={customOrder.status} onValueChange={(value) => handleCustomOrderStatusChange(customOrder.id, value)}>
                            <SelectTrigger className={cn("w-36 h-8 text-[9px] uppercase font-bold tracking-[0.2em] rounded-none bg-black/40", statusConfig.color)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
                              <SelectItem value="pending" className="text-[9px] uppercase tracking-widest font-bold">Pending</SelectItem>
                              <SelectItem value="quoted" className="text-[9px] uppercase tracking-widest font-bold">Quoted</SelectItem>
                              <SelectItem value="approved" className="text-[9px] uppercase tracking-widest font-bold">Approved</SelectItem>
                              <SelectItem value="in_production" className="text-[9px] uppercase tracking-widest font-bold">In Production</SelectItem>
                              <SelectItem value="completed" className="text-[9px] uppercase tracking-widest font-bold">Completed</SelectItem>
                              <SelectItem value="cancelled" className="text-[9px] uppercase tracking-widest font-bold">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCustomOrderClick(customOrder)}
                            className="h-8 w-8 text-white/40 hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                    <p className="text-white/60 font-body leading-relaxed whitespace-pre-wrap">{selectedOrder.customerAddress}</p>
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

      {/* Custom Order Details Modal */}
      <Dialog open={isCustomDetailOpen} onOpenChange={setIsCustomDetailOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto rounded-none p-0">
          <DialogHeader className="p-8 border-b border-white/10 bg-black/40">
            <div className="flex justify-between items-end">
              <DialogTitle className="text-3xl font-headline italic text-primary flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Custom Order #{selectedCustomOrder?.id.slice(-12).toUpperCase()}
              </DialogTitle>
              <Badge variant="outline" className="rounded-none border-primary/30 text-primary uppercase text-[8px] tracking-[0.3em] h-6 px-3">
                {selectedCustomOrder?.status}
              </Badge>
            </div>
          </DialogHeader>
          
          {selectedCustomOrder && (
            <div className="p-8 space-y-8">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">Customer Information</p>
                  <div className="bg-white/[0.03] p-4 border border-white/5 space-y-2">
                    <p className="text-white text-sm font-headline italic">{selectedCustomOrder.customerName}</p>
                    <p className="text-white/60 font-mono text-sm">{selectedCustomOrder.customerEmail}</p>
                    {selectedCustomOrder.customerPhone && <p className="text-white/60 font-mono text-sm">{selectedCustomOrder.customerPhone}</p>}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">Submission Details</p>
                  <div className="bg-white/[0.03] p-4 border border-white/5 space-y-2">
                    <p className="text-white/60 text-sm">
                      <span className="text-white/40">Submitted:</span> {new Date(selectedCustomOrder.createdAt).toLocaleString()}
                    </p>
                    {selectedCustomOrder.quotedAt && (
                      <p className="text-white/60 text-sm">
                        <span className="text-white/40">Quoted:</span> {new Date(selectedCustomOrder.quotedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">Customer Vision</p>
                <div className="bg-white/[0.03] p-4 border border-white/5">
                  <p className="text-white/80 whitespace-pre-wrap">{selectedCustomOrder.description}</p>
                </div>
              </div>

              {/* Reference Images */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">Reference Images</p>
                <div className="grid grid-cols-4 gap-4">
                  {selectedCustomOrder.referenceImages.map((imageUrl: string, index: number) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden border border-white/20 hover:border-yellow-500/50 transition cursor-pointer"
                      onClick={() => window.open(imageUrl, '_blank')}
                    >
                      <Image
                        src={imageUrl}
                        alt={`Reference ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote Form */}
              <div className="space-y-4 border-t border-white/10 pt-8">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">Provide Quote</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quotedPrice" className="text-white mb-2 block">
                      Quoted Price <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quotedPrice"
                      type="number"
                      step="0.01"
                      value={quotedPrice}
                      onChange={(e) => setQuotedPrice(e.target.value)}
                      placeholder="0.00"
                      className="bg-black border-white/20 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="quoteNotes" className="text-white mb-2 block">
                    Notes for Customer (Optional)
                  </Label>
                  <Textarea
                    id="quoteNotes"
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="Add any notes about materials, timeline, or special considerations..."
                    className="bg-black border-white/20 text-white min-h-[100px]"
                  />
                </div>
                <Button
                  onClick={handleSubmitQuote}
                  disabled={isSubmittingQuote || !quotedPrice}
                  className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-serif text-lg h-12"
                >
                  {isSubmittingQuote ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Quote...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 mr-2" />
                      Submit Quote to Customer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
