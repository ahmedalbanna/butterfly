'use client';

import { useEffect, useState } from 'react';
import { getAllCallSessions, getCallStats, updateCallStatus, deleteCallSession, answerCall } from '@/app/actions/admin-calls';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Clock, Trash2, PhoneCall, PhoneMissed, PhoneOff, Radio, Smartphone, Bell, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VoiceCallSession } from '@prisma/client';
import { AdminVoiceCallOverlay } from '@/components/admin-voice-call-overlay';
import { useAdminNotifications } from '@/hooks/use-admin-notifications';
import { useAdminPresence, useOnlineAdmins } from '@/hooks/use-admin-presence';

export default function CallsPage() {
  const [calls, setCalls] = useState<VoiceCallSession[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    ringing: 0,
    active: 0,
    ended: 0,
    missed: 0,
    declined: 0,
    totalDuration: 0,
    averageDuration: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeCallSession, setActiveCallSession] = useState<VoiceCallSession | null>(null);
  const [isCallOverlayOpen, setIsCallOverlayOpen] = useState(false);
  const [answeringCallId, setAnsweringCallId] = useState<string | null>(null);
  const { toast } = useToast();

  // Mock admin info (in production, get from auth context)
  const adminId = 'admin-001';
  const adminName = 'Admin Assistant';

  // Admin presence tracking
  useAdminPresence({
    adminId,
    adminName,
    initialStatus: 'online',
    activeCall: activeCallSession?.id || null,
  });

  // Get online admins
  const { admins: onlineAdmins } = useOnlineAdmins();

  // Real-time notifications
  const { isConnected: notificationsConnected } = useAdminNotifications({
    adminId,
    onNotification: (notification) => {
      console.log('[Admin Calls] Notification received:', notification);

      // Handle different notification types
      switch (notification.event) {
        case 'new-call':
          toast({
            title: '📞 New Incoming Call',
            description: `${notification.data.customerName} is calling`,
            duration: 10000,
          });
          // Refresh data to show new call
          loadData();
          break;

        case 'call-answered':
          if (notification.data.adminId !== adminId) {
            toast({
              title: 'Call Answered',
              description: `${notification.data.adminName} answered the call`,
            });
            loadData();
          }
          break;

        case 'call-ended':
          toast({
            title: 'Call Ended',
            description: `Call duration: ${Math.round((notification.data.duration || 0) / 60)} minutes`,
          });
          loadData();
          break;

        case 'call-missed':
          toast({
            title: '⚠️ Missed Call',
            description: 'A call was not answered',
            variant: 'destructive',
          });
          loadData();
          break;
      }
    },
    onError: (error) => {
      console.error('[Admin Calls] Notification error:', error);
    },
  });

  useEffect(() => {
    loadData();
    // Refresh every 5 seconds
    let interval = setInterval(loadData, 5000);
    
    // Pause polling when tab is hidden (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval);
      } else {
        loadData();
        interval = setInterval(loadData, 5000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadData = async () => {
    const [callsData, statsData] = await Promise.all([
      getAllCallSessions(),
      getCallStats()
    ]);
    setCalls(callsData);
    setStats(statsData);
    setIsLoading(false);
  };

  const handleDelete = async (call: VoiceCallSession) => {
    if (!confirm(`Are you sure you want to delete this call session?`)) return;

    const result = await deleteCallSession(call.id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Call session deleted'
      });
      loadData();
    }
  };

  const handleAnswerCall = async (call: VoiceCallSession) => {
    if (call.status !== 'ringing') {
      toast({
        title: 'Error',
        description: 'Can only answer ringing calls',
        variant: 'destructive'
      });
      return;
    }

    setAnsweringCallId(call.id);

    try {
      const result = await answerCall(call.id, adminId, adminName);
      
      if (result) {
        setActiveCallSession(result);
        setIsCallOverlayOpen(true);
        toast({
          title: 'Call Connected',
          description: `Connected to ${call.customerName}`
        });
        loadData();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to answer call',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error answering call:', error);
      toast({
        title: 'Error',
        description: 'Failed to answer call',
        variant: 'destructive'
      });
    } finally {
      setAnsweringCallId(null);
    }
  };

  const handleDeclineCall = async (call: VoiceCallSession) => {
    if (call.status !== 'ringing') {
      toast({
        title: 'Error',
        description: 'Can only decline ringing calls',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await updateCallStatus(call.id, 'declined', adminId, adminName);
      
      if (result) {
        toast({
          title: 'Success',
          description: `Call from ${call.customerName} declined`
        });
        loadData();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to decline call',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error declining call:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline call',
        variant: 'destructive'
      });
    }
  };

  const handleCloseCallOverlay = () => {
    setIsCallOverlayOpen(false);
    setActiveCallSession(null);
    loadData();
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      ringing: { label: 'Ringing', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Phone },
      active: { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Radio },
      ended: { label: 'Ended', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: PhoneOff },
      missed: { label: 'Missed', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: PhoneMissed },
      declined: { label: 'Declined', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: PhoneOff }
    };
    const config = configs[status as keyof typeof configs] || configs.ringing;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-headline italic text-white mb-2">Voice Calls</h1>
          <p className="text-sm text-white/60 uppercase tracking-wider">Monitor customer voice call sessions</p>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          {/* Notifications Status */}
          <div className="flex items-center gap-2">
            <Bell className={`h-4 w-4 ${notificationsConnected ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm text-white/60">
              {notificationsConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          {/* Online Admins */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-white/60">
              {onlineAdmins.length} {onlineAdmins.length === 1 ? 'Admin' : 'Admins'} Online
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Calls', value: stats.total, icon: PhoneCall, color: 'text-blue-400' },
          { label: 'Active', value: stats.active, icon: Radio, color: 'text-green-400' },
          { label: 'Ended', value: stats.ended, icon: PhoneOff, color: 'text-gray-400' },
          { label: 'Missed', value: stats.missed, icon: PhoneMissed, color: 'text-red-400' },
          { label: 'Total Duration', value: formatDuration(stats.totalDuration), icon: Clock, color: 'text-purple-400' },
          { label: 'Avg Duration', value: formatDuration(stats.averageDuration), icon: Clock, color: 'text-primary' }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-black/40 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <p className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Calls List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center py-20">
          <Phone className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 italic">No call sessions yet</p>
        </div>
      ) : (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Customer</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Status</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Started</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Duration</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Admin</th>
                  <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-white/60 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-headline text-white">{call.customerName}</p>
                        <p className="text-xs text-white/40 font-mono">{call.customerId.slice(0, 12)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(call.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white/80">{new Date(call.startedAt).toLocaleDateString()}</p>
                        <p className="text-xs text-white/40">{new Date(call.startedAt).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-white font-mono">{formatDuration(call.duration)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {call.adminName ? (
                        <div>
                          <p className="text-white/80">{call.adminName}</p>
                          <p className="text-xs text-white/40">Handled</p>
                        </div>
                      ) : (
                        <span className="text-white/40 italic">Not answered</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        {call.status === 'ringing' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAnswerCall(call)}
                              disabled={answeringCallId === call.id}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {answeringCallId === call.id ? 'Answering...' : 'Answer'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDeclineCall(call)}
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
                            >
                              <PhoneOff className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(call)}
                          className="h-8 w-8 text-white/60 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Calls Alert */}
      {stats.active > 0 && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/40">
                <Radio className="w-6 h-6 text-green-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xl font-headline text-white mb-1">
                  {stats.active} Active {stats.active === 1 ? 'Call' : 'Calls'}
                </p>
                <p className="text-sm text-green-400 uppercase tracking-wider">Live voice connections in progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ringing Calls Alert */}
      {stats.ringing > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center border-2 border-yellow-500/40">
                <Phone className="w-6 h-6 text-yellow-400 animate-bounce" />
              </div>
              <div>
                <p className="text-xl font-headline text-white mb-1">
                  {stats.ringing} Incoming {stats.ringing === 1 ? 'Call' : 'Calls'}
                </p>
                <p className="text-sm text-yellow-400 uppercase tracking-wider">Customers waiting for answer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Voice Call Overlay */}
      <AdminVoiceCallOverlay
        callSession={activeCallSession}
        onClose={handleCloseCallOverlay}
        isOpen={isCallOverlayOpen}
      />
    </div>
  );
}
