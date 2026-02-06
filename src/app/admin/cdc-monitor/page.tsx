'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Trash2, Activity, Database, Server } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CDCStatus {
  timestamp: string;
  status: 'healthy' | 'unhealthy' | 'error';
  components: {
    cdcListener: {
      active: boolean;
      status: string;
    };
    redis: {
      connected: boolean;
      status: string;
    };
  };
  cache?: {
    totalKeys: number;
    keyspaceHits: number;
    keyspaceMisses: number;
    hitRate: string;
    memoryUsed: string;
    memoryPeak: string;
  };
  message: string;
}

export default function CDCMonitorPage() {
  const [status, setStatus] = useState<CDCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/cdc/status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(`Failed to fetch status: ${err}`);
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const restartCDC = async () => {
    if (!confirm('Are you sure you want to restart the CDC system?')) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cdc/restart', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        alert('CDC system restarted successfully');
        await fetchStatus();
      } else {
        alert(`Failed to restart: ${data.message}`);
      }
    } catch (err) {
      alert(`Error restarting CDC: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('⚠️ This will clear ALL cached data. Are you sure?')) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cdc/clear-cache', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        alert('Cache cleared successfully');
        await fetchStatus();
      } else {
        alert(`Failed to clear cache: ${data.message}`);
      }
    } catch (err) {
      alert(`Error clearing cache: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !status) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
        <p>Loading CDC status...</p>
      </div>
    );
  }

  const isHealthy = status?.status === 'healthy';

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-white">CDC System Monitor</h1>
          <p className="text-white/60 mt-1">Real-time data synchronization status</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={fetchStatus} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Status */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isHealthy ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <AlertCircle className="text-red-500" />
                )}
                System Status
              </CardTitle>
              <CardDescription className="text-white/60">
                Last updated: {status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'Never'}
              </CardDescription>
            </div>
            <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-lg px-4 py-2">
              {status?.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-white/80">{status?.message}</p>
        </CardContent>
      </Card>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CDC Listener Status */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="text-blue-400" />
              CDC Listener
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Status</span>
              <Badge variant={status?.components.cdcListener.active ? 'default' : 'destructive'}>
                {status?.components.cdcListener.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Active</span>
              <span className="text-white">{status?.components.cdcListener.active ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Redis Status */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="text-red-400" />
              Redis Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Status</span>
              <Badge variant={status?.components.redis.connected ? 'default' : 'destructive'}>
                {status?.components.redis.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Connected</span>
              <span className="text-white">{status?.components.redis.connected ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      {status?.cache && (
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle>Cache Statistics</CardTitle>
            <CardDescription className="text-white/60">Performance metrics for Redis cache</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Total Keys</p>
                <p className="text-2xl font-bold text-white">{status.cache.totalKeys.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Hit Rate</p>
                <p className="text-2xl font-bold text-green-400">{status.cache.hitRate}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Memory Used</p>
                <p className="text-2xl font-bold text-white">{status.cache.memoryUsed}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Cache Hits</p>
                <p className="text-2xl font-bold text-white">{status.cache.keyspaceHits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Cache Misses</p>
                <p className="text-2xl font-bold text-white">{status.cache.keyspaceMisses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Peak Memory</p>
                <p className="text-2xl font-bold text-white">{status.cache.memoryPeak}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
          <CardDescription className="text-white/60">Management operations for the CDC system</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={restartCDC} variant="outline" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Restart CDC System
          </Button>
          <Button onClick={clearCache} variant="destructive" disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Cache
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
