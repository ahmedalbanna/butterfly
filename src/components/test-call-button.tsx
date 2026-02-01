'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVoiceCall } from '@/context/voice-call-context';

export function TestCallButton() {
  const [isInitiating, setIsInitiating] = useState(false);
  const { startCall, isCalling } = useVoiceCall();
  const { toast } = useToast();

  const handleTestCall = async () => {
    if (isCalling) {
      toast({
        title: 'Already in Call',
        description: 'You are already in a voice call. End it to start a new one.',
        variant: 'destructive'
      });
      return;
    }

    setIsInitiating(true);

    try {
      // Initiate a test call to the admin
      await startCall();
      
      toast({
        title: 'Call Initiated',
        description: 'Connecting to our admin team...',
      });
    } catch (error) {
      console.error('Test call error:', error);
      toast({
        title: 'Call Failed',
        description: 'Unable to initiate call. Please check your microphone permissions.',
        variant: 'destructive'
      });
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <Button
      onClick={handleTestCall}
      disabled={isInitiating || isCalling}
      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold gap-2 transition-all duration-300"
    >
      {isInitiating ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          Initiating...
        </>
      ) : isCalling ? (
        <>
          <Phone className="w-4 h-4" />
          In Call
        </>
      ) : (
        <>
          <Phone className="w-4 h-4" />
          Test Voice Call
        </>
      )}
    </Button>
  );
}
