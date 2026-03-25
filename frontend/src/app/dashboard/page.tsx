'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ShieldCheck, TimerReset, Zap, LogOut } from "lucide-react"
import { MetricsChart } from "@/components/dashboard/metrics-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { ExtensionIntegration } from "@/components/dashboard/extension-integration"
import { MonitoringStatus } from "@/components/dashboard/monitoring-status"
import { ModeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useState, useEffect } from "react"
import { fetchUserStats, fetchWeeklyStats, registerUser, syncUserIdWithExtension } from "@/lib/api"

interface UserStats {
  user_id: string
  email: string
  full_name: string
  today_interventions: number
  daily_stats?: {
    time_reclaimed_minutes: number
    intervention_success_rate: number
  }
}

interface WeeklyStats {
  user_id: string
  period: string
  stats: Array<{
    date: string
    avg_velocity: number
    intervention_count: number
    success_rate: number
    time_reclaimed_minutes: number
    avg_mindless_score: number
  }>
}

export default function Dashboard() {
  const { user } = useUser()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionAnalysis, setSessionAnalysis] = useState<any>(null)

  useEffect(() => {
    // Listen for messages from chrome extension
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return
      
      if (event.data.type === 'SESSION_ANALYSIS') {
        console.log('📊 Received session analysis from extension:', event.data.data)
        setSessionAnalysis(event.data.data)
        
        // Clear the analysis after 10 seconds
        setTimeout(() => {
          setSessionAnalysis(null)
        }, 10000)
      }
      
      if (event.data.type === 'SHOW_EXTENDED_WARNING') {
        console.warn('⚠️ Extended usage warning from extension:', event.data.data)
        // Could show a toast notification here
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return
      
      try {
        setError(null)
        
        // Sync user_id with extension for telemetry
        syncUserIdWithExtension(user.id)
        
        // Register user with backend (sync Clerk data)
        if (user?.primaryEmailAddress?.emailAddress && user?.fullName) {
          await registerUser(
            user.id,
            user.primaryEmailAddress.emailAddress,
            user.fullName
          )
        }
        
        // Fetch user stats
        const userStatsData = await fetchUserStats(user.id)
        setUserStats(userStatsData)
        
        // Fetch weekly stats
        const weeklyStatsData = await fetchWeeklyStats(user.id)
        setWeeklyStats(weeklyStatsData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error('Error loading dashboard data:', errorMessage)
        
        // Provide helpful error messages
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          setError('⚠️ Cannot connect to backend. Make sure the backend server is running on http://localhost:8000')
        } else if (errorMessage.includes('404')) {
          setError('⚠️ API endpoint not found. Check if the backend routes are configured correctly.')
        } else if (errorMessage.includes('500')) {
          setError('⚠️ Backend server error. Check backend logs for details.')
        } else {
          setError(`⚠️ ${errorMessage}`)
        }
      }
    }

    // Initial load
    setLoading(true)
    loadData().finally(() => setLoading(false))

    // Real-time polling - refresh data every 10 seconds
    const pollInterval = setInterval(() => {
      loadData()
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [user?.id])

  // Calculate streak (placeholder - update based on your logic)
  const calculateStreak = () => {
    if (!weeklyStats?.stats.length) return 0
    let streak = 0
    for (let i = weeklyStats.stats.length - 1; i >= 0; i--) {
      if (weeklyStats.stats[i].intervention_count > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  // Calculate total weekly time reclaimed
  const calculateTotalTimeReclaimed = () => {
    if (!weeklyStats?.stats.length) return 0
    return weeklyStats.stats.reduce((sum, stat) => sum + stat.time_reclaimed_minutes, 0)
  }

  if (!user) {
    return (
      <div className="flex-1 space-y-6 p-8 md:p-10 pt-8 w-full max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">You need to be logged in to view the dashboard.</p>
          <Link href="/login">
            <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 md:p-10 pt-8 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back! Your focus journey continues.</p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded-lg text-red-700 dark:text-red-400 space-y-2">
          <div className="font-semibold">{error}</div>
          <div className="text-sm opacity-90">
            <p><strong>Troubleshooting steps:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Ensure the backend is running: <code className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">python backend/main.py</code></li>
              <li>Check that the backend is accessible at <code className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">http://localhost:8000</code></li>
              <li>Verify the database is initialized and has data</li>
              <li>Check browser console for detailed error messages</li>
            </ul>
          </div>
        </div>
      )}

      {sessionAnalysis && (
        <div className="bg-green-50 dark:bg-green-500/10 border-l-4 border-green-500 p-4 rounded-lg text-green-700 dark:text-green-400 space-y-3">
          <div className="font-semibold">✅ Session Complete - Analysis</div>
          <div className="text-sm opacity-90 grid gap-2">
            <p><strong>Duration:</strong> {sessionAnalysis.duration_minutes?.toFixed(1) || 'N/A'} minutes</p>
            <p><strong>Posts Viewed:</strong> {sessionAnalysis.metrics?.total_posts_viewed || 0}</p>
            <p><strong>Average Scroll Speed:</strong> {sessionAnalysis.metrics?.avg_scroll_velocity?.toFixed(2) || 'N/A'} px/s</p>
            <p><strong>Total Clicks:</strong> {sessionAnalysis.metrics?.total_clicks || 0}</p>
            <p><strong>Interventions Triggered:</strong> {sessionAnalysis.metrics?.interventions_triggered || 0}</p>
            {sessionAnalysis.analysis?.recommendations && (
              <p><strong>Recommendations:</strong> {sessionAnalysis.analysis.recommendations.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Time Reclaimed
                </CardTitle>
                <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
                  <TimerReset className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {calculateTotalTimeReclaimed()}m
                </div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> This week        
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Intervention Success
                </CardTitle>
                <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {userStats?.daily_stats?.intervention_success_rate ? Math.round(userStats.daily_stats.intervention_success_rate) : 0}%
                </div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> Success rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">Current Streak</CardTitle>
                <div className="h-8 w-8 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{calculateStreak()} Days</div>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {calculateStreak() > 0 ? 'Keep it up!' : 'Start your streak today!'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Today's Interventions
                </CardTitle>
                <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{userStats?.today_interventions || 0}</div>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Triggered today
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 pt-4">
            <div className="col-span-2 space-y-6">
              <ExtensionIntegration />
              <MonitoringStatus />
            </div>

            <Card className="col-span-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="px-6 pt-6 space-y-1">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Behavioral Trends</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">
                  Your scroll velocity and distraction periods over the last 7 days.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <MetricsChart data={weeklyStats?.stats || []} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-1 pt-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="px-6 pt-6 space-y-1">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Recent Interventions</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">
                  AI-driven prompts generated across sessions.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <RecentActivity weeklyStats={weeklyStats?.stats || []} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
