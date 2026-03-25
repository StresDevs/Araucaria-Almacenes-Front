'use client'

import { MOCK_METRICS } from '@/lib/constants'
import { MetricCard } from './metric-card'
import { ActivityTable } from './activity-table'
import { PendingLoans } from './pending-loans'

export default function Dashboard() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground mt-2 text-base">Resumen del inventario de almacenes y estado</p>
      </div>

      {/* Metrics Grid - 2x3 layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_METRICS.map((metric) => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity - takes 2 columns */}
        <div className="lg:col-span-2">
          <ActivityTable />
        </div>

        {/* Pending Loans - takes 1 column */}
        <div className="lg:col-span-1">
          <PendingLoans />
        </div>
      </div>
    </div>
  )
}
