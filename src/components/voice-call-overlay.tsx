
"use client"

import { useVoiceCall } from '@/context/voice-call-context';
import { Button } from '@/components/ui/button';
import { Phone, Volume2, VolumeX, Minimize2, X, Radio } from 'lucide-react';
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
      
      // Ensure audio plays (browser autoplay policy)
      const playAudio = async () => {
        try {
          await audioRef.current?.play();
          console.log('[Voice Overlay] Remote audio playing');
        } catch (error) {
          console.error('[Voice Overlay] Failed to play audio:', error);
          // Retry after user interaction
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

  // Get status text
  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Calling Admin...';
      case 'connected':
        return `On Call - ${formatDuration(callDuration)}`;
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
      <div className="fixed bottom-6 right-24 md:bottom-12 md:right-32 z-[100] animate-in slide-in-from-bottom-10 duration-500">
        <div className="relative group">
          {callStatus === 'connected' && (
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping opacity-50" />
          )}
          <button 
            onClick={() => setIsMinimized(false)}
            className={cn(
              "relative w-16 h-16 rounded-full bg-black border-2 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-110 transition-transform duration-300",
              callStatus === 'connected' ? "border-green-400/50" : "border-primary/50"
            )}
          >
            <Phone className={cn(
              "w-6 h-6",
              callStatus === 'connected' ? "text-green-400 animate-pulse" : "text-primary animate-pulse"
            )} />
            {callStatus === 'connected' && (
              <span className="absolute -bottom-6 text-xs text-white/60">
                {formatDuration(callDuration)}
              </span>
            )}
          </button>
          
          <button 
            onClick={endCall}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Remote audio element - hidden but playing */}
        <audio 
          ref={audioRef}
          autoPlay
          playsInline
          controls={false}
          className="hidden"
        />
      </div>
    );
  }

  // Full screen view
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
      <style jsx>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
      `}</style>

      {/* Minimize button */}
      <div className="absolute top-8 right-8 flex gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMinimized(true)}
          className="text-white/40 hover:text-white hover:bg-white/10 rounded-full"
        >
          <Minimize2 className="w-6 h-6" />
        </Button>
      </div>

      <div className="relative mb-12">
        {callStatus === 'connected' && (
          <div className="absolute inset-0 rounded-full bg-green-400/20 animate-pulse-ring" />
        )}
        {(callStatus === 'ringing' || callStatus === 'connecting') && (
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
        )}
        <div className={cn(
          "relative w-32 h-32 md:w-48 md:h-48 rounded-full border-2 flex items-center justify-center bg-black",
          callStatus === 'connected' ? "border-green-400/50" : "border-primary/50"
        )}>
          {callStatus === 'connected' ? (
            <Radio className="w-12 h-12 md:w-20 md:h-20 text-green-400 animate-pulse" />
          ) : (
            <Phone className={cn(
              "w-12 h-12 md:w-20 md:h-20 animate-pulse",
              callStatus === 'error' ? "text-red-400" : "text-primary"
            )} />
          )}
        </div>
      </div>
      
      <div className="text-center space-y-4 mb-20 px-6 max-w-md">
        <h3 className="text-2xl md:text-4xl font-headline italic text-white">Live Admin Call</h3>
        <p className={cn(
          "font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs",
          callStatus === 'connected' ? "text-green-400" : "text-primary"
        )}>
          {getStatusText()}
        </p>
        {callStatus === 'error' && (
          <p className="text-red-400 text-sm">
            Please check your microphone permissions and try again
          </p>
        )}
      </div>

      <div className="flex items-center gap-8 md:gap-12">
        <Button 
          onClick={toggleMute}
          variant="outline" 
          size="icon"
          disabled={callStatus !== 'connected'}
          className={cn(
            "w-14 h-14 md:w-20 md:h-20 rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all",
            isMuted && "bg-red-500/20 border-red-500/40"
          )}
        >
          {isMuted ? <VolumeX className="w-6 h-6 md:w-8 md:h-8 text-red-400" /> : <Volume2 className="w-6 h-6 md:w-8 md:h-8" />}
        </Button>
        
        <Button 
          onClick={endCall}
          variant="destructive" 
          size="icon" 
          className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-transform hover:scale-105"
        >
          <Phone className="w-8 h-8 md:w-12 md:h-12 rotate-[135deg]" />
        </Button>
      </div>

      <p className="absolute bottom-12 text-white/20 uppercase tracking-[0.5em] text-[8px] font-bold">
        WebRTC Encrypted Connection
      </p>

      {/* Remote audio element - hidden but playing */}
      <audio 
        ref={audioRef}
        autoPlay
        playsInline
        controls={false}
        className="hidden"
      />
    </div>
  );
}
