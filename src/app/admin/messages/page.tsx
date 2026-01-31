'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllMessages, updateMessageStatus } from '@/app/actions/messages';
import { Mail, MailOpen, Search, AlertCircle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type MessageStatus = 'unread' | 'read' | 'replied' | 'resolved';
type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

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
  replies: any[];
  _count: {
    replies: number;
  };
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<CustomerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchEmail, setSearchEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'chats' | 'forms'>('all');

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [messages, statusFilter, priorityFilter, searchEmail, activeTab]);

  const loadMessages = async () => {
    setIsLoading(true);
    const result = await getAllMessages();
    if (result.success && result.messages) {
      setMessages(result.messages as CustomerMessage[]);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...messages];

    // Filter by tab
    if (activeTab === 'chats') {
      filtered = filtered.filter(msg => msg.type === 'chat');
    } else if (activeTab === 'forms') {
      filtered = filtered.filter(msg => msg.type === 'form');
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(msg => msg.priority === priorityFilter);
    }

    if (searchEmail) {
      filtered = filtered.filter(msg =>
        msg.customerEmail.toLowerCase().includes(searchEmail.toLowerCase()) ||
        msg.customerName.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    setFilteredMessages(filtered);
  };

  const handleQuickStatusChange = async (messageId: string, newStatus: MessageStatus) => {
    const result = await updateMessageStatus({
      messageId,
      status: newStatus,
    });

    if (result.success) {
      loadMessages();
    }
  };

  const getStatusBadge = (status: MessageStatus) => {
    const variants: Record<MessageStatus, { variant: any; icon: any; label: string }> = {
      unread: { variant: 'default', icon: Mail, label: 'Unread' },
      read: { variant: 'secondary', icon: MailOpen, label: 'Read' },
      replied: { variant: 'outline', icon: MessageSquare, label: 'Replied' },
      resolved: { variant: 'outline', icon: CheckCircle2, label: 'Resolved' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: MessagePriority) => {
    const colors: Record<MessagePriority, string> = {
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      normal: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    return (
      <Badge variant="outline" className={colors[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const stats = {
    unread: messages.filter(m => m.status === 'unread').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
    resolved: messages.filter(m => m.status === 'resolved').length,
    activeChats: messages.filter(m => m.type === 'chat' && m.isActive).length,
    totalChats: messages.filter(m => m.type === 'chat').length,
    totalForms: messages.filter(m => m.type === 'form').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-primary mb-2">Customer Messages</h1>
        <p className="text-neutral-400">Manage and respond to customer inquiries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-neutral-900/50 border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Unread</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats.unread}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900/50 border-green-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Active Chats</CardDescription>
            <CardTitle className="text-3xl text-green-400">{stats.activeChats}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Read</CardDescription>
            <CardTitle className="text-3xl text-neutral-200">{stats.read}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Replied</CardDescription>
            <CardTitle className="text-3xl text-neutral-200">{stats.replied}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Resolved</CardDescription>
            <CardTitle className="text-3xl text-neutral-200">{stats.resolved}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
          className="gap-2"
        >
          All Messages ({messages.length})
        </Button>
        <Button
          variant={activeTab === 'chats' ? 'default' : 'outline'}
          onClick={() => setActiveTab('chats')}
          className="gap-2"
        >
          Live Chats ({stats.totalChats})
          {stats.activeChats > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
              {stats.activeChats} active
            </span>
          )}
        </Button>
        <Button
          variant={activeTab === 'forms' ? 'default' : 'outline'}
          onClick={() => setActiveTab('forms')}
          className="gap-2"
        >
          Contact Forms ({stats.totalForms})
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-neutral-900/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card className="bg-neutral-900/50 border-neutral-700">
        <CardHeader>
          <CardTitle>Messages ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-neutral-400">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">No messages found</div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <Link key={message.id} href={`/admin/messages/${message.id}`}>
                  <Card className="bg-neutral-800/50 border-neutral-700 hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-neutral-100 truncate">
                                  {message.subject}
                                </h3>
                                {message.type === 'chat' && (
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                    Chat
                                  </Badge>
                                )}
                                {message.isActive && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 animate-pulse">
                                    Live
                                  </Badge>
                                )}
                                {getStatusBadge(message.status)}
                                {getPriorityBadge(message.priority)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <span>{message.customerName}</span>
                                <span>•</span>
                                <span>{message.customerEmail}</span>
                                {message.orderId && (
                                  <>
                                    <span>•</span>
                                    <span className="text-primary">
                                      Order #{message.orderId.slice(-8).toUpperCase()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-neutral-400 line-clamp-2 mb-2">
                            {message.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </span>
                            {message._count.replies > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {message._count.replies} {message._count.replies === 1 ? 'reply' : 'replies'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              handleQuickStatusChange(
                                message.id,
                                message.status === 'unread' ? 'read' : 'unread'
                              );
                            }}
                            className="text-xs"
                          >
                            Mark as {message.status === 'unread' ? 'Read' : 'Unread'}
                          </Button>
                          {message.status !== 'resolved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault();
                                handleQuickStatusChange(message.id, 'resolved');
                              }}
                              className="text-xs"
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
