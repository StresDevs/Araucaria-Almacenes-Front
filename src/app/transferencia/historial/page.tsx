'use client'

import { useState, useEffect, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { transferenciasService } from '@/services'
import type { TransferenciaResponse } from '@/services'
import { Search, Loader2, ChevronDown, FileText } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? ''

export default function HistorialTransferenciasPage() {
  const [transferencias, setTransferencias] = useState<TransferenciaResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    transferenciasService.getAll({ page, pageSize: 20 }).then((res: any) => {
      if (cancelled) return
      // apiClient returns raw JSON: { success, data: [...], meta: { page, pageSize, total } }
      const items = Array.isArray(res.data) ? res.data : []
      const meta = res.meta
      setTransferencias(items)
      if (meta?.total) {
        setTotalPages(Math.ceil(meta.total / (meta.pageSize ?? 20)))
      }
      setIsLoading(false)
    }).catch((err) => {
      if (cancelled) return
      setError(err instanceof Error ? err.message : 'Error al cargar transferencias')
      setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [page])

  const filtered = useMemo(() => {
    if (!searchTerm) return transferencias
    const term = searchTerm.toLowerCase()
    return transferencias.filter((t) =>
      (t.almacen_origen_nombre ?? '').toLowerCase().includes(term) ||
      (t.observaciones ?? '').toLowerCase().includes(term) ||
      t.items.some((i) =>
        (i.item_codigo ?? '').toLowerCase().includes(term) ||
        (i.item_descripcion ?? '').toLowerCase().includes(term) ||
        (i.almacen_destino_nombre ?? '').toLowerCase().includes(term),
      ),
    )
  }, [transferencias, searchTerm])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Historial de Transferencias</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Registro de todas las transferencias realizadas</p>
        </div>

        {/* Search */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por almacén, código, descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando transferencias...
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{error}</div>
        )}

        {/* List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No se encontraron transferencias</p>
              </div>
            ) : (
              filtered.map((t) => {
                const isExpanded = expandedIds.has(t.id)
                const fecha = new Date(t.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })
                const destinos = [...new Set(t.items.map((i) => i.almacen_destino_nombre).filter(Boolean))]
                return (
                  <div key={t.id} className="bg-card border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleExpand(t.id)}
                      className="w-full p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-foreground">{fecha}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            t.estado === 'completada' ? 'bg-green-500/20 text-green-400' :
                            t.estado === 'pendiente' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {t.estado}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          <span className="text-muted-foreground">De:</span> {t.almacen_origen_nombre ?? '—'}
                          <span className="mx-2 text-muted-foreground">→</span>
                          <span className="text-accent font-medium">{destinos.join(', ') || '—'}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{t.items.length} ítem(s) transferido(s)</p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border p-4 sm:p-5 space-y-4">
                        {t.observaciones && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
                            <p className="text-sm text-foreground">{t.observaciones}</p>
                          </div>
                        )}

                        {t.evidencia_url && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Evidencia</p>
                            <a
                              href={`${API_BASE}${t.evidencia_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                            >
                              <FileText className="w-4 h-4" /> Ver archivo
                            </a>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Ítems transferidos</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {t.items.map((item) => (
                              <div key={item.id} className="bg-background border border-border rounded-lg p-3">
                                <p className="font-mono text-xs text-muted-foreground">{item.item_codigo ?? '—'}</p>
                                <p className="text-sm font-medium text-foreground">{item.item_descripcion ?? item.item_nombre ?? '—'}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">→ {item.almacen_destino_nombre ?? '—'}</span>
                                  <span className="text-xs font-bold text-accent">{item.cantidad}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 bg-border text-foreground rounded-lg hover:bg-border/80 transition-colors text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 bg-border text-foreground rounded-lg hover:bg-border/80 transition-colors text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
