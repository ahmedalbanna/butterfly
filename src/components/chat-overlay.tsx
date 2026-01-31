"use client"

import { useChat } from '@/context/chat-context';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ChatOverlay() {
  const { messages, isChatOpen, isTyping, connectionStatus, adminConnected, closeChat, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (!isChatOpen) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'waiting':
        return 'Waiting for admin...';
      case 'connected':
        return 'Connected to admin';
      default:
        return 'Disconnected';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-400';
      case 'waiting':
        return 'text-yellow-400';
      case 'connecting':
        return 'text-blue-400';
      default:
        return 'text-red-400';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-gradient-to-br from-black via-black to-primary/5 backdrop-blur-3xl flex items-center justify-center animate-in fade-in duration-500 p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        
        {/* Elegant Header */}
        <header className="relative px-8 py-6 border-b border-white/10 bg-gradient-to-r from-black/80 via-black/60 to-black/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Animated Status Indicator */}
              <div className="relative">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                  connectionStatus === 'connected' ? "bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/50" :
                  connectionStatus === 'waiting' ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-400/50" :
                  "bg-gradient-to-br from-primary/20 to-primary/30 border-primary/50"
                )}>
                  <Sparkles className={cn(
                    "w-6 h-6 transition-all",
                    connectionStatus === 'connected' ? "text-green-400" : "text-primary"
                  )} />
                </div>
                {connectionStatus === 'connected' && (
                  <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
                )}
              </div>

              <div>
                <h2 className="text-2xl font-headline italic text-white mb-1 tracking-wide">
                  Luxury Concierge
                </h2>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    getStatusColor().replace('text-', 'bg-')
                  )} />
                  <p className={cn("text-xs uppercase tracking-[0.3em] font-bold", getStatusColor())}>
                    {getStatusText()}
                  </p>
                </div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeChat}
              className="text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all h-10 w-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-8 py-6">
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <p className="text-white/40 text-sm italic">How may I assist you today?</p>
              </div>
            )}

            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 animate-in slide-in-from-bottom-2 duration-300",
                  msg.role === 'customer' ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 shadow-lg",
                  msg.role === 'customer' 
                    ? "bg-gradient-to-br from-white/10 to-white/5 border-white/20" 
                    : "bg-gradient-to-br from-primary/30 to-primary/20 border-primary/40"
                )}>
                  {msg.role === 'customer' 
                    ? <User className="w-5 h-5 text-white/70" /> 
                    : <Bot className="w-5 h-5 text-primary" />
                  }
                </div>

                {/* Message Bubble */}
                <div className={cn(
                  "flex-1 max-w-[75%]",
                  msg.role === 'customer' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm",
                    msg.role === 'customer' 
                      ? "bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-tr-sm" 
                      : "bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-tl-sm"
                  )}>
                    <p className={cn(
                      "text-base leading-relaxed",
                      msg.role === 'customer' ? "text-white/90" : "text-white italic font-light"
                    )}>
                      {msg.content}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider text-white/30 mt-2 block px-2",
                    msg.role === 'customer' ? "text-right" : "text-left"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-4 animate-in slide-in-from-bottom-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-lg">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div className="flex-1 max-w-[75%]">
                  <div className="rounded-2xl rounded-tl-sm px-6 py-4 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 shadow-lg">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Elegant Input Footer */}
        <div className="relative px-8 py-6 border-t border-white/10 bg-gradient-to-r from-black/80 via-black/60 to-black/80">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type your message..."
                disabled={isTyping}
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl h-14 px-6 pr-16 text-white text-base placeholder:text-white/30 placeholder:italic focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="absolute right-2 top-2 h-10 w-10 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center mt-4 text-white/20 uppercase tracking-[0.4em] text-[9px] font-bold">
            Encrypted • Private • Secure
          </p>
        </div>
      </div>
    </div>
  );
}
