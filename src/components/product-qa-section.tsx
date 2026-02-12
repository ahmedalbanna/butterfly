'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getEffectiveCustomerId, setPersistentCustomerId, hasPersistentCustomerId } from '@/lib/customer-id-manager';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductQASectionProps {
  productId: string;
  productName: string;
}

interface Message {
  id: string;
  customerName: string;
  message: string;
  createdAt: string;
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
}

interface LastExchange {
  lastMessage?: Message;
  lastReply?: Reply;
}

export default function ProductQASection({ productId, productName }: ProductQASectionProps) {
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState<string>('');
  const [lastExchange, setLastExchange] = useState<LastExchange | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const id = getEffectiveCustomerId();
    setCustomerId(id);
    loadLastExchange(id);
  }, [productId]);

  const loadLastExchange = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/messages/last-exchange?productId=${productId}&customerId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setLastExchange(data.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !customerEmail.trim() || !message.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`/api/products/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerId,
          customerName,
          customerEmail,
          subject: `Question about ${productName}`,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update persistent ID if rememberMe is checked
      if (rememberMe) {
        setPersistentCustomerId(customerId);
      }

      toast({
        title: 'Message Sent',
        description: 'Thank you! Our team will review your question shortly.',
      });

      // Reset form and reload messages
      setMessage('');
      setShowForm(false);
      await loadLastExchange(customerId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-headline italic font-bold">Ask About This Item</h2>
        </div>
        <p className="text-white/60 font-body">Have questions? Our concierge team is here to help.</p>
      </div>

      {/* Last Message & Reply Display */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 bg-white/5" />
        </div>
      ) : lastExchange?.lastMessage || lastExchange?.lastReply ? (
        <div className="space-y-4 border border-white/10 rounded-lg p-6 bg-white/5">
          <h3 className="text-sm uppercase tracking-widest font-bold text-primary">Latest Exchange</h3>

          {lastExchange.lastMessage && (
            <div className="space-y-2 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-white/40" />
                  <span className="text-sm font-bold">{lastExchange.lastMessage.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">{new Date(lastExchange.lastMessage.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-white/80 font-body leading-relaxed">{lastExchange.lastMessage.message}</p>
            </div>
          )}

          {lastExchange.lastReply && (
            <div className="space-y-2 bg-primary/10 p-4 rounded border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">Butterfly Concierge</span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">{new Date(lastExchange.lastReply.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-white/80 font-body leading-relaxed">{lastExchange.lastReply.content}</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Message Form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-primary hover:bg-white hover:text-primary text-white transition-all rounded-none uppercase tracking-widest py-6 font-bold"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Ask a Question
        </Button>
      ) : (
        <form onSubmit={handleSendMessage} className="space-y-4 border border-white/10 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-white/60">Name *</label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name"
                className="bg-white/5 border-white/10 text-white rounded-none"
                disabled={isSending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-white/60">Email *</label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-white/5 border-white/10 text-white rounded-none"
                disabled={isSending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-bold text-white/60">Message *</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask your question about this product..."
              rows={4}
              className="bg-white/5 border-white/10 text-white rounded-none resize-none"
              disabled={isSending}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-primary cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-white/60 cursor-pointer">
              Save my email to track replies
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              variant="outline"
              className="flex-1 rounded-none"
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-white hover:text-primary text-white transition-all rounded-none uppercase tracking-widest font-bold"
              disabled={isSending}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
