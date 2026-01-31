'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getActiveCalls, getCallHistory, getCallStats } from '@/app/actions/calls';
import { useWebRTCCall } from '@/hooks/use-webrtc-call';
import { Phone, PhoneIncoming, PhoneOff, Volume2, VolumeX, Radio, Clock, User } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface VoiceCallSession {
  id: string;
  customerId: string;
  customerName: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null;
  adminId: string | null;
  adminName: string | null;
}

export default function AdminCallsPage() {
  const [activeCalls, setActiveCalls] = useState<VoiceCallSession[]>([]);
  const [callHistory, setCallHistory] = useState<VoiceCallSession[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, missed: 0, averageDuration: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<VoiceCallSession | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC for active call
  const webrtc = useWebRTCCall({
    callId: selectedCall?.id || 'dummy',
    role: 'admin',
    onStatusChange: (status) => {
      console.log('[Admin Call] Status:', status);
      
      if (status === 'connected' && selectedCall) {
        // Update call status in database
        fetch('/api/calls/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callId: selectedCall.id,
            status: 'active',
            adminId: 'admin-1',
            adminName: 'Admin',
          }),
        });

        // Start duration timer
        callStartTimeRef.current = Date.now();
        durationIntervalRef.current = setInterval(() => {
          if (callStartTimeRef.current) {
            setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
          }
        }, 1000);
      } else if (status === 'ended') {
        handleCallEnd();
      }
    },
    onError: (error) => {
      console.error('[Admin Call] Error:', error);
    },
  });

  // Play remote audio stream
  useEffect(() => {
    if (webrtc.remoteStream && audioRef.current) {
      audioRef.current.srcObject = webrtc.remoteStream;
      audioRef.current.play().catch(e => console.error('Failed to play audio:', e));
    }
  }, [webrtc.remoteStream]);

  const loadData = async () => {
    const [callsResult, historyResult, statsResult] = await Promise.all([
      getActiveCalls(),
      getCallHistory(20),
      getCallStats(),
    ]);

    if (callsResult.success) {
      setActiveCalls(callsResult.calls as VoiceCallSession[]);
    }
    if (historyResult.success) {
      setCallHistory(historyResult.calls as VoiceCallSession[]);
    }
    if (statsResult.success) {
      setStats(statsResult.stats);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Poll for new calls every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      loadData();
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleCallEnd = () => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Update call in database
    if (selectedCall && callStartTimeRef.current) {
      const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      fetch('/api/calls/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: selectedCall.id,
          status: 'ended',
          duration,
        }),
      });
    }

    setSelectedCall(null);
    setCallDuration(0);
    callStartTimeRef.current = null;
    loadData();
  };

  const acceptCall = async (call: VoiceCallSession) => {
    setSelectedCall(call);
    setCallDuration(0);
    
    // WebRTC will start after selectedCall is set
    setTimeout(() => {
      webrtc.answerCall();
    }, 100);
  };

  const declineCall = async (call: VoiceCallSession) => {
    await fetch('/api/calls/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callId: call.id,
        status: 'declined',
      }),
    });
    loadData();
  };

  const endCall = () => {
    webrtc.endCall();
    handleCallEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const ringingCalls = activeCalls.filter(c => c.status === 'ringing');
  const ongoingCalls = activeCalls.filter(c => c.status === 'active');

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-primary mb-2">Voice Calls</h1>
        <p className="text-neutral-400">Manage incoming and active voice calls</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900/50 border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Incoming</CardDescription>
            <CardTitle className="text-3xl text-primary">{ringingCalls.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900/50 border-green-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Active</CardDescription>
            <CardTitle className="text-3xl text-green-400">{ongoingCalls.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Missed</CardDescription>
            <CardTitle className="text-3xl text-neutral-200">{stats.missed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-neutral-900/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Avg Duration</CardDescription>
            <CardTitle className="text-3xl text-neutral-200">{formatDuration(stats.averageDuration)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Active Call Interface */}
      {selectedCall && webrtc.status !== 'idle' && (
        <Card className="bg-gradient-to-br from-green-500/10 to-primary/10 border-green-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-green-400 animate-pulse" />
                  Active Call: {selectedCall.customerName}
                </CardTitle>
                <CardDescription className="mt-1">
                  {webrtc.status === 'connected' ? `Duration: ${formatDuration(callDuration)}` : 'Connecting...'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={webrtc.toggleMute}
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full",
                    webrtc.isMuted && "bg-red-500/20 border-red-500/40"
                  )}
                >
                  {webrtc.isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={endCall}
                  variant="destructive"
                  size="icon"
                  className="rounded-full"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Incoming Calls */}
        <Card className="bg-neutral-900/50 border-neutral-700 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneIncoming className="h-5 w-5 text-primary" />
              Incoming Calls ({ringingCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="text-center py-8 text-neutral-400">Loading calls...</div>
              ) : ringingCalls.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <PhoneIncoming className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No incoming calls</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ringingCalls.map((call) => (
                    <Card key={call.id} className="bg-neutral-800/50 border-primary/20 animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-100">{call.customerName}</p>
                              <p className="text-xs text-neutral-400">
                                {formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => acceptCall(call)}
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              disabled={!!selectedCall}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => declineCall(call)}
                              size="sm"
                              variant="outline"
                              className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                            >
                              <PhoneOff className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Call History */}
        <Card className="bg-neutral-900/50 border-neutral-700 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Calls
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              {callHistory.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">No call history</div>
              ) : (
                <div className="space-y-2">
                  {callHistory.map((call) => (
                    <div
                      key={call.id}
                      className="p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50 hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-neutral-200 text-sm">{call.customerName}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              call.status === 'ended' && "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                              call.status === 'missed' && "bg-red-500/10 text-red-400 border-red-500/20",
                              call.status === 'declined' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            )}
                          >
                            {call.status}
                          </Badge>
                        </div>
                        {call.duration && (
                          <span className="text-xs text-neutral-500">
                            {formatDuration(call.duration)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">
                        {format(new Date(call.startedAt), 'PPp')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Remote audio element */}
      <audio ref={audioRef} autoPlay className="hidden" />
    </div>
  );
}
