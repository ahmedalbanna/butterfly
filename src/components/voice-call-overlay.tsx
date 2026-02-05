"use client"

import { useVoiceCall } from '@/context/voice-call-context';
import { Button } from '@/components/ui/button';
import { Phone, Volume2, VolumeX, Minimize2, X, Radio, Mic, MicOff, Activity } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function VoiceCallOverlay() {
  const { 
    isCalling, 
    callStatus,
    isMinimized, 
    isMuted, 
    callDuration,
    remoteStream,
    localAudioLevel,
    remoteAudioLevel,
    setIsMinimized,
    endCall,
    toggleMute,
  } = useVoiceCall();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play remote audio stream
  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      const playAudio = async () => {
        try {
          await audioRef.current?.play();
        } catch (error) {
          setTimeout(playAudio, 1000);
        }
      };
      playAudio();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, [remoteStream]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting': return 'Authenticating...';
      case 'ringing': return 'Concierge Alert Sent...';
      case 'connected': return 'Direct Voice Connection';
      case 'ended': return 'Session Concluded';
      case 'error': return 'Handshake Failed';
      default: return 'Initializing Concierge...';
    }
  };

  if (!isCalling) return null;

  // Minimized view (floating bubble)
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] animate-in slide-in-from-bottom-10 duration-500">
        <div className="relative group">
          {/* Pulse Animation for Active Call */}
          {callStatus === 'connected' && (
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
          )}
          
          {/* Main Bubble */}
          <button 
            onClick={() => setIsMinimized(false)}
            className={cn(
              "relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 border-2",
              callStatus === 'connected' 
                ? "bg-black border-green-400/50" 
                : "bg-black border-primary/50"
            )}
          >
            <div 
              className="absolute inset-0 rounded-full opacity-20 bg-primary transition-all duration-300"
              style={{ transform: `scale(${1 + (localAudioLevel / 100)})` }}
            />
            <Phone className={cn(
              "w-7 h-7 md:w-8 md:h-8 relative z-10",
              callStatus === 'connected' ? "text-green-400" : "text-primary"
            )} />
            
            {/* Duration Badge */}
            {callStatus === 'connected' && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/80 bg-black/60 px-3 py-1 rounded-full border border-white/10 whitespace-nowrap font-mono">
                {formatDuration(callDuration)}
              </span>
            )}
          </button>
          
          {/* Close Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); endCall(); }}
            className="absolute -top-1 -right-1 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg border border-red-400/50"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mute Indicator */}
          {isMuted && (
            <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-red-500/90 rounded-full flex items-center justify-center border border-red-400/50 shadow-lg">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Remote audio element */}
        <audio ref={audioRef} autoPlay playsInline controls={false} className="hidden" />
      </div>
    );
  }

  // Full screen view
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center animate-in fade-in duration-700">
      <button 
        onClick={() => setIsMinimized(true)}
        className="absolute top-8 right-8 w-14 h-14 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
      >
        <Minimize2 className="w-6 h-6" />
      </button>

      <div className="relative flex flex-col items-center max-w-lg w-full px-6">
        {/* Audio Visualizer Circle */}
        <div className="relative mb-16">
          <div 
            className="absolute inset-0 rounded-full bg-primary/10 blur-xl transition-all duration-100"
            style={{ transform: `scale(${1 + (remoteAudioLevel / 50)})`, opacity: remoteAudioLevel / 100 }}
          />
          <div 
            className="absolute inset-0 rounded-full border-2 border-primary/20 transition-all duration-75"
            style={{ transform: `scale(${1 + (localAudioLevel / 100)})` }}
          />
          {/* Main Circle */}
          <div className={cn(
            "relative w-48 h-48 md:w-64 md:h-64 rounded-full border-2 flex items-center justify-center transition-all duration-1000 shadow-2xl",
            callStatus === 'connected' ? "bg-green-500/5 border-green-400/30" : "bg-primary/5 border-primary/30"
          )}>
            {callStatus === 'connected' ? (
              <div className="flex flex-col items-center">
                <Radio className="w-20 h-20 md:w-24 md:h-24 text-green-400/80 animate-pulse" />
                <span className="mt-4 font-mono text-xl text-green-400">{formatDuration(callDuration)}</span>
              </div>
            ) : (
              <Activity className="w-20 h-20 md:w-24 md:h-24 text-primary/40 animate-pulse" />
            )}
          </div>
        </div>
        {/* Call Info */}
        
        <div className="text-center space-y-4 mb-20">
          <h3 className="text-4xl md:text-6xl font-headline italic text-white tracking-tight">Concierge Voice</h3>
          <p className={cn(
            "text-xs md:text-sm font-bold uppercase tracking-[0.5em]",
            callStatus === 'connected' ? "text-green-400" : "text-primary"
          )}>
            {getStatusText()}
          </p>
          {callStatus === 'connected' && (
            <div className="flex items-center justify-center gap-2 text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> HD Audio Active
            </div>
          )}
        </div>
{/* Call Controls */}
        <div className="flex items-center gap-8 md:gap-12">
          <button 
            onClick={toggleMute}
            disabled={callStatus !== 'connected'}
            className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-full border-2 transition-all flex items-center justify-center disabled:opacity-20",
              isMuted ? "bg-red-500/20 border-red-400/50 text-red-400" : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            )}
          >
            {isMuted ? <MicOff className="w-7 h-7 md:w-8 md:h-8" /> : <Mic className="w-7 h-7 md:w-8 md:h-8" />}
          </button>
          {/* End Call Button */}
          <button 
            onClick={endCall}
            className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-red-600 hover:bg-red-700 shadow-2xl transition-all hover:scale-105 flex items-center justify-center border-2 border-red-400/50 group"
          >
            <Phone className="w-10 h-10 md:w-14 md:h-14 text-white rotate-[135deg]" />
          </button>
{/* Volume Button */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 bg-white/5 border-white/10 text-white/60 flex items-center justify-center">
            <Volume2 className="w-7 h-7 md:w-8 md:h-8" />
          </div>
        </div>
{/* Footer Note */}
        <p className="absolute bottom-12 text-white/10 uppercase tracking-[0.6em] text-[8px] font-bold">
          Butterfly Protocol • Encrypted Acquisition Channel
        </p>
      </div>
{/* Remote audio element */}
      <audio ref={audioRef} autoPlay playsInline controls={false} className="hidden" />
    </div>
  );
}
