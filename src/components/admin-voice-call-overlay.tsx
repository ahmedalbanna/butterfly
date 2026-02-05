'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Minimize2, Maximize2, Radio, Activity, Sparkles } from 'lucide-react';
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

  const webrtc = useWebRTCCall({
    callId: callSession?.id || 'dummy',
    role: 'admin',
    onStatusChange: (status) => {
      if (status === 'connected') {
        toast({
          title: 'Direct Connection Active',
          description: `Client ${callSession?.customerName} is now live.`,
        });
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } else if (status === 'ended') {
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      }
    },
    onError: (error) => {
      toast({
        title: 'Boutique Protocol Error',
        description: error,
        variant: 'destructive'
      });
    }
  });

  useEffect(() => {
    if (remoteAudioRef.current && webrtc.remoteStream) {
      remoteAudioRef.current.srcObject = webrtc.remoteStream;
      remoteAudioRef.current.volume = volume / 100;
      const playAudio = async () => {
        try {
          await remoteAudioRef.current?.play();
        } catch (error) {
          setTimeout(playAudio, 1000);
        }
      };
      playAudio();
    }
  }, [webrtc.remoteStream, volume]);

  const handleClose = async () => {
    if (webrtc.status !== 'idle' && webrtc.status !== 'ended') {
      webrtc.endCall();
    }
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    setCallDuration(0);
    onClose();
  };

  if (!isOpen || !callSession) return null;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-6 right-6 z-50 rounded-xl shadow-2xl p-5 cursor-pointer bg-black border border-white/10 hover:border-primary/40 transition-all duration-500"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            webrtc.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
          )} />
          <div className="flex flex-col">
            <span className="text-white font-headline italic text-sm">{callSession.customerName}</span>
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{formatDuration(callDuration)}</span>
          </div>
          <Activity className="w-4 h-4 text-primary animate-pulse ml-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
      <audio ref={remoteAudioRef} playsInline />

      <div className="bg-black border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] p-10 w-full max-w-xl relative overflow-hidden">
        {/* Background Visualizer */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none transition-all duration-100"
          style={{ transform: `scale(${1 + (webrtc.remoteAudioLevel / 100)})` }}
        >
          <div className="w-full h-full bg-primary rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <header className="flex items-start justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/40">Active Concierge Live</p>
              </div>
              <h2 className="text-4xl font-headline italic text-white">{callSession.customerName}</h2>
            </div>
            <button onClick={() => setIsMinimized(true)} className="text-white/20 hover:text-white p-2">
              <Minimize2 className="w-6 h-6" />
            </button>
          </header>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Status</span>
              </div>
              <p className="text-lg font-headline italic text-white capitalize">{webrtc.status}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-right">
              <div className="flex items-center justify-end gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Duration</span>
                <Radio className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <p className="text-2xl font-mono font-bold text-primary">{formatDuration(callDuration)}</p>
            </div>
          </div>

          {/* Voice Levels */}
          <div className="space-y-4 mb-10">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold text-white/30">
              <span>Your Audio</span>
              <span>{webrtc.localAudioLevel}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-75" style={{ width: `${webrtc.localAudioLevel}%` }} />
            </div>
            <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold text-white/30">
              <span>Client Audio</span>
              <span>{webrtc.remoteAudioLevel}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 transition-all duration-75" style={{ width: `${webrtc.remoteAudioLevel}%` }} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button
                onClick={webrtc.toggleMute}
                className={cn(
                  "flex-1 py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 border",
                  webrtc.isMuted 
                    ? "bg-red-500/10 border-red-500/30 text-red-400" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                {webrtc.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {webrtc.isMuted ? 'Unmute Mic' : 'Mute Concierge'}
              </button>

              <button
                onClick={() => setIsVolumeExpanded(!isVolumeExpanded)}
                className="w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {isVolumeExpanded && (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl animate-in slide-in-from-top-2">
                <input
                  type="range"
                  min="0" max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full py-6 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-red-900/20"
            >
              <PhoneOff className="w-5 h-5" />
              Terminate Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
