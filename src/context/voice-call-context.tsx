"use client"

import React, { createContext, useContext, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

type VoiceCallContextType = {
  isCalling: boolean;
  isCallConnecting: boolean;
  isMinimized: boolean;
  audioUrl: string | null;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  startCall: (product: { name: string; materials: string }) => Promise<void>;
  endCall: () => void;
};

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

export function VoiceCallProvider({ children }: { children: React.ReactNode }) {
  const [isCalling, setIsCalling] = useState(false);
  const [isCallConnecting, setIsCallConnecting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  const startCall = async (product: { name: string; materials: string }) => {
    setIsCalling(true);
    setIsCallConnecting(true);
    setIsMinimized(false);
    setAudioUrl(null);

    // محاكاة وقت الاتصال قبل تشغيل التسجيل الثابت
    setTimeout(() => {
      setAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); 
      setIsCallConnecting(false);
      
      toast({
        title: "Connected to Stylist",
        description: `You are now listening to information about ${product.name}.`,
      });
    }, 2000);
  };

  const endCall = () => {
    setIsCalling(false);
    setIsCallConnecting(false);
    setIsMinimized(false);
    setAudioUrl(null);
  };

  return (
    <VoiceCallContext.Provider value={{ 
      isCalling, 
      isCallConnecting, 
      isMinimized,
      audioUrl, 
      isMuted, 
      setIsMuted, 
      setIsMinimized,
      startCall, 
      endCall 
    }}>
      {children}
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCall() {
  const context = useContext(VoiceCallContext);
  if (!context) throw new Error('useVoiceCall must be used within a VoiceCallProvider');
  return context;
}
