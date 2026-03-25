'use client'

import { MOCK_ACTIVITY } from '@/lib/constants'
import { Activity, LogOut, RotateCcw } from 'lucide-react'

const typeIcons: Record<string, typeof Activity> = {
  entrada: Activity,
  salida: LogOut,
  devolucion: RotateCcw,
}

export function ActivityTable() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Actividad Reciente</h3>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Obra</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Hora</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ACTIVITY.map((activity, idx) => {
              const Icon = typeIcons[activity.tipo] || Activity
              return (
                <tr key={activity.id} className={idx !== MOCK_ACTIVITY.length - 1 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-3">
                    <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-accent" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground text-sm">{activity.descripcion}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm hidden md:table-cell">{activity.obra || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm hidden lg:table-cell">{activity.usuario}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{activity.fecha}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-border">
        {MOCK_ACTIVITY.map((activity) => {
          const Icon = typeIcons[activity.tipo] || Activity
          return (
            <div key={activity.id} className="px-4 py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{activity.descripcion}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.obra || '-'} · {activity.fecha}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
