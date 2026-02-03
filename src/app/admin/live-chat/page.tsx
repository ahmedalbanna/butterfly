'use client';

import { useEffect, useState } from 'react';
import { getActiveChatSessions, getMessageStats } from '@/app/actions/admin-messages';
import { addMessageReply } from '@/app/actions/admin-messages';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, User, Clock, Send, Radio, Sparkles, Bot, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CustomerMessage, MessageReply, ActiveChatSession } from '@prisma/client';
import { cn } from '@/lib/utils';

type ChatSessionWithMessage = ActiveChatSession & {
  message: CustomerMessage & {
    replies: MessageReply[];
  };
};

export default function LiveChatPage() {
  const [sessions, setSessions] = useState<ChatSessionWithMessage[]>([]);
  const [stats, setStats] = useState({ activeChats: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSessionWithMessage | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [sessionsData, statsData] = await Promise.all([
      getActiveChatSessions(),
      getMessageStats()
    ]);
    
    const sessionsWithReplies = sessionsData.map(session => ({
      ...session,
      message: {
        ...session.message,
        replies: []
      }
    }));
    
    setSessions(sessionsWithReplies as ChatSessionWithMessage[]);
    setStats({ activeChats: statsData.activeChats });
    setIsLoading(false);
  };

  const handleViewSession = async (session: ChatSessionWithMessage) => {
    setSelectedSession(session);
    setIsDetailOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedSession || !replyText.trim()) return;

    setIsSending(true);
    const result = await addMessageReply(selectedSession.messageId, replyText, 'admin');
    if (result) {
      toast({
        title: 'Reply Sent',
        description: 'Your message has been sent to the customer'
      });
      setReplyText('');
      loadData();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive'
      });
    }
    setIsSending(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'waiting':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ended':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-headline italic text-white mb-2">Live Chat</h1>
            <p className="text-sm text-white/60 uppercase tracking-wider">Monitor and respond to active chat sessions</p>
          </div>
          {stats.activeChats > 0 && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border text-lg px-4 py-2 animate-pulse">
              <Radio className="w-5 h-5 mr-2 animate-pulse" />
              {stats.activeChats} Live
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 italic">No active chat sessions</p>
          <p className="text-white/20 text-sm mt-2">Sessions will appear here when customers start chatting</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card 
              key={session.id} 
              className="bg-black/40 border-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
              onClick={() => handleViewSession(session)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/40 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-headline text-lg text-white">{session.message.customerName}</h3>
                      <p className="text-xs text-white/40">{session.message.customerEmail}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(session.status)} border`}>
                    {session.adminConnected ? 'Active' : 'Waiting'}
                  </Badge>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-sm text-white/80 line-clamp-2">{session.message.message}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-white/40">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(session.lastActivity).toLocaleTimeString()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 group-hover:bg-primary group-hover:text-white transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewSession(session);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View & Respond
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline italic text-primary flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/40 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              {selectedSession?.message.customerName}
              {selectedSession?.adminConnected && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-auto">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  Connected
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="bg-black/40 p-4 rounded border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-white/60">Email:</span>
                    <span className="text-white ml-2">{selectedSession.message.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Started:</span>
                    <span className="text-white ml-2">{new Date(selectedSession.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-4 bg-black/20 rounded border border-white/10">
                <div className="space-y-4 py-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-white/70" />
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-lg">
                        <p className="text-white/90 text-sm">{selectedSession.message.message}</p>
                      </div>
                      <span className="text-[10px] text-white/30 mt-1 block px-2">
                        {new Date(selectedSession.message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="bg-gradient-to-r from-black/80 via-black/60 to-black/80 p-4 rounded border border-white/10">
                <div className="flex gap-3">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                    placeholder="Type your reply..."
                    disabled={isSending}
                    className="flex-1 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-primary/50"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSending}
                    className="bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-6"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
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
