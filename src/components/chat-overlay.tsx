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
    <div className="fixed inset-0 z-[110] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 box-border p-4 md:p-12">
      <div className="w-full max-w-4xl h-full flex flex-col bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <header className="p-6 md:p-8 border-b border-white/10 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary flex items-center justify-center rounded-full">
              <Sparkles className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-headline italic text-white">Live Support</h2>
              <p className={cn("font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px]", getStatusColor())}>
                {getStatusText()}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeChat}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </header>

        {/* Chat Body */}
        <ScrollArea className="flex-1 p-6 md:p-12">
          <div className="space-y-8 md:space-y-12 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 md:gap-8 animate-in slide-in-from-bottom-4 duration-500",
                  msg.role === 'customer' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 border",
                  msg.role === 'customer' ? "bg-white/5 border-white/20" : "bg-primary/20 border-primary/40"
                )}>
                  {msg.role === 'customer' ? <User className="w-4 h-4 text-white/60" /> : <Bot className="w-4 h-4 text-primary" />}
                </div>
                <div className={cn(
                  "flex-1 space-y-2",
                  msg.role === 'customer' ? "text-right" : "text-left"
                )}>
                  <p className={cn(
                    "text-sm md:text-lg leading-relaxed font-body",
                    msg.role === 'customer' ? "text-white/80" : "text-white italic"
                  )}>
                    {msg.content}
                  </p>
                  <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/20">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4 md:gap-8 animate-pulse">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-white/5 rounded-full" />
                  <div className="h-4 w-1/2 bg-white/5 rounded-full" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Footer Input */}
        <div className="p-6 md:p-12 bg-black/40 border-t border-white/10">
          <div className="max-w-3xl mx-auto relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Inquire about an exquisite piece..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-full h-14 md:h-16 px-8 pr-16 text-white text-sm md:text-base placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all group-hover:bg-white/[0.05]"
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="absolute right-2 top-2 h-10 w-10 md:h-12 md:w-12 bg-primary hover:bg-white hover:text-primary rounded-full transition-all"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>

      </div>
      
      <p className="mt-8 text-white/20 uppercase tracking-[0.5em] text-[8px] font-bold">
        Live Admin Support
      </p>
    </div>
  );
}
