"use client"

import { useChat } from '@/context/chat-context';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Send, User, Bot, Loader2, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ChatOverlay() {
  const { messages, isChatOpen, isTyping, connectionStatus, closeChat, sendMessage } = useChat();
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
      case 'connecting': return 'Authenticating...';
      case 'waiting': return 'Finding Available Concierge...';
      case 'connected': return 'Directly Connected to Boutique';
      default: return 'Boutique Offline';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'waiting': return 'text-yellow-400';
      case 'connecting': return 'text-blue-400';
      default: return 'text-red-400';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-3xl flex items-center justify-center animate-in fade-in duration-700 p-4">
      {/* Cinematic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)]">
        
        {/* Luxury Header */}
        <header className="relative px-10 py-8 border-b border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-1000",
                  connectionStatus === 'connected' ? "bg-green-500/10 border-green-400/40 shadow-[0_0_20px_rgba(74,222,128,0.2)]" : "bg-primary/10 border-primary/30"
                )}>
                  <Sparkles className={cn(
                    "w-8 h-8 transition-all duration-700",
                    connectionStatus === 'connected' ? "text-green-400 scale-110" : "text-primary"
                  )} />
                </div>
                {connectionStatus === 'connected' && (
                  <div className="absolute -top-1 -right-1">
                    <BadgeCheck className="w-6 h-6 text-green-400 fill-black" />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-3xl font-headline italic text-white mb-1 tracking-widest">
                  Boutique Concierge
                </h2>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    getStatusColor().replace('text-', 'bg-')
                  )} />
                  <p className={cn("text-[10px] uppercase tracking-[0.4em] font-bold", getStatusColor())}>
                    {getStatusText()}
                  </p>
                </div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeChat}
              className="text-white/20 hover:text-white hover:bg-white/10 rounded-full transition-all h-12 w-12 border border-white/5"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </header>

        {/* Conversation Stream */}
        <ScrollArea className="flex-1 px-10 py-10">
          <div className="space-y-8 max-w-4xl mx-auto">
            {messages.length <= 1 && (
              <div className="text-center py-20 animate-in fade-in zoom-in duration-1000">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/5 border border-primary/10 mb-6">
                  <Bot className="w-12 h-12 text-primary/40" />
                </div>
                <h3 className="text-2xl font-headline italic text-white/60 mb-2">Awaiting your inquiry</h3>
                <p className="text-white/20 text-xs uppercase tracking-widest">Personal guidance is one message away</p>
              </div>
            )}

            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-6 animate-in slide-in-from-bottom-4 duration-500",
                  msg.role === 'customer' ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 shadow-2xl transition-all duration-500",
                  msg.role === 'customer' 
                    ? "bg-white/5 border-white/10 text-white/40" 
                    : "bg-primary/10 border-primary/30 text-primary"
                )}>
                  {msg.role === 'customer' ? <User className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                </div>

                {/* Message Bubble */}
                <div className={cn(
                  "flex-1 max-w-[80%]",
                  msg.role === 'customer' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "rounded-2xl px-8 py-5 shadow-2xl backdrop-blur-xl relative transition-all duration-500",
                    msg.role === 'customer' 
                      ? "bg-white/[0.03] border border-white/10 rounded-tr-sm text-right" 
                      : "bg-primary/5 border border-primary/20 rounded-tl-sm text-left"
                  )}>
                    <p className={cn(
                      "text-lg leading-relaxed font-light tracking-wide",
                      msg.role === 'customer' ? "text-white/90" : "text-white/80 italic"
                    )}>
                      {msg.content}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[9px] uppercase tracking-[0.3em] text-white/20 mt-3 block px-2 font-bold",
                    msg.role === 'customer' ? "text-right" : "text-left"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-2xl">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div className="flex-1 max-w-[80%]">
                  <div className="rounded-2xl rounded-tl-sm px-8 py-5 bg-primary/5 border border-primary/20 shadow-2xl">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '200ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Luxury Input Bar */}
        <div className="relative px-10 py-10 border-t border-white/5 bg-gradient-to-t from-black/60 to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Consult with our elite stylists..."
                disabled={isTyping}
                className="w-full bg-white/[0.03] border-2 border-white/5 rounded-2xl h-20 px-8 pr-24 text-xl text-white placeholder:text-white/10 placeholder:italic font-light focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-500 disabled:opacity-50"
              />
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-3 top-3 h-14 w-14 bg-primary text-white rounded-xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <Send className="w-6 h-6" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6 text-white/10 text-[8px] uppercase tracking-[0.5em] font-bold">
            <ShieldCheck className="w-3 h-3" /> Encrypted Boutique Protocol • Secure Acquisition Guidance
          </div>
        </div>
      </div>
    </div>
  );
}
