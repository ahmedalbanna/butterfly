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
      content: "Welcome to LuxeFinds Live Support. Please describe how we can assist you today, and an admin will join shortly.",
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
    if (messageId) return messageId; // Already initialized

    try {
      setConnectionStatus('connecting');
      
      // Create a new chat session
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Guest Customer',
          customerEmail: 'guest@luxefinds.com',
          type: 'chat',
        }),
      });

      const data = await response.json();
      
      if (data.success && data.messageId) {
        setMessageId(data.messageId);
        setConnectionStatus('waiting');
        return data.messageId;
      } else {
        throw new Error('Failed to create chat session');
      }
    } catch (error) {
      console.error('[Chat] Failed to initialize:', error);
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
      if (lastPollTimestampRef.current) {
        url.searchParams.set('since', lastPollTimestampRef.current);
      }

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
            return [...prev, ...filtered];
          });

          // Update typing indicator
          setIsTyping(false);
        }

        // Update last poll timestamp
        lastPollTimestampRef.current = data.timestamp;
      }
    } catch (error) {
      console.error('[Chat] Polling error:', error);
    }
  }, [connectionStatus]);

  // Send heartbeat to update connection status
  const sendHeartbeat = useCallback(async (chatMessageId: string) => {
    try {
      await fetch('/api/chat/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: chatMessageId,
          type: 'customer',
          connected: true,
        }),
      });
    } catch (error) {
      console.error('[Chat] Heartbeat error:', error);
    }
  }, []);

  // Start polling when chat is open
  useEffect(() => {
    if (isChatOpen && messageId) {
      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        pollMessages(messageId);
      }, 2000);

      // Send heartbeat every 10 seconds
      heartbeatIntervalRef.current = setInterval(() => {
        sendHeartbeat(messageId);
      }, 10000);

      // Initial poll
      pollMessages(messageId);
      sendHeartbeat(messageId);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }
  }, [isChatOpen, messageId, pollMessages, sendHeartbeat]);

  const openChat = async () => {
    setIsChatOpen(true);
    if (!messageId) {
      await initializeChatSession();
    }
  };

  const closeChat = async () => {
    setIsChatOpen(false);
    
    // Send disconnect heartbeat
    if (messageId) {
      try {
        await fetch('/api/chat/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            type: 'customer',
            connected: false,
          }),
        });
      } catch (error) {
        console.error('[Chat] Disconnect error:', error);
      }
    }
  };

  const sendMessage = async (content: string) => {
    if (!messageId) {
      const newMessageId = await initializeChatSession();
      if (!newMessageId) {
        console.error('[Chat] Cannot send message without session');
        return;
      }
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'customer',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/ws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          type: 'customer',
          content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Replace temp message with real one
        setMessages(prev => 
          prev.map(m => 
            m.id === userMessage.id 
              ? { ...m, id: data.reply.id }
              : m
          )
        );
      }
    } catch (error) {
      console.error('[Chat] Send error:', error);
      setIsTyping(false);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      isChatOpen, 
      isTyping, 
      connectionStatus,
      adminConnected,
      openChat, 
      closeChat, 
      sendMessage 
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
