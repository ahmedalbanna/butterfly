'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { getCustomOrderById, approveCustomOrder } from '@/app/actions/custom-orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, CheckCircle, Clock, Package, Loader2, Mail, Phone, FileText, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CustomOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  referenceImages: string[];
  status: string;
  quotedPrice?: number;
  quoteNotes?: string;
  quotedAt?: string;
  approvedAt?: string;
  completedAt?: string;
  createdAt: string;
  order?: {
    id: string;
    status: string;
    total: number;
  };
};

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-500', icon: Clock },
  quoted: { label: 'Quote Provided', color: 'bg-blue-500', icon: DollarSign },
  approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
  in_production: { label: 'In Production', color: 'bg-purple-500', icon: Package },
  completed: { label: 'Completed', color: 'bg-emerald-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: Clock },
};

export default function CustomOrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [customOrder, setCustomOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    loadCustomOrder();
  }, [orderId]);

  const loadCustomOrder = async () => {
    setLoading(true);
    try {
      const result = await getCustomOrderById(orderId);
      if (result.success && result.customOrder) {
        setCustomOrder(result.customOrder);
      } else {
        toast({
          title: 'Not found',
          description: result.error || 'Custom order not found',
          variant: 'destructive',
        });
        router.push('/');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load custom order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!customOrder) return;

    setApproving(true);
    try {
      const result = await approveCustomOrder(orderId);
      if (result.success) {
        toast({
          title: 'Quote approved',
          description: 'Your custom order has been approved. We will begin production shortly.',
        });
        await loadCustomOrder();
      } else {
        toast({
          title: 'Approval failed',
          description: result.error || 'Failed to approve quote',
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
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!customOrder) {
    return null;
  }

  const statusInfo = statusConfig[customOrder.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            <h1 className="text-5xl font-serif text-yellow-500">Custom Order Tracking</h1>
          </div>
          <p className="text-white/70 text-lg">Order ID: {customOrder.id}</p>
        </div>

        {/* Status Banner */}
        <Card className="bg-black border-white/10 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${statusInfo.color}`}>
                  <StatusIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Current Status</p>
                  <p className="text-2xl font-serif text-yellow-500">{statusInfo.label}</p>
                </div>
              </div>
              <Badge className={`${statusInfo.color} text-white text-sm px-4 py-2`}>
                {statusInfo.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Information */}
          <Card className="bg-black border-white/10">
            <CardHeader>
              <CardTitle className="text-xl text-yellow-500 font-serif">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-yellow-500 mt-1" />
                <div>
                  <p className="text-sm text-white/60">Email</p>
                  <p className="text-white">{customOrder.customerEmail}</p>
                </div>
              </div>
              {customOrder.customerPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-yellow-500 mt-1" />
                  <div>
                    <p className="text-sm text-white/60">Phone</p>
                    <p className="text-white">{customOrder.customerPhone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-500 mt-1" />
                <div>
                  <p className="text-sm text-white/60">Submitted</p>
                  <p className="text-white">
                    {new Date(customOrder.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Information */}
          {customOrder.quotedPrice && (
            <Card className="bg-black border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-yellow-500 font-serif">Quote Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-white/60 mb-2">Quoted Price</p>
                  <p className="text-3xl font-serif text-yellow-500">
                    ${customOrder.quotedPrice.toFixed(2)}
                  </p>
                </div>
                {customOrder.quoteNotes && (
                  <div>
                    <p className="text-sm text-white/60 mb-2">Notes from our artisan</p>
                    <p className="text-white/80">{customOrder.quoteNotes}</p>
                  </div>
                )}
                {customOrder.status === 'quoted' && (
                  <Button
                    onClick={handleApprove}
                    disabled={approving}
                    className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-serif"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Quote & Begin Production
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Description */}
        <Card className="bg-black border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-500 font-serif">Your Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-yellow-500 mt-1" />
              <p className="text-white/80 whitespace-pre-wrap">{customOrder.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Reference Images */}
        <Card className="bg-black border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-500 font-serif">Reference Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {customOrder.referenceImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden border border-white/20 hover:border-yellow-500/50 transition cursor-pointer"
                  onClick={() => window.open(imageUrl, '_blank')}
                >
                  <img
                    src={imageUrl}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="bg-black border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-500 font-serif">Progress Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2" />
                <div>
                  <p className="text-white font-medium">Request Submitted</p>
                  <p className="text-sm text-white/60">
                    {new Date(customOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {customOrder.quotedAt && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2" />
                  <div>
                    <p className="text-white font-medium">Quote Provided</p>
                    <p className="text-sm text-white/60">
                      {new Date(customOrder.quotedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {customOrder.approvedAt && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2" />
                  <div>
                    <p className="text-white font-medium">Quote Approved</p>
                    <p className="text-sm text-white/60">
                      {new Date(customOrder.approvedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {customOrder.completedAt && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2" />
                  <div>
                    <p className="text-white font-medium">Production Completed</p>
                    <p className="text-sm text-white/60">
                      {new Date(customOrder.completedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
