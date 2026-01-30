
"use client"

import React, { createContext, useContext, useState, useRef } from 'react';
import { productVoiceInquiry } from '@/ai/flows/product-voice-inquiry-flow';
import { useToast } from '@/hooks/use-toast';

type VoiceCallContextType = {
  isCalling: boolean;
  isCallConnecting: boolean;
  audioUrl: string | null;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  startCall: (product: { name: string; materials: string }) => Promise<void>;
  endCall: () => void;
};

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

export function VoiceCallProvider({ children }: { children: React.ReactNode }) {
  const [isCalling, setIsCalling] = useState(false);
  const [isCallConnecting, setIsCallConnecting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startCall = async (product: { name: string; materials: string }) => {
    setIsCalling(true);
    setIsCallConnecting(true);
    setAudioUrl(null);

    try {
      const response = await productVoiceInquiry({
        productName: product.name,
        productMaterials: product.materials,
      });
      setAudioUrl(response.audioUri);
      setIsCallConnecting(false);
    } catch (error) {
      console.error('Call failed:', error);
      setIsCalling(false);
      setIsCallConnecting(false);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Could not connect to the stylist. Please try again later.",
      });
    }
  };

  const endCall = () => {
    setIsCalling(false);
    setIsCallConnecting(false);
    setAudioUrl(null);
  };

  return (
    <VoiceCallContext.Provider value={{ 
      isCalling, 
      isCallConnecting, 
      audioUrl, 
      isMuted, 
      setIsMuted, 
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
