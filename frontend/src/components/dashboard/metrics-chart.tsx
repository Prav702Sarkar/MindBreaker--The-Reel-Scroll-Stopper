"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "next-themes"
import { useMemo } from "react"

interface ChartDataPoint {
  date: string
  avg_velocity: number
  intervention_count: number
  success_rate: number
  time_reclaimed_minutes: number
  avg_mindless_score: number
}

interface MetricsChartProps {
  data?: ChartDataPoint[]
}

export function MetricsChart({ data: externalData }: MetricsChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Transform backend data to chart format with real-time support
  const chartData = useMemo(() => {
    if (externalData && externalData.length > 0) {
      const today = new Date()
      const transformed = externalData.map((item) => {
        const itemDate = new Date(item.date)
        const isToday = itemDate.toDateString() === today.toDateString()
        
        return {
          name: itemDate.toLocaleDateString('en-US', { weekday: 'short' }),
          velocity: Math.round(item.avg_velocity * 100) / 100,
          interventions: item.intervention_count,
          success_rate: Math.round(item.success_rate),
          isToday,
          rawDate: item.date,
        }
      })
      
      // If today's data is missing, add placeholder
      const hasToday = transformed.some(d => d.isToday)
      if (!hasToday) {
        const todayItem = {
          name: today.toLocaleDateString('en-US', { weekday: 'short' }),
          velocity: 0,
          interventions: 0,
          success_rate: 0,
          isToday: true,
          rawDate: today.toISOString(),
        }
        transformed.push(todayItem)
      }
      
      return transformed
    }
    
    // Generate empty/zero data for current week (no preset uptrend data)
    const today = new Date()
    const weekDays = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      const isToday = date.toDateString() === today.toDateString()
      weekDays.push({
        name: dayName,
        velocity: 0,
        interventions: 0,
        success_rate: 0,
        isToday,
        rawDate: date.toISOString(),
      })
    }
    return weekDays
  }, [externalData])

  const axisColor = isDark ? "#64748b" : "#475569"
  const tooltipBg = isDark ? "#0f172a" : "#ffffff"
  const tooltipBorder = isDark ? "#1e293b" : "#e2e8f0"
  const tooltipShadow = isDark ? "0 4px 6px -1px rgb(0 0 0 / 0.3)" : "0 4px 6px -1px rgb(0 0 0 / 0.1)"
  const itemColor = isDark ? "#818cf8" : "#3b82f6"
  const labelColor = isDark ? "#94a3b8" : "#64748b"
  const lineStroke = isDark ? "#818cf8" : "#3b82f6"
  const dotFill = isDark ? "#0f172a" : "#ffffff"

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <defs>
          <style>{`
            @keyframes dashPulse {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: 0; }
            }
            .chart-line {
              animation: dashPulse 0.6s ease-in-out;
            }
          `}</style>
        </defs>
        <XAxis
          dataKey="name"
          stroke={axisColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={axisColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            borderRadius: '12px',
            border: `1px solid ${tooltipBorder}`,
            boxShadow: tooltipShadow
          }}
          itemStyle={{ color: itemColor, fontWeight: 600 }}
          labelStyle={{ color: labelColor, marginBottom: '4px' }}
          formatter={(value: any) => [
            value.toFixed(2),
            typeof value === 'number' ? 'Velocity' : 'Value'
          ]}
        />
        <Line
          type="monotone"
          dataKey="velocity"
          stroke={lineStroke}
          strokeWidth={3}
          activeDot={{
            r: 8,
            fill: lineStroke,
            strokeWidth: 2,
            stroke: isDark ? "#1e293b" : "#f1f5f9",
          }}
          dot={(props: any) => {
            const { cx, cy, payload } = props
            const isToday = payload?.isToday
            const radius = isToday ? 6 : 4
            const strokeWidth = isToday ? 3 : 2
            
            return (
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={dotFill}
                stroke={lineStroke}
                strokeWidth={strokeWidth}
                style={{
                  transition: 'all 0.3s ease-in-out',
                  filter: isToday ? `drop-shadow(0 0 6px ${lineStroke})` : 'none',
                }}
              />
            )
          }}
          isAnimationActive={true}
          animationDuration={600}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
