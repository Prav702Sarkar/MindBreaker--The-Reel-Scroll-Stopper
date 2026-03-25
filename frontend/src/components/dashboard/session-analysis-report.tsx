'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, CheckCircle, TrendingUp, Clock, Zap } from "lucide-react"

interface Insight {
  category: string
  message: string
  icon: string
}

interface Recommendation {
  priority: string
  tip: string
  benefit: string
}

interface SessionAnalysis {
  overall_score: number
  rating: string
  insights: Insight[]
  recommendations: Recommendation[]
  action_items: string[]
}

interface SessionAnalysisReportProps {
  analysis: SessionAnalysis
  duration_minutes: number
  platform: string
}

export function SessionAnalysisReport({ analysis, duration_minutes, platform }: SessionAnalysisReportProps) {
  const scoreColor = analysis.overall_score >= 80 
    ? 'text-emerald-600 dark:text-emerald-400'
    : analysis.overall_score >= 60
    ? 'text-blue-600 dark:text-blue-400'
    : analysis.overall_score >= 40
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'

  const scoreBg = analysis.overall_score >= 80 
    ? 'bg-emerald-50 dark:bg-emerald-500/10'
    : analysis.overall_score >= 60
    ? 'bg-blue-50 dark:bg-blue-500/10'
    : analysis.overall_score >= 40
    ? 'bg-amber-50 dark:bg-amber-500/10'
    : 'bg-red-50 dark:bg-red-500/10'

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-500/10'
      case 'high':
        return 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-500/10'
      case 'medium':
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-500/10'
      default:
        return 'border-l-4 border-slate-300 bg-slate-50 dark:bg-slate-500/10'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'medium':
        return 'ℹ️'
      default:
        return '✓'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-slate-900 dark:text-white">Session Analysis</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
                {platform} • {duration_minutes.toFixed(1)} minutes
              </CardDescription>
            </div>
            <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`${scoreBg} rounded-lg p-6 text-center`}>
            <div className={`text-5xl font-bold ${scoreColor} mb-2`}>
              {analysis.overall_score}
            </div>
            <div className="text-xl font-semibold text-slate-900 dark:text-white">
              {analysis.rating}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Mindfulness & behavioral score (0-100)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <CardTitle className="text-lg text-slate-900 dark:text-white">Key Insights</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
                Analysis of your scrolling behavior
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.insights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 pb-3 border-b border-slate-200 dark:border-slate-700 last:pb-0 last:border-b-0">
              <div className="text-2xl flex-shrink-0">{insight.icon}</div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  {insight.category}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actionable Recommendations */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <CardTitle className="text-lg text-slate-900 dark:text-white">Recommendations</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
                Steps to improve your browsing habits
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.recommendations.map((rec, idx) => (
            <div key={idx} className={`${getPriorityColor(rec.priority)} rounded-lg p-4`}>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-1">{getPriorityIcon(rec.priority)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    {rec.tip}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    ✓ {rec.benefit}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-500 mt-2 uppercase tracking-wide">
                    {rec.priority} priority
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Action Items */}
      {analysis.action_items.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border-indigo-200 dark:border-indigo-700 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-sm text-indigo-900 dark:text-indigo-100">
                Action Items for Next Time
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.action_items.map((item, idx) => (
                <li key={idx} className="text-sm text-indigo-800 dark:text-indigo-200 flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
