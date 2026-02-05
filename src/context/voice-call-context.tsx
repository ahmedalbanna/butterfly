"use client"

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWebRTCCall, CallStatus } from '@/hooks/use-webrtc-call';

type VoiceCallContextType = {
  isCalling: boolean;
  callStatus: CallStatus;
  isMinimized: boolean;
  isMuted: boolean;
  callDuration: number;
  remoteStream: MediaStream | null;
  localAudioLevel: number;
  remoteAudioLevel: number;
  setIsMinimized: (minimized: boolean) => void;
  startCall: (productContext?: { name: string; materials: string }) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
};

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

export function VoiceCallProvider({ children }: { children: React.ReactNode }) {
  const [isCalling, setIsCalling] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const { toast } = useToast();
  
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track if call was ever connected
  const wasConnectedRef = useRef(false);

  // Initialize WebRTC hook only when we have a callId
  const webrtcEnabled = callId !== null;
  const webrtc = useWebRTCCall({
    callId: callId || 'dummy',
    role: 'customer',
    onStatusChange: (status) => {
      console.log('[Voice Call] Status changed:', status);
      
      if (status === 'connected') {
        wasConnectedRef.current = true;
        toast({
          title: "Connected to Admin",
          description: "You are now in a live voice call with our team.",
        });
        // Start duration timer
        callStartTimeRef.current = Date.now();
        durationIntervalRef.current = setInterval(() => {
          if (callStartTimeRef.current) {
            setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
          }
        }, 1000);
      } else if (status === 'ended') {
        handleCallEnd(wasConnectedRef.current);
      } else if (status === 'error') {
        toast({
          title: "Call Failed",
          description: "Failed to connect. Please try again.",
          variant: "destructive",
        });
        handleCallEnd(wasConnectedRef.current);
      }
    },
    onError: (error) => {
      console.error('[Voice Call] Error:', error);
      toast({
        title: "Call Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  const handleCallEnd = (wasConnected: boolean = false) => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (callId) {
      let status = 'ended';
      let duration = null;

      // If call was connected, calculate duration
      if (wasConnected && callStartTimeRef.current) {
        duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      } else if (!wasConnected) {
        // If customer cancels before admin answers, mark as missed
        status = 'missed';
      }

      fetch('/api/calls/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          status,
          duration,
        }),
      });
    }

    setIsCalling(false);
    setIsMinimized(false);
    setCallId(null);
    setCallDuration(0);
    callStartTimeRef.current = null;
  };

  const startCall = async (productContext?: { name: string; materials: string }) => {
    try {
      setIsCalling(true);
      setIsMinimized(false);
      setCallDuration(0);

      const customerName = productContext 
        ? `Boutique Client (Inquiry: ${productContext.name})` 
        : 'Boutique Client';

      const response = await fetch('/api/calls/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: `customer-${Date.now()}`,
          customerName,
        }),
      });

      const data = await response.json();

      if (data.success && data.callId) {
        setCallId(data.callId);
        
        // WebRTC will start after callId is set
        // Need to wait for next render cycle
        setTimeout(() => {
          if (webrtcEnabled) {
            webrtc.startCall();
          }
        }, 100);
      } else {
        throw new Error('Failed to create call session');
      }
    } catch (error) {
      console.error('[Voice Call] Failed to start:', error);
      toast({
        title: "Call Failed",
        description: "Failed to initiate call. Please try again.",
        variant: "destructive",
      });
      setIsCalling(false);
    }
  };

  const endCall = () => {
    if (webrtcEnabled) {
      webrtc.endCall();
    }
    handleCallEnd(wasConnectedRef.current);
    wasConnectedRef.current = false;
  };

  const toggleMute = () => {
    if (webrtcEnabled) {
      webrtc.toggleMute();
    }
  };

  // Start WebRTC call when callId is set
  useEffect(() => {
    if (callId && webrtcEnabled && webrtc.status === 'idle') {
      webrtc.startCall();
    }
  }, [callId]);

  return (
    <VoiceCallContext.Provider value={{ 
      isCalling, 
      callStatus: webrtcEnabled ? webrtc.status : 'idle',
      isMinimized,
      isMuted: webrtcEnabled ? webrtc.isMuted : false,
      callDuration,
      remoteStream: webrtcEnabled ? webrtc.remoteStream : null,
      localAudioLevel: webrtcEnabled ? webrtc.localAudioLevel : 0,
      remoteAudioLevel: webrtcEnabled ? webrtc.remoteAudioLevel : 0,
      setIsMinimized,
      startCall, 
      endCall,
      toggleMute,
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
