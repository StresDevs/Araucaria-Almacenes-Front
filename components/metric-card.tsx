'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import * as Icons from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: string
  trend?: number
}

const iconMap: Record<string, typeof Icons.Box> = {
  box: Icons.Box,
  warehouse: Icons.Warehouse,
  'hard-hat': Icons.HardHat,
  'link-2': Icons.Link2,
  'arrow-right': Icons.ArrowRight,
  'alert-circle': Icons.AlertCircle,
}

export function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  const Icon = iconMap[icon] || Icons.Box
  const trendColor = trend && trend > 0 ? 'text-green-400' : trend && trend < 0 ? 'text-orange-400' : ''
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : null

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend !== undefined && (
            <div className={`text-xs mt-2 flex items-center gap-1 ${trendColor}`}>
              {TrendIcon && <TrendIcon className="w-3 h-3" />}
              <span>{Math.abs(trend)}% desde el mes pasado</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-accent" />
        </div>
      </div>
    </div>
  )
}
