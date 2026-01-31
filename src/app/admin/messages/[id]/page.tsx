'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getMessageById, replyToMessage, updateMessageStatus } from '@/app/actions/messages';
import { ArrowLeft, Mail, Phone, Package, Send, Calendar, User } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

type MessageStatus = 'unread' | 'read' | 'replied' | 'resolved';
type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

interface MessageReply {
  id: string;
  sender: string;
  content: string;
  createdAt: Date;
}

interface CustomerMessage {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  subject: string;
  message: string;
  orderId: string | null;
  status: MessageStatus;
  priority: MessagePriority;
  createdAt: Date;
  updatedAt: Date;
  order?: any;
  replies: MessageReply[];
}

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const messageId = params.id as string;

  const [message, setMessage] = useState<CustomerMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLiveChat, setIsLiveChat] = useState(false);
  const [customerConnected, setCustomerConnected] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    loadMessage();
  }, [messageId]);

  // Poll for new messages if it's a live chat
  useEffect(() => {
    if (isLiveChat && message?.isActive) {
      // Start polling every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        pollForNewMessages();
      }, 2000);

      // Send initial heartbeat
      sendHeartbeat();

      // Send heartbeat every 10 seconds
      const heartbeatInterval = setInterval(() => {
        sendHeartbeat();
      }, 10000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        clearInterval(heartbeatInterval);
        
        // Send disconnect heartbeat
        fetch('/api/chat/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            type: 'admin',
            connected: false,
          }),
        });
      };
    }
  }, [isLiveChat, message?.isActive, messageId]);

  const loadMessage = async () => {
    setIsLoading(true);
    const result = await getMessageById(messageId);
    if (result.success && result.message) {
      setMessage(result.message as CustomerMessage);
      setIsLiveChat(result.message.type === 'chat');
      
      // Mark as read if unread
      if (result.message.status === 'unread') {
        await updateMessageStatus({
          messageId,
          status: 'read',
        });
      }
    }
    setIsLoading(false);
  };

  const pollForNewMessages = async () => {
    try {
      const url = new URL('/api/chat/poll', window.location.origin);
      url.searchParams.set('messageId', messageId);
      url.searchParams.set('type', 'admin');
      if (lastPollTimestampRef.current) {
        url.searchParams.set('since', lastPollTimestampRef.current);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success) {
        // Update customer connection status
        setCustomerConnected(data.otherPartyConnected || false);

        // Add new replies
        if (data.replies && data.replies.length > 0) {
          setMessage(prev => {
            if (!prev) return prev;
            
            const existingIds = new Set(prev.replies.map((r: any) => r.id));
            const newReplies = data.replies.filter((r: any) => !existingIds.has(r.id));
            
            if (newReplies.length > 0) {
              return {
                ...prev,
                replies: [...prev.replies, ...newReplies],
              };
            }
            return prev;
          });
        }

        // Update last poll timestamp
        lastPollTimestampRef.current = data.timestamp;
      }
    } catch (error) {
      console.error('[Admin Chat Poll] Error:', error);
    }
  };

  const sendHeartbeat = async () => {
    try {
      await fetch('/api/chat/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          type: 'admin',
          connected: true,
        }),
      });
    } catch (error) {
      console.error('[Admin Chat Heartbeat] Error:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // For live chat, use the polling endpoint
    if (isLiveChat) {
      try {
        const response = await fetch('/api/chat/ws', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            type: 'admin',
            content: replyContent,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess('Message sent');
          setReplyContent('');
          // Add the reply immediately to the UI
          setMessage(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              replies: [...prev.replies, {
                id: data.reply.id,
                sender: 'admin',
                content: data.reply.content,
                createdAt: new Date(data.reply.createdAt),
              }],
            };
          });
        } else {
          setError(data.error || 'Failed to send message');
        }
      } catch (error) {
        console.error('[Admin Chat Send] Error:', error);
        setError('Failed to send message');
      }
      setIsSubmitting(false);
    } else {
      // For regular messages, use the existing flow
      const result = await replyToMessage({
        messageId,
        sender: 'admin',
        content: replyContent,
      });

      setIsSubmitting(false);

      if (result.success) {
        setSuccess('Reply sent successfully');
        setReplyContent('');
        loadMessage();
      } else {
        setError(result.error || 'Failed to send reply');
      }
    }
  };

  const handleStatusChange = async (newStatus: MessageStatus) => {
    const result = await updateMessageStatus({
      messageId,
      status: newStatus,
    });

    if (result.success) {
      loadMessage();
    }
  };

  const handlePriorityChange = async (newPriority: MessagePriority) => {
    const result = await updateMessageStatus({
      messageId,
      status: message!.status,
      priority: newPriority,
    });

    if (result.success) {
      loadMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-400">Loading message...</div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-neutral-400">Message not found</div>
        <Button variant="outline" onClick={() => router.push('/admin/messages')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/messages')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-serif text-primary">{message.subject}</h1>
              {isLiveChat && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Live Chat
                </Badge>
              )}
              {message.isActive && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 animate-pulse">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-400">
              <span>{format(new Date(message.createdAt), 'PPpp')}</span>
              {isLiveChat && (
                <span className={customerConnected ? 'text-green-400' : 'text-red-400'}>
                  Customer: {customerConnected ? 'Online' : 'Offline'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Message */}
          <Card className="bg-neutral-900/50 border-neutral-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {message.customerName}
                  </CardTitle>
                  <CardDescription className="mt-1">{message.customerEmail}</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-neutral-300 whitespace-pre-wrap">{message.message}</p>
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          {message.replies.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-serif text-primary">Conversation</h2>
              {message.replies.map((reply) => (
                <Card
                  key={reply.id}
                  className={`${
                    reply.sender === 'admin'
                      ? 'bg-primary/5 border-primary/20 ml-8'
                      : 'bg-neutral-900/50 border-neutral-700 mr-8'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {reply.sender === 'admin' ? 'Admin' : message.customerName}
                      </CardTitle>
                      <span className="text-xs text-neutral-400">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-300 whitespace-pre-wrap text-sm">{reply.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Form */}
          <Card className="bg-neutral-900/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Send Reply</CardTitle>
              <CardDescription>Your reply will be visible to the customer</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReply} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="bg-green-500/10 border-green-500/20 text-green-500">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={6}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100 resize-none"
                  required
                />

                <Button
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim()}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card className="bg-neutral-900/50 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-lg">Message Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Status</label>
                <Select value={message.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Priority</label>
                <Select value={message.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="bg-neutral-900/50 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-neutral-400">Name</p>
                  <p className="text-sm text-neutral-200">{message.customerName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-neutral-400">Email</p>
                  <p className="text-sm text-neutral-200">{message.customerEmail}</p>
                </div>
              </div>

              {message.customerPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-neutral-400">Phone</p>
                    <p className="text-sm text-neutral-200">{message.customerPhone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-neutral-400">Submitted</p>
                  <p className="text-sm text-neutral-200">
                    {format(new Date(message.createdAt), 'PPP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          {message.order && (
            <Card className="bg-neutral-900/50 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-lg">Related Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-neutral-400">Order ID</p>
                    <p className="text-sm text-neutral-200 font-mono">
                      #{message.order.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-neutral-400">Order Date</p>
                    <p className="text-sm text-neutral-200">
                      {format(new Date(message.order.createdAt), 'PPP')}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/admin/orders`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Order Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
