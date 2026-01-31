'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getActiveChatSessions } from '@/app/actions/messages';
import { MessageSquare, User, Send, Clock, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  messageId: string;
  customerConnected: boolean;
  adminConnected: boolean;
  adminName: string | null;
  lastActivity: Date;
  message: {
    id: string;
    customerName: string;
    customerEmail: string;
    subject: string;
    createdAt: Date;
    replies: Array<{
      id: string;
      sender: string;
      content: string;
      createdAt: Date;
    }>;
  };
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollTimestampRef = useRef<string | null>(null);

  // Load all chat sessions
  const loadSessions = async () => {
    const result = await getActiveChatSessions();
    if (result.success && result.sessions) {
      setSessions(result.sessions as ChatSession[]);
      
      // If we have a selected session, update it
      if (selectedSession) {
        const updated = result.sessions.find(
          (s: any) => s.messageId === selectedSession.messageId
        );
        if (updated) {
          setSelectedSession(updated as ChatSession);
        }
      }
    }
    setIsLoading(false);
  };

  // Poll for new messages in the selected chat
  const pollSelectedChat = async () => {
    if (!selectedSession) return;

    try {
      const url = new URL('/api/chat/poll', window.location.origin);
      url.searchParams.set('messageId', selectedSession.messageId);
      url.searchParams.set('type', 'admin');
      if (lastPollTimestampRef.current) {
        url.searchParams.set('since', lastPollTimestampRef.current);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success && data.replies && data.replies.length > 0) {
        setSelectedSession(prev => {
          if (!prev) return prev;
          
          const existingIds = new Set(prev.message.replies.map(r => r.id));
          const newReplies = data.replies.filter((r: any) => !existingIds.has(r.id));
          
          if (newReplies.length > 0) {
            return {
              ...prev,
              message: {
                ...prev.message,
                replies: [...prev.message.replies, ...newReplies],
              },
              customerConnected: data.otherPartyConnected || false,
            };
          }
          return prev;
        });
      }

      lastPollTimestampRef.current = data.timestamp;
    } catch (error) {
      console.error('[Admin Chat Poll] Error:', error);
    }
  };

  // Send heartbeat for selected chat
  const sendHeartbeat = async () => {
    if (!selectedSession) return;

    try {
      await fetch('/api/chat/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedSession.messageId,
          type: 'admin',
          connected: true,
        }),
      });
    } catch (error) {
      console.error('[Admin Chat Heartbeat] Error:', error);
    }
  };

  // Initial load and session list polling
  useEffect(() => {
    loadSessions();

    // Refresh session list every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      loadSessions();
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll selected chat for new messages
  useEffect(() => {
    if (selectedSession) {
      // Poll every 2 seconds
      chatPollingIntervalRef.current = setInterval(() => {
        pollSelectedChat();
      }, 2000);

      // Send heartbeat every 10 seconds
      const heartbeatInterval = setInterval(() => {
        sendHeartbeat();
      }, 10000);

      // Initial poll and heartbeat
      pollSelectedChat();
      sendHeartbeat();

      return () => {
        if (chatPollingIntervalRef.current) {
          clearInterval(chatPollingIntervalRef.current);
        }
        clearInterval(heartbeatInterval);
        
        // Disconnect heartbeat
        fetch('/api/chat/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: selectedSession.messageId,
            type: 'admin',
            connected: false,
          }),
        });
      };
    }
  }, [selectedSession?.messageId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSession?.message.replies]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedSession) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/chat/ws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedSession.messageId,
          type: 'admin',
          content: replyContent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReplyContent('');
        
        // Add message to UI immediately
        setSelectedSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            message: {
              ...prev.message,
              replies: [...prev.message.replies, {
                id: data.reply.id,
                sender: 'admin',
                content: data.reply.content,
                createdAt: new Date(data.reply.createdAt),
              }],
            },
          };
        });
      }
    } catch (error) {
      console.error('[Admin Chat Send] Error:', error);
    }

    setIsSubmitting(false);
  };

  const activeSessions = sessions.filter(s => s.customerConnected);
  const inactiveSessions = sessions.filter(s => !s.customerConnected);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-primary mb-2">Live Chat</h1>
        <p className="text-neutral-400">Manage real-time customer conversations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-neutral-900/50 border-green-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Active Chats</CardDescription>
            <CardTitle className="text-3xl text-green-400">{activeSessions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Waiting</CardDescription>
            <CardTitle className="text-3xl text-neutral-200">{inactiveSessions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Total Sessions</CardDescription>
            <CardTitle className="text-3xl text-neutral-200">{sessions.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Session List */}
        <Card className="bg-neutral-900/50 border-neutral-700 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Chat Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="text-center py-8 text-neutral-400">Loading chats...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No active chat sessions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedSession?.id === session.id
                          ? "bg-primary/10 border-primary"
                          : "bg-neutral-800/50 border-neutral-700 hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Circle className="h-2 w-2 fill-green-400 text-green-400 animate-pulse" />
                          <span className="font-medium text-neutral-100 text-sm">
                            {session.message.customerName}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate">
                        {session.message.customerEmail}
                      </p>
                      {session.message.replies.length > 0 && (
                        <p className="text-xs text-neutral-500 mt-1 truncate">
                          {session.message.replies[session.message.replies.length - 1].content}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {inactiveSessions.length > 0 && (
                    <>
                      <div className="pt-4 pb-2">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Waiting</p>
                      </div>
                      {inactiveSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors opacity-60",
                            selectedSession?.id === session.id
                              ? "bg-primary/10 border-primary"
                              : "bg-neutral-800/50 border-neutral-700 hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Circle className="h-2 w-2 fill-neutral-500 text-neutral-500" />
                              <span className="font-medium text-neutral-100 text-sm">
                                {session.message.customerName}
                              </span>
                            </div>
                            <span className="text-xs text-neutral-500">
                              {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 truncate">
                            {session.message.customerEmail}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 bg-neutral-900/50 border-neutral-700 flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b border-neutral-700">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {selectedSession.message.customerName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedSession.message.customerEmail}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      selectedSession.customerConnected
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}
                  >
                    {selectedSession.customerConnected ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 min-h-0 p-6">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {selectedSession.message.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={cn(
                          "flex gap-3",
                          reply.sender === 'admin' ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            reply.sender === 'admin'
                              ? "bg-primary/20 text-primary"
                              : "bg-neutral-700 text-neutral-300"
                          )}
                        >
                          {reply.sender === 'admin' ? 'A' : 'C'}
                        </div>
                        <div
                          className={cn(
                            "flex-1 max-w-[70%]",
                            reply.sender === 'admin' ? "text-right" : "text-left"
                          )}
                        >
                          <div
                            className={cn(
                              "inline-block p-3 rounded-lg",
                              reply.sender === 'admin'
                                ? "bg-primary/10 text-neutral-100"
                                : "bg-neutral-800 text-neutral-200"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Reply Input */}
              <div className="p-4 border-t border-neutral-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your message..."
                    className="bg-neutral-800 border-neutral-700 text-neutral-100 resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting || !replyContent.trim()}
                    className="bg-primary hover:bg-primary/90 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-xs text-neutral-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select a chat session to start</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
