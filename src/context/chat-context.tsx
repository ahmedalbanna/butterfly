"use client"

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { aiStylistChat } from '@/ai/flows/ai-stylist-chat-flow';
import { useToast } from '@/hooks/use-toast';

export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
};

type ChatContextType = {
  messages: Message[];
  isChatOpen: boolean;
  isTyping: boolean;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = 'luxefinds_chat';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;

function loadPersisted(): Message[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
    return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch { return null; }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      content: "Welcome to LuxeFinds. I am your personal stylist. How may I assist you in finding your next exquisite piece today?",
      timestamp: new Date(),
    }
  ]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const sendTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const persisted = typeof window !== 'undefined' ? loadPersisted() : null;
    if (persisted && persisted.length > 0) {
      setMessages(persisted);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const openChat = useCallback(() => setIsChatOpen(true), []);
  const closeChat = useCallback(() => setIsChatOpen(false), []);
  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content: "Welcome to LuxeFinds. I am your personal stylist. How may I assist you in finding your next exquisite piece today?",
        timestamp: new Date(),
      }
    ]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (isTyping) return;

    // Rate limit
    const now = Date.now();
    sendTimesRef.current = sendTimesRef.current.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (sendTimesRef.current.length >= RATE_LIMIT_MAX) {
      toast({ title: "Please slow down", description: `You can send ${RATE_LIMIT_MAX} messages per minute. Please wait a moment.`, variant: "destructive" });
      return;
    }
    sendTimesRef.current.push(now);

    const userMessage: Message = {
      id: now.toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    // Compute history before appending correctly (avoid stale closure)
    const historyForCall = [...messages, userMessage].slice(-11).slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const responseText = await aiStylistChat({ message: trimmed, history: historyForCall });
      
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, modelMessage]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to reach stylist. Please try again.";
      const isConfigError = message.includes('GEMINI_API_KEY') || message.includes('not configured');
      toast({
        title: isConfigError ? "Stylist unavailable" : "Message not sent",
        description: isConfigError ? "AI is not configured. Please add GEMINI_API_KEY." : message,
        variant: "destructive",
      });
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  }, [messages, isTyping, toast]);

  return (
    <ChatContext.Provider value={{ 
      messages, 
      isChatOpen, 
      isTyping, 
      openChat, 
      closeChat, 
      sendMessage,
      clearChat
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}
