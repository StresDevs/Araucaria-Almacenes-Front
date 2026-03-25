'use client'

import { MOCK_PRESTAMOS } from '@/lib/constants'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'

export function PendingLoans() {
  const pendingOrDelayed = MOCK_PRESTAMOS.filter(p => p.estado === 'pendiente' || p.estado === 'retrasado')

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Préstamos Pendientes y Retrasados</h3>
      </div>
      <div className="space-y-1 divide-y divide-border">
        {pendingOrDelayed.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Todos los préstamos están en orden</p>
          </div>
        ) : (
          pendingOrDelayed.map((loan) => (
            <div key={loan.id} className="px-6 py-4 hover:bg-border/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{loan.item}</p>
                  <p className="text-xs text-muted-foreground mt-1">{loan.obra}</p>
                  <p className="text-xs text-muted-foreground">por {loan.responsable}</p>
                </div>
                <div className="flex items-center gap-2">
                  {loan.estado === 'retrasado' ? (
                    <div className="flex items-center gap-1 bg-orange-400/10 px-2 py-1 rounded text-xs text-orange-400">
                      <AlertCircle className="w-3 h-3" />
                      Retrasado
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded text-xs text-amber-400">
                      <Clock className="w-3 h-3" />
                      Pendiente
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
