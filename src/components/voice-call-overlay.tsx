"use client"

import { useVoiceCall } from '@/context/voice-call-context';
import { Button } from '@/components/ui/button';
import { Phone, Volume2, VolumeX, Minimize2, X, Radio, Mic, MicOff } from 'lucide-react';
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
    setIsMinimized,
    endCall,
    toggleMute,
  } = useVoiceCall();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play remote audio stream
  useEffect(() => {
    if (remoteStream && audioRef.current) {
      console.log('[Voice Overlay] Setting remote stream to audio element');
      audioRef.current.srcObject = remoteStream;
      
      const playAudio = async () => {
        try {
          await audioRef.current?.play();
          console.log('[Voice Overlay] Remote audio playing');
        } catch (error) {
          console.error('[Voice Overlay] Failed to play audio:', error);
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
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Calling Admin...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call Ended';
      case 'error':
        return 'Connection Failed';
      default:
        return 'Initializing...';
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
            <>
              <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-green-400/20 animate-pulse" />
            </>
          )}
          
          {/* Main Bubble */}
          <button 
            onClick={() => setIsMinimized(false)}
            className={cn(
              "relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.6)] hover:scale-110 transition-all duration-300 border-2",
              callStatus === 'connected' 
                ? "bg-gradient-to-br from-green-500/30 to-green-600/20 border-green-400/50" 
                : "bg-gradient-to-br from-primary/30 to-primary/20 border-primary/50"
            )}
          >
            <Phone className={cn(
              "w-7 h-7 md:w-8 md:h-8",
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
            onClick={(e) => {
              e.stopPropagation();
              endCall();
            }}
            className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110 border border-red-400/50"
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
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-black via-black to-primary/5 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-500">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Minimize button */}
      <button 
        onClick={() => setIsMinimized(true)}
        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center group"
      >
        <Minimize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <div className="relative flex flex-col items-center">
        {/* Call Status Circle */}
        <div className="relative mb-12">
          {/* Animated Rings */}
          {callStatus === 'connected' && (
            <>
              <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 rounded-full bg-green-400/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            </>
          )}
          {(callStatus === 'ringing' || callStatus === 'connecting') && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            </>
          )}

          {/* Main Circle */}
          <div className={cn(
            "relative w-40 h-40 md:w-56 md:h-56 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-[0_0_60px_rgba(0,0,0,0.4)]",
            callStatus === 'connected' 
              ? "bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-400/50" 
              : callStatus === 'error'
              ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-400/50"
              : "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/50"
          )}>
            {callStatus === 'connected' ? (
              <div className="relative">
                <Radio className="w-20 h-20 md:w-28 md:h-28 text-green-400 animate-pulse" />
                {isMuted && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center border-2 border-white/20">
                    <MicOff className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <Phone className={cn(
                "w-16 h-16 md:w-24 md:h-24",
                callStatus === 'error' ? "text-red-400" : "text-primary animate-pulse"
              )} />
            )}
          </div>
        </div>
        
        {/* Call Info */}
        <div className="text-center space-y-4 mb-16 px-6 max-w-md">
          <h3 className="text-3xl md:text-5xl font-headline italic text-white tracking-wide">
            Luxury Concierge
          </h3>
          <p className={cn(
            "text-lg md:text-xl font-bold uppercase tracking-[0.3em]",
            callStatus === 'connected' ? "text-green-400" : 
            callStatus === 'error' ? "text-red-400" : "text-primary"
          )}>
            {getStatusText()}
          </p>
          {callStatus === 'connected' && (
            <p className="text-sm text-white/60 uppercase tracking-wider">
              Live Voice Call
            </p>
          )}
          {callStatus === 'error' && (
            <p className="text-red-400 text-sm max-w-xs mx-auto">
              Please check your microphone permissions and try again
            </p>
          )}
        </div>

        {/* Call Controls */}
        <div className="flex items-center gap-6 md:gap-8">
          {/* Mute Button */}
          <button 
            onClick={toggleMute}
            disabled={callStatus !== 'connected'}
            className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-full border-2 transition-all flex items-center justify-center group disabled:opacity-40 disabled:cursor-not-allowed",
              isMuted 
                ? "bg-gradient-to-br from-red-500/30 to-red-600/20 border-red-400/50 hover:from-red-500/40 hover:to-red-600/30" 
                : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
            )}
          >
            {isMuted ? (
              <MicOff className="w-7 h-7 md:w-9 md:h-9 text-red-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Mic className="w-7 h-7 md:w-9 md:h-9 text-white group-hover:scale-110 transition-transform" />
            )}
          </button>
          
          {/* End Call Button */}
          <button 
            onClick={endCall}
            className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-all hover:scale-105 flex items-center justify-center border-2 border-red-400/50 group"
          >
            <Phone className="w-10 h-10 md:w-14 md:h-14 text-white rotate-[135deg] group-hover:scale-110 transition-transform" />
          </button>

          {/* Volume Button */}
          <button 
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 transition-all flex items-center justify-center group"
          >
            <Volume2 className="w-7 h-7 md:w-9 md:h-9 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Footer Note */}
        <p className="absolute bottom-8 text-white/20 uppercase tracking-[0.5em] text-[9px] font-bold">
          WebRTC • Encrypted • HD Audio
        </p>
      </div>

      {/* Remote audio element */}
      <audio ref={audioRef} autoPlay playsInline controls={false} className="hidden" />
    </div>
  );
}
