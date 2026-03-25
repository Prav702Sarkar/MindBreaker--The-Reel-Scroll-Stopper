'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function MonitoringStatus() {
  const { user } = useUser();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring && sessionStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, sessionStartTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const handleStartMonitoring = async () => {
    if (!isMonitoring) {
      setIsMonitoring(true);
      setSessionStartTime(Date.now());
      setElapsedTime(0);
      
      // Log monitoring start
      console.log('🔍 Monitoring started for user:', user?.id);
      
      try {
        // Optional: Send monitoring status to backend
        const response = await fetch('/api/monitoring/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => null); // Ignore errors if endpoint doesn't exist
      } catch (error) {
        console.log('Monitoring session started locally');
      }
    }
  };

  const handleStopMonitoring = async () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      
      console.log('⏹️  Monitoring stopped. Total time:', formatTime(elapsedTime));
      
      try {
        // Optional: Send monitoring end status to backend
        const response = await fetch('/api/monitoring/stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            duration_seconds: elapsedTime,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => null); // Ignore errors if endpoint doesn't exist
      } catch (error) {
        console.log('Monitoring session ended locally');
      }
    }
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-200 dark:border-emerald-500/30 shadow-md rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Live Monitoring
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
              {isMonitoring ? 'Session active' : 'Monitor your browsing in real-time'}
            </CardDescription>
          </div>
          {isMonitoring && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Recording</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-6 text-center border border-emerald-200 dark:border-emerald-500/20">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Elapsed Time</p>
          <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatTime(elapsedTime)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {isMonitoring ? 'Session in progress...' : 'No active session'}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isMonitoring ? (
            <Button
              onClick={handleStartMonitoring}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Monitoring
            </Button>
          ) : (
            <Button
              onClick={handleStopMonitoring}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Monitoring
            </Button>
          )}
        </div>

        {/* Status Info */}
        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3 border border-emerald-200 dark:border-emerald-500/20">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            💡 <span className="font-semibold">Tip:</span> Start monitoring to activate real-time intervention detection. The extension will trigger alerts when mindless scrolling is detected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
