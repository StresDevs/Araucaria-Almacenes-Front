'use client'

import { ObraItem } from '@/lib/constants'
import { Calendar, MapPin, User, Package, ChevronRight } from 'lucide-react'

interface ObraCardProps {
  obra: ObraItem
  onClose?: () => void
}

export function ObraCard({ obra, onClose }: ObraCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-accent/50 transition-colors group">
      <div className="p-5">
        {/* Header with status badge */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-bold text-foreground text-lg pr-2">{obra.nombre}</h3>
          <span
            className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap flex-shrink-0 ${
              obra.estado === 'activa'
                ? 'bg-green-400/10 text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {obra.estado === 'activa' ? 'Activa' : 'Finalizada'}
          </span>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="truncate">{obra.ubicacion}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 text-accent" />
            <span>
              {new Date(obra.fecha_inicio).toLocaleDateString()}
              {obra.fecha_fin && ` - ${new Date(obra.fecha_fin).toLocaleDateString()}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4 text-accent" />
            <span>{obra.responsable}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="w-4 h-4 text-accent" />
            <span>{obra.items_total} ítems</span>
          </div>
        </div>

        {/* Action Button */}
        {obra.estado === 'activa' && onClose && (
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-background border border-border rounded-lg text-foreground hover:border-accent/50 hover:bg-border transition-colors flex items-center justify-center gap-2 text-sm font-medium group/btn"
          >
            Cerrar Obra
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  )
}
