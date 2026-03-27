'use client'

import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import type { ItemInventario, Almacen } from '@/types'

interface StockEntryModalProps {
  isOpen: boolean
  onClose: () => void
  item: ItemInventario | null
  almacenes: Almacen[]
  onSubmit: (itemId: string, almacenId: string, cantidad: number, descripcion?: string) => Promise<boolean>
}

export function StockEntryModal({ isOpen, onClose, item, almacenes, onSubmit }: StockEntryModalProps) {
  const [almacenId, setAlmacenId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    setAlmacenId('')
    setCantidad('')
    setDescripcion('')
    setSubmitting(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !almacenId || !cantidad) return
    setSubmitting(true)
    const ok = await onSubmit(item.id, almacenId, parseInt(cantidad, 10), descripcion || undefined)
    setSubmitting(false)
    if (ok) handleClose()
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Registrar Entrada de Stock</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">
              {item.nombre ?? item.descripcion ?? item.codigo}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-border transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Almacén *</label>
            <select
              value={almacenId}
              onChange={(e) => setAlmacenId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Seleccionar almacén</option>
              {almacenes.filter((a) => a.estado === 'activo').map((alm) => (
                <option key={alm.id} value={alm.id}>{alm.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cantidad *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej. 50"
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descripción (opcional)</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Ingreso por compra directa"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Current stock info */}
          {item.ubicaciones.length > 0 && (
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Stock actual: {item.stock_total}</p>
              <div className="space-y-1">
                {item.ubicaciones.map((ub) => (
                  <div key={ub.almacen_id} className="flex justify-between text-xs text-foreground">
                    <span>{ub.almacen_nombre}</span>
                    <span className="font-medium">{ub.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!almacenId || !cantidad || submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-background rounded-xl font-semibold text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
            ) : (
              <><Plus className="w-4 h-4" /> Registrar Entrada</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
