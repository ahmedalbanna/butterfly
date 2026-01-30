
"use client"

import { useVoiceCall } from '@/context/voice-call-context';
import { Button } from '@/components/ui/button';
import { Sparkles, Phone, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function VoiceCallOverlay() {
  const { isCalling, isCallConnecting, audioUrl, isMuted, setIsMuted, endCall } = useVoiceCall();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isCalling) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isCalling]);

  if (!isCalling) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
      <style jsx>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
      `}</style>

      <div className="relative mb-12">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
        <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-primary/50 flex items-center justify-center bg-black">
          <Sparkles className="w-12 h-12 md:w-20 md:h-20 text-primary animate-pulse" />
        </div>
      </div>
      
      <div className="text-center space-y-4 mb-20 px-6">
        <h3 className="text-2xl md:text-4xl font-headline italic text-white">Luxe Stylist</h3>
        <p className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs">
          {isCallConnecting ? "Establishing Secure Line..." : "On Call - Live Consultation"}
        </p>
      </div>

      <div className="flex items-center gap-8 md:gap-12">
        <Button 
          onClick={() => setIsMuted(!isMuted)}
          variant="outline" 
          size="icon" 
          className="w-14 h-14 md:w-20 md:h-20 rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white"
        >
          {isMuted ? <VolumeX className="w-6 h-6 md:w-8 md:h-8" /> : <Volume2 className="w-6 h-6 md:w-8 md:h-8" />}
        </Button>
        
        <Button 
          onClick={endCall}
          variant="destructive" 
          size="icon" 
          className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
        >
          <Phone className="w-8 h-8 md:w-12 md:h-12 rotate-[135deg]" />
        </Button>
      </div>

      {audioUrl && (
        <audio 
          ref={audioRef}
          autoPlay 
          muted={isMuted}
          onEnded={endCall}
          src={audioUrl}
          className="hidden"
        />
      )}
    </div>
  );
}
