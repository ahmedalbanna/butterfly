
"use client"

import { useVoiceCall } from '@/context/voice-call-context';
import { Button } from '@/components/ui/button';
import { Sparkles, Phone, Volume2, VolumeX, Minimize2, Maximize2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function VoiceCallOverlay() {
  const { 
    isCalling, 
    isCallConnecting, 
    isMinimized, 
    audioUrl, 
    isMuted, 
    setIsMuted, 
    setIsMinimized,
    endCall 
  } = useVoiceCall();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isCalling) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isCalling]);

  if (!isCalling) return null;

  // وضع التصغير (الفقاعة العائمة) - تم تحديث الموقع لتجنب التداخل مع المحادثة
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-24 md:bottom-12 md:right-32 z-[100] animate-in slide-in-from-bottom-10 duration-500">
        <div className="relative group">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-50" />
          <button 
            onClick={() => setIsMinimized(false)}
            className="relative w-16 h-16 rounded-full bg-black border-2 border-primary/50 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-110 transition-transform duration-300"
          >
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </button>
          
          <button 
            onClick={endCall}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
          >
            <X className="w-3 h-3" />
          </button>
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

  // وضع العرض الكامل (السينمائي)
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500 box-border">
      <style jsx>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
      `}</style>

      {/* زر التصغير في الأعلى */}
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
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
        <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-primary/50 flex items-center justify-center bg-black">
          <Sparkles className="w-12 h-12 md:w-20 md:h-20 text-primary animate-pulse" />
        </div>
      </div>
      
      <div className="text-center space-y-4 mb-20 px-6 max-w-md">
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
          className={cn(
            "w-14 h-14 md:w-20 md:h-20 rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all",
            isMuted && "bg-primary/20 border-primary/40"
          )}
        >
          {isMuted ? <VolumeX className="w-6 h-6 md:w-8 md:h-8 text-primary" /> : <Volume2 className="w-6 h-6 md:w-8 md:h-8" />}
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
        Secure Encrypted Line
      </p>

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
