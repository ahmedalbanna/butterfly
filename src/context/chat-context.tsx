"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type Message = {
  id: string;
  role: 'customer' | 'admin';
  content: string;
  timestamp: Date;
};

type ConnectionStatus = 'disconnected' | 'connecting' | 'waiting' | 'connected';

type ChatContextType = {
  messages: Message[];
  isChatOpen: boolean;
  isTyping: boolean;
  connectionStatus: ConnectionStatus;
  adminConnected: boolean;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'admin',
      content: "Welcome to the Butterfly Boutique. I am your lead concierge. Please describe how I may refine your experience today.",
      timestamp: new Date(),
    }
  ]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [adminConnected, setAdminConnected] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollTimestampRef = useRef<string | null>(null);

  // Initialize chat session
  const initializeChatSession = useCallback(async () => {
    if (messageId) return messageId;

    try {
      setConnectionStatus('connecting');
      
      // Create a new chat session
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Boutique Client',
          customerEmail: 'collector@luxefinds.com',
          type: 'chat',
        }),
      });

      const data = await response.json();
      if (data.success && data.messageId) {
        setMessageId(data.messageId);
        setConnectionStatus('waiting');
        return data.messageId;
      }
      throw new Error('Failed to create session');
    } catch (error) {
      console.error('[Chat] Init failed:', error);
      setConnectionStatus('disconnected');
      return null;
    }
  }, [messageId]);

  // Poll for new messages
  const pollMessages = useCallback(async (chatMessageId: string) => {
    try {
      const url = new URL('/api/chat/poll', window.location.origin);
      url.searchParams.set('messageId', chatMessageId);
      url.searchParams.set('type', 'customer');
      if (lastPollTimestampRef.current) url.searchParams.set('since', lastPollTimestampRef.current);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success) {
        // Update admin connection status
        setAdminConnected(data.otherPartyConnected || false);
        if (data.otherPartyConnected && connectionStatus === 'waiting') {
          setConnectionStatus('connected');
        }

        // Add new messages
        if (data.replies && data.replies.length > 0) {
          const newMessages: Message[] = data.replies.map((r: any) => ({
            id: r.id,
            role: r.sender,
            content: r.content,
            timestamp: new Date(r.createdAt),
          }));

          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const filtered = newMessages.filter(m => !existingIds.has(m.id));
            if (filtered.length === 0) return prev;
            return [...prev, ...filtered];
          });

          // Update typing indicator
          setIsTyping(false);
        }

        // Update last poll timestamp
        lastPollTimestampRef.current = data.timestamp;
      }
    } catch (error) {
      console.error('[Chat] Poll error:', error);
    }
  }, [connectionStatus]);

  // Send heartbeat to update connection status
  const sendHeartbeat = useCallback(async (chatMessageId: string) => {
    try {
      await fetch('/api/chat/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: chatMessageId, type: 'customer', connected: true }),
      });
    } catch (error) {
      console.error('[Chat] Heartbeat error:', error);
    }
  }, []);

  // Start polling when chat is open
  useEffect(() => {
    if (isChatOpen && messageId) {
      pollingIntervalRef.current = setInterval(() => pollMessages(messageId), 2000);
      heartbeatIntervalRef.current = setInterval(() => sendHeartbeat(messageId), 10000);
      pollMessages(messageId);
      sendHeartbeat(messageId);
      return () => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      };
    }
  }, [isChatOpen, messageId, pollMessages, sendHeartbeat]);

  const openChat = async () => {
    setIsChatOpen(true);
    if (!messageId) await initializeChatSession();
  };

  const closeChat = async () => {
    setIsChatOpen(false);
    if (messageId) {
      fetch('/api/chat/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, type: 'customer', connected: false }),
      });
    }
  };

  const sendMessage = async (content: string) => {
    if (!messageId) {
      const newMessageId = await initializeChatSession();
      if (!newMessageId) return;
    }

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: 'customer', content, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/ws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, type: 'customer', content }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => {
          // If polling already added the real ID, just remove the temp message
          if (prev.some(m => m.id === data.reply.id)) {
            return prev.filter(m => m.id !== tempId);
          }
          // Otherwise, update the temp message with its real permanent ID
          return prev.map(m => m.id === tempId ? { 
            ...m, 
            id: data.reply.id,
            timestamp: new Date(data.reply.createdAt)
          } : m);
        });
      }
    } catch (error) {
      console.error('[Chat] Send error:', error);
      setIsTyping(false);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  return (
    <ChatContext.Provider value={{ 
      messages, isChatOpen, isTyping, connectionStatus, adminConnected, openChat, closeChat, sendMessage 
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