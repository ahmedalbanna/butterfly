'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getActiveChatSessions } from '@/app/actions/messages';
import { MessageSquare, User, Send, Clock, Circle, Sparkles, BookOpen, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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

const LUXURY_TEMPLATES = [
  { label: 'Welcome', text: 'Welcome to LuxeFinds. I am your personal concierge today. How may I assist you with our collection?' },
  { label: 'Checking', text: 'One moment while I consult our inventory for that specific piece...' },
  { label: 'Stylist Note', text: 'Based on your preferences, our lead stylist recommends pairing this with our Rose Gold collection.' },
  { label: 'Order Update', text: 'I have checked your acquisition status. Your piece is currently being meticulously prepared for shipment.' },
  { label: 'Closing', text: 'It was a pleasure assisting you. Do you require any further guidance with our boutique collection?' }
];

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollTimestampRef = useRef<string | null>(null);

  // Load all chat sessions
  const loadSessions = async () => {
    const result = await getActiveChatSessions();
    if (result.success && result.sessions) {
      setSessions(prevSessions => {
        return (result.sessions as any[]).map(s => {
          const existing = prevSessions.find(p => p.messageId === s.messageId);
          return {
            ...s,
            // Preserve replies if we already have them in state, 
            // as getActiveChatSessions doesn't include them
            message: {
              ...s.message,
              replies: existing?.message.replies || []
            }
          };
        });
      });
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

      if (data.success) {
        if (data.replies && data.replies.length > 0) {
          setSelectedSession(prev => {
            if (!prev || prev.messageId !== selectedSession.messageId) return prev;
            
            const existingIds = new Set(prev.message.replies.map(r => r.id));
            const newReplies = data.replies.filter((r: any) => !existingIds.has(r.id));
            
            if (newReplies.length > 0) {
              return {
                ...prev,
                customerConnected: data.otherPartyConnected || false,
                message: { 
                  ...prev.message, 
                  replies: [...prev.message.replies, ...newReplies.map((r: any) => ({
                    ...r,
                    createdAt: new Date(r.createdAt)
                  }))] 
                },
              };
            }
            
            return {
              ...prev,
              customerConnected: data.otherPartyConnected || false
            };
          });
        } else {
          setSelectedSession(prev => {
            if (!prev || prev.messageId !== selectedSession.messageId) return prev;
            return { ...prev, customerConnected: data.otherPartyConnected || false };
          });
        }
        lastPollTimestampRef.current = data.timestamp;
      }
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

    // Pause polling when tab is hidden (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else {
        loadSessions();
        pollingIntervalRef.current = setInterval(() => {
          loadSessions();
        }, 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Poll selected chat for new messages
  useEffect(() => {
    if (selectedSession) {
      // Poll every 2 seconds
      lastPollTimestampRef.current = null; // Reset for new session
      chatPollingIntervalRef.current = setInterval(() => {
        pollSelectedChat();
      }, 2000);

      // Send heartbeat every 10 seconds
      let heartbeatInterval = setInterval(() => {
        sendHeartbeat();
      }, 10000);
      
      // Pause chat polling when tab is hidden
      const handleChatVisibilityChange = () => {
        if (document.hidden) {
          if (chatPollingIntervalRef.current) {
            clearInterval(chatPollingIntervalRef.current);
            chatPollingIntervalRef.current = null;
          }
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
        } else {
          pollSelectedChat();
          chatPollingIntervalRef.current = setInterval(() => {
            pollSelectedChat();
          }, 2000);
          heartbeatInterval = setInterval(() => {
            sendHeartbeat();
          }, 10000);
        }
      };
      
      document.addEventListener('visibilitychange', handleChatVisibilityChange);

      // Initial poll and heartbeat
      pollSelectedChat();
      sendHeartbeat();

      return () => {
        if (chatPollingIntervalRef.current) {
          clearInterval(chatPollingIntervalRef.current);
        }
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        document.removeEventListener('visibilitychange', handleChatVisibilityChange);
        
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
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.message.replies.length]);

  const handleSendMessage = async (contentOverride?: string) => {
    const finalContent = contentOverride || replyContent;
    if (!finalContent.trim() || !selectedSession) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/chat/ws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedSession.messageId,
          type: 'admin',
          content: finalContent,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setReplyContent('');
        setShowTemplates(false);
        // Add message to UI immediately
        setSelectedSession(prev => {
          if (!prev || prev.messageId !== selectedSession.messageId) return prev;
          
          // Deduplicate: If polling already added this message, don't add it again
          if (prev.message.replies.some(r => r.id === data.reply.id)) return prev;

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

  const useTemplate = (text: string) => {
    handleSendMessage(text);
  };
  const activeSessions = sessions.filter(s => s.customerConnected);
  const inactiveSessions = sessions.filter(s => !s.customerConnected);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-headline italic text-white mb-2">Concierge Live</h1>
          <p className="text-sm text-white/40 uppercase tracking-widest">Real-time luxury customer support</p>
        </div>
        <div className="flex gap-4">
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-4 py-2">
            <Circle className="w-2 h-2 fill-current animate-pulse mr-2" />
            {sessions.filter(s => s.customerConnected).length} Online
          </Badge>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        <Card className="bg-black/40 border-white/10 flex flex-col">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg font-headline italic text-primary flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollArea className="h-full">
              <div className="divide-y divide-white/5">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:bg-white/5",
                      selectedSession?.id === session.id ? "bg-primary/10 border-l-2 border-primary" : ""
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-white">{session.message.customerName}</p>
                      <span className="text-[10px] text-white/30">{formatDistanceToNow(new Date(session.lastActivity), { addSuffix: false })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", session.customerConnected ? "bg-green-500 animate-pulse" : "bg-white/10")} />
                      <p className="text-[10px] text-white/40 uppercase tracking-tighter truncate">{session.message.customerEmail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-black/40 border-white/10 flex flex-col relative overflow-hidden">
          {selectedSession ? (
            <>
              <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline text-xl text-white">{selectedSession.message.customerName}</h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest">{selectedSession.message.customerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    "rounded-none text-[8px] tracking-[0.2em] uppercase",
                    selectedSession.customerConnected ? "border-green-500/50 text-green-400" : "border-white/10 text-white/20"
                  )}>
                    {selectedSession.customerConnected ? 'Live Connection' : 'Client Offline'}
                  </Badge>
                </div>
              </header>

              <CardContent className="flex-1 min-h-0 p-6">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    {selectedSession.message.replies.map((reply) => (
                      <div key={reply.id} className={cn("flex gap-4", reply.sender === 'admin' ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                          reply.sender === 'admin' ? "bg-primary/20 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/40"
                        )}>
                          {reply.sender === 'admin' ? 'A' : 'C'}
                        </div>
                        <div className={cn("max-w-[70%]", reply.sender === 'admin' ? "text-right" : "text-left")}>
                          <div className={cn(
                            "inline-block px-4 py-3 rounded-lg shadow-xl",
                            reply.sender === 'admin' ? "bg-primary/10 text-white border border-primary/20" : "bg-white/5 text-white/80 border border-white/10"
                          )}>
                            <p className="text-sm leading-relaxed">{reply.content}</p>
                          </div>
                          <p className="text-[9px] text-white/20 mt-2 uppercase tracking-widest">
                            {format(new Date(reply.createdAt), 'hh:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <div className="p-6 border-t border-white/5 bg-black/40">
                {showTemplates && (
                  <div className="absolute bottom-32 left-6 right-6 p-4 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 mb-3 text-xs text-primary font-bold uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" /> Luxury Templates
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {LUXURY_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.label}
                          onClick={() => useTemplate(tmpl.text)}
                          className="text-left p-3 rounded bg-white/5 hover:bg-primary/10 hover:text-primary transition-all border border-white/5 text-[10px] leading-snug group"
                        >
                          <span className="font-bold block mb-1 uppercase tracking-tighter text-white group-hover:text-primary">{tmpl.label}</span>
                          <span className="text-white/40 line-clamp-1">{tmpl.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={cn("h-12 w-12 border-white/10 text-white/40 hover:text-primary", showTemplates && "text-primary border-primary")}
                  >
                    <BookOpen className="w-5 h-5" />
                  </Button>
                  <div className="relative flex-1">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Enter your concierge response..."
                      className="bg-white/5 border-white/10 text-white rounded-none resize-none h-12 min-h-0 focus:border-primary/50 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={isSubmitting || !replyContent.trim()}
                    className="h-12 px-8 bg-primary hover:bg-white hover:text-primary text-white rounded-none uppercase tracking-[0.2em] font-bold transition-all"
                  >
                    {isSubmitting ? <CheckCircle2 className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/20 space-y-4">
              <Sparkles className="w-16 h-16 opacity-10" />
              <p className="font-headline italic text-xl">Select an active client to begin concierge guidance</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}