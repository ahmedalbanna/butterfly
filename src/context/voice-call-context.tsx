"use client"

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { productVoiceInquiry } from '@/ai/flows/product-voice-inquiry-flow';

type VoiceCallContextType = {
  isCalling: boolean;
  isCallConnecting: boolean;
  isMinimized: boolean;
  audioUrl: string | null;
  isMuted: boolean;
  isDemo: boolean;
  setIsMuted: (muted: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  startCall: (product: { name: string; materials: string }) => Promise<void>;
  endCall: () => void;
};

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

const DEMO_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export function VoiceCallProvider({ children }: { children: React.ReactNode }) {
  const [isCalling, setIsCalling] = useState(false);
  const [isCallConnecting, setIsCallConnecting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const { toast } = useToast();
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
    };
  }, []);

  const startCall = async (product: { name: string; materials: string }) => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    setIsCalling(true);
    setIsCallConnecting(true);
    setIsMinimized(false);
    setAudioUrl(null);
    setIsDemo(false);

    const fallbackToDemo = (reason?: string) => {
      setAudioUrl(DEMO_AUDIO);
      setIsDemo(true);
      setIsCallConnecting(false);
      toast({
        title: reason ? "Demo mode" : "Connected to Stylist (Demo)",
        description: reason || `You are now listening to information about ${product.name}.`,
      });
    };

    // Try real TTS, fallback to demo on any failure (missing key, quota, network)
    connectTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await productVoiceInquiry({ productName: product.name, productMaterials: product.materials });
        if (result?.audioUri) {
          setAudioUrl(result.audioUri);
          setIsDemo(false);
          setIsCallConnecting(false);
          toast({
            title: "Connected to Stylist",
            description: `You are now listening to information about ${product.name}.`,
          });
        } else {
          fallbackToDemo();
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        const isConfig = msg.includes('GEMINI_API_KEY') || msg.includes('not configured');
        if (isConfig) {
          fallbackToDemo("AI voice not configured – playing demo audio.");
        } else {
          console.warn("TTS failed, using demo", e);
          fallbackToDemo();
        }
      } finally {
        connectTimeoutRef.current = null;
      }
    }, 1200);
  };

  const endCall = () => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    setIsCalling(false);
    setIsCallConnecting(false);
    setIsMinimized(false);
    setAudioUrl(null);
    setIsDemo(false);
  };

  return (
    <VoiceCallContext.Provider value={{ 
      isCalling, 
      isCallConnecting, 
      isMinimized,
      audioUrl, 
      isMuted, 
      isDemo,
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
