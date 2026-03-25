interface ChartDataPoint {
  date: string
  avg_velocity: number
  intervention_count: number
  success_rate: number
  time_reclaimed_minutes: number
  avg_mindless_score: number
}

interface RecentActivityProps {
  weeklyStats?: ChartDataPoint[]
}

export function RecentActivity({ weeklyStats = [] }: RecentActivityProps) {
  // Default activities shown when no real data
  const defaultActivities = [
    {
      id: 1,
      site: "reddit.com",
      time: "20 minutes ago",
      prompt: "Endless scrolling detected. Is this intentional?",
      result: "Tab Closed",
      resultColor: "text-emerald-500"
    },
    {
      id: 2,
      site: "twitter.com",
      time: "2 hours ago",
      prompt: "You've scrolled the height of the Eiffel Tower.",
      result: "Continued",
      resultColor: "text-amber-500"
    },
    {
      id: 3,
      site: "instagram.com",
      time: "Yesterday",
      prompt: "Take a deep breath. Are you still watching or just scrolling?",
      result: "Tab Closed",
      resultColor: "text-emerald-500"
    }
  ]

  // If no real data, show default activities
  if (!weeklyStats || weeklyStats.length === 0) {
    return (
      <div className="space-y-6">
        {defaultActivities.map((activity) => (
          <div key={activity.id} className="flex items-center">
            <div className="ml-2 space-y-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{activity.site}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 border-l-2 border-indigo-500/30 pl-3 mt-1 italic">
                &quot;{activity.prompt}&quot;
              </p>
            </div>
            <div className="ml-auto flex flex-col items-end text-sm gap-1">
              <div className={`font-semibold ${activity.resultColor}`}>
                {activity.result}
              </div>
              <div className="text-slate-500 text-xs font-medium">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Show aggregate intervention data from weekly stats
  const totalInterventions = weeklyStats.reduce((sum, stat) => sum + stat.intervention_count, 0)
  const avgSuccessRate = Math.round(weeklyStats.reduce((sum, stat) => sum + stat.success_rate, 0) / weeklyStats.length)
  
  const activities = [
    {
      id: 1,
      site: "This Week",
      time: `${totalInterventions} interventions`,
      prompt: `Overall intervention success rate: ${avgSuccessRate}%`,
      result: "Active",
      resultColor: "text-emerald-500"
    },
    ...defaultActivities.slice(0, 2)
  ]

  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <div className="ml-2 space-y-1.5">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{activity.site}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 border-l-2 border-indigo-500/30 pl-3 mt-1 italic">
              &quot;{activity.prompt}&quot;
            </p>
          </div>
          <div className="ml-auto flex flex-col items-end text-sm gap-1">
            <div className={`font-semibold ${activity.resultColor}`}>
              {activity.result}
            </div>
            <div className="text-slate-500 text-xs font-medium">{activity.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
