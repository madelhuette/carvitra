'use client'

import { Eye, Users01, TrendUp01, File02 } from '@untitledui/icons'
import { Badge } from '@/components/base/badges/badges'

interface StatsData {
  totalViews: number
  totalLeads: number
  avgConversion: number
  activePages: number
}

interface LandingPageStatsProps {
  stats: StatsData
}

export function LandingPageStats({ stats }: LandingPageStatsProps) {
  const statCards = [
    {
      label: 'Gesamt-Views',
      value: stats.totalViews.toLocaleString('de-DE'),
      icon: Eye,
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      label: 'Gesamt-Leads',
      value: stats.totalLeads.toLocaleString('de-DE'),
      icon: Users01,
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      label: 'Ø Conversion',
      value: `${stats.avgConversion.toFixed(1)}%`,
      icon: TrendUp01,
      change: '+0.5%',
      changeType: 'positive' as const
    },
    {
      label: 'Aktive Pages',
      value: stats.activePages.toString(),
      icon: File02,
      change: null,
      changeType: null
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <div 
          key={index}
          className="bg-primary border border-secondary rounded-xl p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-brand-primary_alt/10 flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-brand-600" />
            </div>
            {stat.change && (
              <Badge 
                color={stat.changeType === 'positive' ? 'success' : 'error'}
                type="pill"
                size="sm"
              >
                {stat.change}
              </Badge>
            )}
          </div>
          
          <div>
            <p className="text-sm text-secondary mb-1">{stat.label}</p>
            <p className="text-display-xs font-semibold text-primary">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}