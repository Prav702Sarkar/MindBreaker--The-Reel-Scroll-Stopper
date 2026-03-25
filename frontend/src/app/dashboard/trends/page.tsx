'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, TrendingUp, Calendar } from "lucide-react"
import { MetricsChart } from "@/components/dashboard/metrics-chart"
import { ModeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useState, useEffect } from "react"
import { fetchWeeklyStats } from "@/lib/api"

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

export default function TrendsPage() {
  const { user } = useUser()
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)
        const data = await fetchWeeklyStats(user.id)
        setWeeklyStats(data)
      } catch (err) {
        console.error('Error loading trends data:', err)
        setError('Failed to load trends data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const calculateAverageScrolls = () => {
    if (!weeklyStats?.stats.length) return 0
    const avg = weeklyStats.stats.reduce((sum, stat) => sum + stat.avg_velocity, 0) / weeklyStats.stats.length
    return Math.round(avg * 100) / 100
  }

  const findPeakHours = () => {
    // This is a placeholder - in a real implementation, you'd track hourly data
    if (!weeklyStats?.stats.length) return 'N/A'
    return '9-11 PM' // Default placeholder
  }

  const calculateAverageSuccessRate = () => {
    if (!weeklyStats?.stats.length) return 0
    const avg = weeklyStats.stats.reduce((sum, stat) => sum + stat.success_rate, 0) / weeklyStats.stats.length
    return Math.round(avg)
  }

  if (!user) {
    return (
      <div className="flex-1 space-y-6 p-8 md:p-10 pt-8 w-full max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">You need to be logged in to view trends.</p>
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
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Behavioral Trends</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Analyze your scrolling patterns and intervention history.</p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-lg text-red-700 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Avg Scroll Velocity
                </CardTitle>
                <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{calculateAverageScrolls()}</div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  Posts per session
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Success Rate
                </CardTitle>
                <div className="h-8 w-8 bg-cyan-50 dark:bg-cyan-500/10 rounded-full flex items-center justify-center">
                  <LineChart className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{calculateAverageSuccessRate()}%</div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  Intervention success rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Total Interventions
                </CardTitle>
                <div className="h-8 w-8 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {weeklyStats?.stats.reduce((sum, stat) => sum + stat.intervention_count, 0) || 0}
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  This week
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="px-6 pt-6 space-y-1">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">7-Day Scroll Velocity Trends</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">
                Your scrolling speed and engagement patterns over the past week.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-6">
              <MetricsChart data={weeklyStats?.stats || []} />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <Card className="bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-500/10 dark:to-cyan-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-md rounded-xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900 dark:text-white">Weekly Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>📊 Observation:</strong> Your average intervention success rate is {calculateAverageSuccessRate()}%.
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>⚡ Trend:</strong> You've triggered {weeklyStats?.stats.reduce((sum, stat) => sum + stat.intervention_count, 0) || 0} interventions this week.
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>✨ Win:</strong> You saved {weeklyStats?.stats.reduce((sum, stat) => sum + stat.time_reclaimed_minutes, 0) || 0} minutes from doomscrolling!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-200 dark:border-emerald-500/30 shadow-md rounded-xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900 dark:text-white">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-700 dark:text-slate-300">💡 Keep responding to interventions - your success rate shows great progress!</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">🎯 Continue building your daily habits and streaks.</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">🚀 Set a goal to reach 90% intervention success rate.</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
