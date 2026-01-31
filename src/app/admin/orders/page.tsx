'use client';

import { useEffect, useState } from 'react';
import { getAllOrders, deleteOrder } from '@/app/actions/admin-orders';
import { updateOrderStatus } from '@/app/actions/orders';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Package, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order, OrderItem, Product } from '@prisma/client';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    const data = await getAllOrders();
    setOrders(data);
    setIsLoading(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result) {
      toast({
        title: 'Success',
        description: 'Order status updated'
      });
      loadOrders();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (order: OrderWithItems) => {
    if (!confirm(`Are you sure you want to delete order #${order.id.slice(0, 8)}?`)) return;

    const result = await deleteOrder(order.id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Order deleted successfully'
      });
      loadOrders();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete order',
        variant: 'destructive'
      });
    }
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const viewOrderDetails = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-4xl font-headline italic text-white mb-2">Orders</h1>
        <p className="text-sm text-white/60 uppercase tracking-wider">Manage customer orders</p>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg italic">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <Card key={order.id} className="bg-black/40 border-white/10 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-headline text-xl text-white">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs uppercase tracking-wider font-bold border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Customer</p>
                          <p className="text-white font-medium">{order.customerName}</p>
                          <p className="text-white/60 text-xs">{order.customerEmail}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Date</p>
                          <p className="text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="text-white/60 text-xs">{new Date(order.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Items</p>
                          <p className="text-white">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Total</p>
                          <p className="text-primary text-xl font-bold">${order.total.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="flex items-center gap-2 pt-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="w-10 h-10 bg-white/5 rounded overflow-hidden relative">
                            {item.product.image && (
                              <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                            )}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-xs text-white/60">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                        <SelectTrigger className="w-40 bg-black/40 border-white/20 text-white h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => viewOrderDetails(order)}
                          className="h-9 w-9 text-white/60 hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(order)}
                          className="h-9 w-9 text-white/60 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline italic text-primary">
              Order Details #{selectedOrder?.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-white/60 font-bold">Customer Information</h3>
                <div className="bg-black/40 p-4 rounded border border-white/10 space-y-2">
                  <p className="text-white"><span className="text-white/60">Name:</span> {selectedOrder.customerName}</p>
                  <p className="text-white"><span className="text-white/60">Email:</span> {selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && (
                    <p className="text-white"><span className="text-white/60">Phone:</span> {selectedOrder.customerPhone}</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-white/60 font-bold">Shipping Address</h3>
                <div className="bg-black/40 p-4 rounded border border-white/10">
                  <p className="text-white whitespace-pre-wrap">{selectedOrder.shippingAddress}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-white/60 font-bold">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-black/40 p-4 rounded border border-white/10">
                      <div className="w-16 h-16 bg-white/5 rounded overflow-hidden relative shrink-0">
                        {item.product.image && (
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-headline text-white">{item.product.name}</p>
                        <p className="text-xs text-white/60">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold">${(item.price * item.quantity).toLocaleString()}</p>
                        <p className="text-xs text-white/60">${item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-xl">
                  <span className="font-headline italic text-white">Total</span>
                  <span className="font-headline font-bold text-primary">${selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
