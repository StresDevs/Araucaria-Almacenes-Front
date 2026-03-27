'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/app-shell'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { almacenesService } from '@/services'
import type { Almacen } from '@/types'
import { use } from 'react'

export default function AlmacenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [almacen, setAlmacen] = useState<Almacen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlmacen = useCallback(async () => {
    setLoading(true)
    try {
      const res = await almacenesService.getById(id)
      setAlmacen(res.data)
      setError(null)
    } catch {
      setError('No se pudo cargar el almacén')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAlmacen()
  }, [fetchAlmacen])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    )
  }

  if (error || !almacen) {
    return (
      <AppShell>
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <Link
            href="/almacenes"
            className="flex items-center gap-2 text-accent hover:underline font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a Almacenes
          </Link>
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-red-400">{error || 'Almacén no encontrado'}</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Link
          href="/almacenes"
          className="flex items-center gap-2 text-accent hover:underline font-medium text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Almacenes
        </Link>

        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-foreground text-balance">
                {almacen.nombre}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {almacen.tipo_almacen === 'fijo' ? 'Almacén externo (fijo)' : 'Almacén dentro de obra'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded text-sm font-medium shrink-0 ${
                almacen.estado === 'activo'
                  ? 'bg-green-900 text-green-200'
                  : 'bg-red-900 text-red-200'
              }`}
            >
              {almacen.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {almacen.direccion && (
              <div>
                <p className="text-muted-foreground mb-1">Dirección</p>
                <p className="font-medium text-foreground">{almacen.direccion}</p>
              </div>
            )}
            {almacen.obra_nombre && (
              <div>
                <p className="text-muted-foreground mb-1">Obra</p>
                <p className="font-medium text-foreground">{almacen.obra_nombre}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1">Total Ítems</p>
              <p className="font-bold text-accent text-lg">{almacen.items_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Tipo</p>
              <p className="text-foreground">
                {almacen.tipo_almacen === 'fijo' ? 'Externo' : 'Obra'}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder for future inventory table */}
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            El inventario de este almacén se mostrará aquí.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
