'use client'

import { AlertTriangle, Clock, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExtendedUsageWarningProps {
  elapsed_minutes: number
  elapsed_seconds: number
  time_exceeded_by_minutes: number
  severity: "high" | "critical"
  onEndSession: () => void
}

export function ExtendedUsageWarning({ 
  elapsed_minutes, 
  elapsed_seconds, 
  time_exceeded_by_minutes, 
  severity,
  onEndSession 
}: ExtendedUsageWarningProps) {
  const isCritical = severity === "critical" || elapsed_minutes >= 60
  
  const bgColor = isCritical 
    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-700'
    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-700'
  
  const headerColor = isCritical
    ? 'text-red-900 dark:text-red-200'
    : 'text-amber-900 dark:text-amber-200'

  const textColor = isCritical
    ? 'text-red-700 dark:text-red-300'
    : 'text-amber-700 dark:text-amber-300'

  const borderColor = isCritical
    ? 'border-l-4 border-red-500'
    : 'border-l-4 border-amber-500'

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className={`${bgColor} ${borderColor} rounded-lg p-4 md:p-6 space-y-4 animate-pulse`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-6 w-6 flex-shrink-0 ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'} mt-1`} />
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold ${headerColor}`}>
            {isCritical ? '🚨 CRITICAL: Extended Screen Time!' : '⚠️ Extended Usage Warning'}
          </h3>
          <p className={`text-sm ${textColor} mt-2 leading-relaxed`}>
            You've been scrolling for <strong>{elapsed_minutes.toFixed(0)} minutes</strong> 
            {time_exceeded_by_minutes > 0 && (
              <> — <strong>{time_exceeded_by_minutes.toFixed(0)} minutes over the 30-minute limit</strong></>
            )}
            . This extended screen time can:
          </p>
          <ul className={`text-sm ${textColor} mt-2 space-y-1 list-disc list-inside`}>
            <li>🧠 Over-stimulate dopamine receptors (addiction risk)</li>
            <li>👁️ Cause eye strain and headaches</li>
            <li>😴 Disrupt sleep quality</li>
            <li>🔴 Reduce productivity and focus</li>
            <li>💔 Increase anxiety and depression</li>
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
            <span className={`font-mono font-bold text-lg ${isCritical ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {formatTime(elapsed_seconds)}
            </span>
          </div>
          <span className={`text-xs font-semibold uppercase ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {isCritical ? 'Critical' : 'High'} Alert
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <p className={`text-sm font-semibold ${headerColor}`}>
          Recommended Action:
        </p>
        <ol className={`text-sm ${textColor} space-y-2 list-decimal list-inside`}>
          <li>Take a break NOW — step away from the screen</li>
          <li>Go outside or do physical activity for 15 minutes</li>
          <li>Drink water and rest your eyes</li>
          <li>When you return, set a hard 10-minute timer</li>
        </ol>
      </div>

      <button
        onClick={onEndSession}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
          isCritical 
            ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700' 
            : 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700'
        }`}
      >
        <LogOut className="h-4 w-4" />
        End Session & Get Analysis
      </button>

      <p className={`text-xs ${textColor} text-center`}>
        Your health matters. {isCritical ? 'Please take action immediately.' : 'Consider taking a break.'}
      </p>
    </div>
  )
}
