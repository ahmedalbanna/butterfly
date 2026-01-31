'use client';

import { useEffect, useState } from 'react';
import { getAllMessages, getMessageStats, updateMessageStatus, updateMessagePriority, addMessageReply, deleteMessage } from '@/app/actions/admin-messages';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, Trash2, Send, Clock, User, MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CustomerMessage, MessageReply, ActiveChatSession } from '@prisma/client';

type MessageWithReplies = CustomerMessage & {
  replies: MessageReply[];
  activeChatSession: ActiveChatSession | null;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageWithReplies[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    replied: 0,
    resolved: 0,
    activeChats: 0,
    formMessages: 0,
    chatMessages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithReplies | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [messagesData, statsData] = await Promise.all([
      getAllMessages(),
      getMessageStats()
    ]);
    setMessages(messagesData);
    setStats(statsData);
    setIsLoading(false);
  };

  const handleStatusChange = async (messageId: string, newStatus: string) => {
    const result = await updateMessageStatus(messageId, newStatus);
    if (result) {
      toast({
        title: 'Success',
        description: 'Message status updated'
      });
      loadData();
    }
  };

  const handlePriorityChange = async (messageId: string, newPriority: string) => {
    const result = await updateMessagePriority(messageId, newPriority);
    if (result) {
      toast({
        title: 'Success',
        description: 'Priority updated'
      });
      loadData();
    }
  };

  const handleViewMessage = (message: MessageWithReplies) => {
    setSelectedMessage(message);
    setIsDetailOpen(true);
    if (message.status === 'unread') {
      handleStatusChange(message.id, 'read');
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsSendingReply(true);
    const result = await addMessageReply(selectedMessage.id, replyText, 'admin');
    if (result) {
      toast({
        title: 'Success',
        description: 'Reply sent successfully'
      });
      setReplyText('');
      loadData();
      const updated = await getAllMessages();
      const updatedMessage = updated.find(m => m.id === selectedMessage.id);
      if (updatedMessage) setSelectedMessage(updatedMessage);
    }
    setIsSendingReply(false);
  };

  const handleDelete = async (message: MessageWithReplies) => {
    if (!confirm(`Are you sure you want to delete this message from ${message.customerName}?`)) return;

    const result = await deleteMessage(message.id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Message deleted'
      });
      setIsDetailOpen(false);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      unread: { label: 'Unread', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      read: { label: 'Read', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      replied: { label: 'Replied', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      resolved: { label: 'Resolved', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    };
    const config = configs[status as keyof typeof configs] || configs.unread;
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      low: { label: 'Low', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      normal: { label: 'Normal', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      high: { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      urgent: { label: 'Urgent', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    };
    const config = configs[priority as keyof typeof configs] || configs.normal;
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
  };

  const filteredMessages = filterStatus === 'all' 
    ? messages 
    : messages.filter(m => m.status === filterStatus);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-4xl font-headline italic text-white mb-2">Customer Messages</h1>
        <p className="text-sm text-white/60 uppercase tracking-wider">Manage customer inquiries and support requests</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Mail, color: 'text-blue-400' },
          { label: 'Unread', value: stats.unread, icon: AlertCircle, color: 'text-yellow-400' },
          { label: 'Replied', value: stats.replied, icon: MessageSquare, color: 'text-green-400' },
          { label: 'Active Chats', value: stats.activeChats, icon: User, color: 'text-primary' }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-black/40 border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-white/60 uppercase tracking-wider">Filter by Status:</label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-black/40 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-20">
          <Mail className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 italic">No messages found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((message) => (
            <Card key={message.id} className="bg-black/40 border-white/10 hover:border-primary/30 transition-all cursor-pointer" onClick={() => handleViewMessage(message)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-headline text-lg text-white">{message.customerName}</h3>
                      {getStatusBadge(message.status)}
                      {getPriorityBadge(message.priority)}
                      {message.type === 'chat' && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 border">Live Chat</Badge>
                      )}
                    </div>
                    
                    <p className="text-white/80 font-medium">{message.subject}</p>
                    <p className="text-white/60 text-sm line-clamp-2">{message.message}</p>
                    
                    <div className="flex items-center gap-6 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {message.customerEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                      {message.replies.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMessage(message);
                    }}
                    className="text-white/60 hover:text-primary hover:bg-primary/10"
                  >
                    <Eye className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline italic text-primary">Message Details</DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wider text-white/60 font-bold">Customer Information</h3>
                <div className="bg-black/40 p-4 rounded border border-white/10 space-y-2">
                  <p className="text-white"><span className="text-white/60">Name:</span> {selectedMessage.customerName}</p>
                  <p className="text-white"><span className="text-white/60">Email:</span> {selectedMessage.customerEmail}</p>
                  {selectedMessage.customerPhone && (
                    <p className="text-white"><span className="text-white/60">Phone:</span> {selectedMessage.customerPhone}</p>
                  )}
                  <p className="text-white"><span className="text-white/60">Date:</span> {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wider text-white/60 font-bold">Subject</h3>
                <p className="text-white font-medium text-lg">{selectedMessage.subject}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wider text-white/60 font-bold">Message</h3>
                <div className="bg-black/40 p-4 rounded border border-white/10">
                  <p className="text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Status & Priority Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Status</label>
                  <Select value={selectedMessage.status} onValueChange={(value) => handleStatusChange(selectedMessage.id, value)}>
                    <SelectTrigger className="bg-black/40 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Priority</label>
                  <Select value={selectedMessage.priority} onValueChange={(value) => handlePriorityChange(selectedMessage.id, value)}>
                    <SelectTrigger className="bg-black/40 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Replies */}
              {selectedMessage.replies.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm uppercase tracking-wider text-white/60 font-bold">Conversation</h3>
                  <div className="space-y-3">
                    {selectedMessage.replies.map((reply) => (
                      <div key={reply.id} className={`p-4 rounded border ${
                        reply.sender === 'admin' 
                          ? 'bg-primary/10 border-primary/20 ml-8' 
                          : 'bg-white/5 border-white/10 mr-8'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs uppercase tracking-wider font-bold text-white/60">
                            {reply.sender === 'admin' ? 'Admin' : 'Customer'}
                          </span>
                          <span className="text-xs text-white/40">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-white">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Box */}
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wider text-white/60 font-bold">Send Reply</h3>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="bg-black/40 border-white/20 text-white min-h-[120px]"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSendingReply}
                    className="flex-1 bg-primary hover:bg-primary/80 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedMessage)}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
