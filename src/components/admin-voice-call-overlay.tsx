'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Minimize2, Maximize2, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebRTCCall, CallStatus } from '@/hooks/use-webrtc-call';
import { VoiceCallSession } from '@prisma/client';
import { cn } from '@/lib/utils';

interface AdminVoiceCallOverlayProps {
  callSession: VoiceCallSession | null;
  onClose: () => void;
  isOpen: boolean;
}

export function AdminVoiceCallOverlay({ callSession, onClose, isOpen }: AdminVoiceCallOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isVolumeExpanded, setIsVolumeExpanded] = useState(false);
  const { toast } = useToast();
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);

  // Initialize WebRTC call for admin
  const webrtc = useWebRTCCall({
    callId: callSession?.id || 'dummy',
    role: 'admin',
    onStatusChange: (status) => {
      console.log('[Admin Voice Call] Status changed:', status);
      
      if (status === 'connected') {
        toast({
          title: 'Connected',
          description: `Connected to ${callSession?.customerName}`,
        });
        // Start duration timer
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } else if (status === 'ended') {
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      }
    },
    onError: (error) => {
      console.error('[Admin Voice Call] Error:', error);
      toast({
        title: 'Call Error',
        description: error,
        variant: 'destructive'
      });
    }
  });

  // Set up remote audio stream
  useEffect(() => {
    if (remoteAudioRef.current && webrtc.remoteStream) {
      remoteAudioRef.current.srcObject = webrtc.remoteStream;
      remoteAudioRef.current.volume = volume / 100;
      
      const playAudio = async () => {
        try {
          await remoteAudioRef.current?.play();
          console.log('[Admin Voice Call] Remote audio playing');
        } catch (error) {
          console.error('[Admin Voice Call] Error playing remote audio:', error);
          setTimeout(playAudio, 1000);
        }
      };
      
      playAudio();
    }
  }, [webrtc.remoteStream, volume]);

  // Set up local audio stream (for monitoring own audio)
  useEffect(() => {
    if (localAudioRef.current && webrtc.localStream && !webrtc.isMuted) {
      // Note: In production, you might not want to play local stream back
      // This is mainly for testing purposes
      localAudioRef.current.muted = true; // Mute to avoid feedback
      localAudioRef.current.srcObject = webrtc.localStream;
    }
  }, [webrtc.localStream, webrtc.isMuted]);

  // Update volume when slider changes
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle closing the overlay
  const handleClose = async () => {
    if (webrtc.status !== 'idle' && webrtc.status !== 'ended') {
      webrtc.endCall();
    }
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    setCallDuration(0);
    
    // Clean up audio elements
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
    
    onClose();
  };

  if (!isOpen || !callSession) return null;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (isMinimized) {
    return (
      <div 
        className={cn(
          "fixed bottom-4 right-4 z-50 rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300",
          "bg-gradient-to-br from-gray-900 to-black border border-white/20",
          "hover:border-white/40 hover:from-gray-800 hover:to-gray-900"
        )}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full animate-pulse",
            webrtc.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
          )}></div>
          <div className="flex flex-col gap-0.5">
            <span className="text-white font-semibold text-sm">{callSession.customerName}</span>
            <span className="text-white/60 text-xs">{formatDuration(callDuration)}</span>
          </div>
          <Radio className="w-4 h-4 text-primary animate-pulse ml-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Hidden audio elements for audio streams */}
      <audio ref={remoteAudioRef} playsInline />
      <audio ref={localAudioRef} playsInline />

      {/* Main call panel */}
      <div className={cn(
        "bg-gradient-to-b from-gray-900 to-black border rounded-2xl shadow-2xl p-8 w-full max-w-md",
        "border-white/20 hover:border-white/30 transition-all duration-300",
        webrtc.status === 'connected' && 'ring-2 ring-green-500/20'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-headline text-white mb-1">{callSession.customerName}</h2>
            <p className="text-xs text-white/60 font-mono">ID: {callSession.customerId.slice(0, 12)}...</p>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Status indicator */}
        <div className="bg-black/40 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                webrtc.status === 'connected' ? 'bg-green-500' : 
                webrtc.status === 'connecting' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></div>
              <span className="text-white capitalize font-semibold">{webrtc.status}</span>
            </div>
            <span className="text-white/70 font-mono">{formatDuration(callDuration)}</span>
          </div>
        </div>

        {/* Call stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 rounded p-3">
            <p className="text-xs text-white/60 mb-1">Answered By</p>
            <p className="text-sm font-semibold text-white">{callSession.adminName || 'N/A'}</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-xs text-white/60 mb-1">Call Status</p>
            <p className="text-sm font-semibold text-white capitalize">{callSession.status}</p>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={webrtc.toggleMute}
            className={`flex-1 min-w-24 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              webrtc.isMuted
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
            }`}
          >
            {webrtc.isMuted ? (
              <>
                <MicOff className="w-5 h-5" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Mute
              </>
            )}
          </button>

          <button
            onClick={() => setIsVolumeExpanded(!isVolumeExpanded)}
            className="flex-1 min-w-24 py-3 rounded-lg font-semibold transition-all bg-white/10 text-white hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2"
          >
            {volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
            {volume}%
          </button>
        </div>

        {/* Volume slider */}
        {isVolumeExpanded && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4 text-white/60" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="text-white font-semibold min-w-12 text-right">{volume}%</span>
            </div>
          </div>
        )}

        {/* End call button */}
        <button
          onClick={handleClose}
          className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </button>

        {/* Additional info */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            Started at {new Date(callSession.startedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
