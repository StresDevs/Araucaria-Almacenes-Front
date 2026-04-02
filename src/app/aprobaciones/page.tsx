'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { aprobacionesService, HttpError } from '@/services'
import {
  ShieldCheck, Trash2, Edit3, ArrowLeftRight, Clock, Check, XCircle,
  ChevronDown, AlertTriangle, Image as ImageIcon,
  User, Calendar, Filter, Loader2, FileEdit,
} from 'lucide-react'
import type {
  SolicitudAprobacion,
  TipoSolicitudAprobacion,
  EstadoAprobacion,
} from '@/types'

// ─── Constants ─────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<TipoSolicitudAprobacion, { label: string; icon: typeof Trash2; color: string; bgColor: string }> = {
  baja_producto: {
    label: 'Baja de Producto',
    icon: Trash2,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20 border-red-600/30',
  },
  edicion_stock: {
    label: 'Edición de Stock',
    icon: Edit3,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20 border-blue-600/30',
  },
  edicion_inventario: {
    label: 'Edición de Inventario',
    icon: FileEdit,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/20 border-cyan-600/30',
  },
  transferencia_atrasada: {
    label: 'Transferencia Atrasada',
    icon: ArrowLeftRight,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20 border-purple-600/30',
  },
}

const ESTADO_STYLES: Record<EstadoAprobacion, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  pendiente: { bg: 'bg-amber-900/20 border-amber-600/30', text: 'text-amber-400', icon: Clock, label: 'Pendiente' },
  aprobada: { bg: 'bg-green-900/20 border-green-600/30', text: 'text-green-400', icon: Check, label: 'Aprobada' },
  rechazada: { bg: 'bg-red-900/20 border-red-600/30', text: 'text-red-400', icon: XCircle, label: 'Rechazada' },
}

const MOTIVOS_LABELS: Record<string, string> = {
  'daño': 'Daño',
  'vencimiento': 'Vencimiento',
  'robo': 'Robo',
  'perdida': 'Pérdida',
  'obsoleto': 'Obsoleto',
  'defecto_fabrica': 'Defecto de Fábrica',
  'otro': 'Otro',
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AprobacionesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Redirect non-admin
  if (user && user.rol !== 'administrador') {
    router.push('/')
    return null
  }

  const [solicitudes, setSolicitudes] = useState<SolicitudAprobacion[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoFilter, setTipoFilter] = useState<'todos' | TipoSolicitudAprobacion>('todos')
  const [estadoFilter, setEstadoFilter] = useState<'todos' | EstadoAprobacion>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notasRechazo, setNotasRechazo] = useState<Record<string, string>>({})
  const [showRechazoInput, setShowRechazoInput] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Fetch solicitudes ──
  const fetchSolicitudes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await aprobacionesService.getAll(tipoFilter, estadoFilter)
      setSolicitudes(res.data)
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las aprobaciones', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [tipoFilter, estadoFilter, toast])

  useEffect(() => {
    fetchSolicitudes()
  }, [fetchSolicitudes])

  // Stats (from full data — refetch without filters)
  const [allSolicitudes, setAllSolicitudes] = useState<SolicitudAprobacion[]>([])
  useEffect(() => {
    aprobacionesService.getAll().then(res => setAllSolicitudes(res.data)).catch(() => {})
  }, [solicitudes]) // refresh stats when list changes

  const pendientesTotal = allSolicitudes.filter(s => s.estado === 'pendiente').length
  const bajasPendientes = allSolicitudes.filter(s => s.tipo === 'baja_producto' && s.estado === 'pendiente').length
  const stockPendientes = allSolicitudes.filter(s => s.tipo === 'edicion_stock' && s.estado === 'pendiente').length
  const edicionPendientes = allSolicitudes.filter(s => s.tipo === 'edicion_inventario' && s.estado === 'pendiente').length
  const transfPendientes = allSolicitudes.filter(s => s.tipo === 'transferencia_atrasada' && s.estado === 'pendiente').length

  // Handlers
  const handleAprobar = async (id: string) => {
    setActionLoading(id)
    try {
      await aprobacionesService.aprobar(id)
      toast({ title: 'Aprobada', description: 'La solicitud fue aprobada exitosamente' })
      setExpandedId(null)
      fetchSolicitudes()
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al aprobar'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRechazar = async (id: string) => {
    setActionLoading(id)
    try {
      const notas = notasRechazo[id] || undefined
      await aprobacionesService.rechazar(id, notas)
      toast({ title: 'Rechazada', description: 'La solicitud fue rechazada' })
      setShowRechazoInput(null)
      setExpandedId(null)
      setNotasRechazo(prev => { const copy = { ...prev }; delete copy[id]; return copy })
      fetchSolicitudes()
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al rechazar'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <AppShell>
      <div className="w-full max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Solicitud Aprobaciones</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Revisa y aprueba solicitudes de bajas, ediciones de stock y transferencias atrasadas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Pendientes</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400">{pendientesTotal}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Bajas</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-400">{bajasPendientes}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Stock</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-400">{stockPendientes}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <FileEdit className="w-3.5 h-3.5 text-cyan-400" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Ediciones</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-cyan-400">{edicionPendientes}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Transfer.</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-400">{transfPendientes}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Filter className="w-4 h-4 text-accent" />
            Filtros
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1.5">Tipo de solicitud</p>
              <div className="flex gap-1.5 flex-wrap">
                {(['todos', 'baja_producto', 'edicion_stock', 'edicion_inventario', 'transferencia_atrasada'] as const).map(t => {
                  const label = t === 'todos' ? 'Todos' : TIPO_CONFIG[t].label
                  return (
                    <button
                      key={t}
                      onClick={() => setTipoFilter(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        tipoFilter === t
                          ? 'bg-accent text-white border-accent'
                          : 'bg-border/30 text-foreground border-border hover:bg-border/60'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1.5">Estado</p>
              <div className="flex gap-1.5 flex-wrap">
                {(['todos', 'pendiente', 'aprobada', 'rechazada'] as const).map(e => {
                  const label = e === 'todos' ? 'Todos' : ESTADO_STYLES[e].label
                  return (
                    <button
                      key={e}
                      onClick={() => setEstadoFilter(e)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        estadoFilter === e
                          ? 'bg-accent text-white border-accent'
                          : 'bg-border/30 text-foreground border-border hover:bg-border/60'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Solicitudes List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando solicitudes…</span>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No hay solicitudes con los filtros seleccionados</p>
            </div>
          ) : (
            solicitudes.map(sol => {
              const tipo = TIPO_CONFIG[sol.tipo] ?? { label: sol.tipo, icon: Edit3, color: 'text-gray-400', bgColor: 'bg-gray-900/20 border-gray-600/30' }
              const est = ESTADO_STYLES[sol.estado] ?? { bg: 'bg-gray-900/20 border-gray-600/30', text: 'text-gray-400', icon: Clock, label: sol.estado }
              const TipoIcon = tipo.icon
              const EstIcon = est.icon
              const isExpanded = expandedId === sol.id
              const isPending = sol.estado === 'pendiente'

              return (
                <div key={sol.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sol.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-border/10 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${tipo.bgColor}`}>
                      <TipoIcon className={`w-5 h-5 ${tipo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground truncate">{sol.titulo}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${est.bg} ${est.text}`}>
                          <EstIcon className="w-3 h-3" />
                          {est.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className={`${tipo.color} font-medium`}>{tipo.label}</span>
                        <span className="mx-1.5">·</span>
                        {sol.solicitante}
                        <span className="mx-1.5">·</span>
                        {formatDate(sol.fecha_solicitud)}
                      </p>
                    </div>
                    {isPending && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                      {/* Description */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                        <p className="text-sm text-foreground">{sol.descripcion}</p>
                      </div>

                      {/* Type-specific details */}
                      {sol.tipo === 'baja_producto' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Producto</p>
                            <p className="text-sm text-foreground">
                              <span className="font-mono text-accent text-xs">{sol.item_codigo}</span>
                              <span className="mx-1.5">·</span>
                              {sol.item_descripcion}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Cantidad</p>
                            <p className="text-sm text-foreground font-bold">{sol.item_cantidad} unid.</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Motivo de baja</p>
                            <p className="text-sm text-foreground">{sol.motivo_baja ? MOTIVOS_LABELS[sol.motivo_baja] || sol.motivo_baja : '-'}</p>
                          </div>
                          {sol.evidencia_url && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Evidencia</p>
                              <a
                                href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${sol.evidencia_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-border/20 rounded-lg hover:bg-border/40 transition-colors"
                              >
                                <ImageIcon className="w-4 h-4 text-accent flex-shrink-0" />
                                <span className="text-xs text-foreground">Fotografía adjunta</span>
                                <span className="text-xs text-accent ml-auto">Ver imagen</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {sol.tipo === 'edicion_stock' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Producto</p>
                            <p className="text-sm text-foreground">
                              <span className="font-mono text-accent text-xs">{sol.item_codigo}</span>
                              <span className="mx-1.5">·</span>
                              {sol.item_descripcion}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Campo editado</p>
                            <p className="text-sm text-foreground capitalize">{sol.campo_editado}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Valor anterior</p>
                            <p className="text-sm text-red-400 font-mono font-bold">{sol.valor_anterior}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Valor nuevo</p>
                            <p className="text-sm text-green-400 font-mono font-bold">{sol.valor_nuevo}</p>
                          </div>
                        </div>
                      )}

                      {sol.tipo === 'edicion_inventario' && (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Producto</p>
                            <p className="text-sm text-foreground">
                              <span className="font-mono text-accent text-xs">{sol.item_codigo}</span>
                              <span className="mx-1.5">·</span>
                              {sol.item_descripcion}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Justificación</p>
                            <p className="text-sm text-foreground italic">{sol.justificacion}</p>
                          </div>
                          {sol.cambios_propuestos && sol.cambios_propuestos.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">Cambios propuestos</p>
                              <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-border/20">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Campo</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Valor Anterior</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Valor Nuevo</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {sol.cambios_propuestos.map((c, i) => (
                                      <tr key={i}>
                                        <td className="px-3 py-2 text-foreground font-medium text-xs">{c.campo}</td>
                                        <td className="px-3 py-2 text-red-400 font-mono text-xs">{c.anterior || '—'}</td>
                                        <td className="px-3 py-2 text-green-400 font-mono text-xs">{c.nuevo || '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {sol.tipo === 'transferencia_atrasada' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Almacén origen</p>
                              <p className="text-sm text-foreground">{sol.almacen_origen}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Almacén destino</p>
                              <p className="text-sm text-foreground">{sol.almacen_destino}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Fecha de transferencia</p>
                              <p className="text-sm text-foreground font-bold">{sol.fecha_transferencia ? formatDate(sol.fecha_transferencia) : '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Fecha de registro</p>
                              <p className="text-sm text-amber-400 font-bold">{sol.fecha_registro ? formatDate(sol.fecha_registro) : '-'}</p>
                            </div>
                          </div>
                          {sol.items_transferencia && sol.items_transferencia.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">Items transferidos</p>
                              <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-border/20">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Código</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Descripción</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">Cant.</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Unidad</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {sol.items_transferencia.map((it, i) => (
                                      <tr key={i}>
                                        <td className="px-3 py-2 font-mono text-xs text-accent">{it.codigo}</td>
                                        <td className="px-3 py-2 text-foreground">{it.descripcion}</td>
                                        <td className="px-3 py-2 text-right font-bold text-foreground">{it.cantidad}</td>
                                        <td className="px-3 py-2 text-muted-foreground">{it.unidad}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Audit info */}
                      <div className="pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Solicitante</p>
                            <p className="text-sm text-foreground">{sol.solicitante}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Fecha de solicitud</p>
                            <p className="text-sm text-foreground">{formatDateTime(sol.fecha_solicitud)}</p>
                          </div>
                        </div>
                        {sol.revisado_por && (
                          <>
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Revisado por</p>
                                <p className="text-sm text-foreground">{sol.revisado_por}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Fecha de revisión</p>
                                <p className="text-sm text-foreground">{sol.fecha_revision ? formatDateTime(sol.fecha_revision) : '-'}</p>
                              </div>
                            </div>
                            {sol.notas_revision && (
                              <div className="sm:col-span-2 flex items-start gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Notas de revisión</p>
                                  <p className="text-sm text-foreground">{sol.notas_revision}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions for pending */}
                      {isPending && (
                        <div className="pt-3 border-t border-border/50">
                          {showRechazoInput === sol.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Motivo del rechazo (opcional)</label>
                                <textarea
                                  value={notasRechazo[sol.id] || ''}
                                  onChange={(e) => setNotasRechazo(prev => ({ ...prev, [sol.id]: e.target.value }))}
                                  placeholder="Explica el motivo del rechazo…"
                                  rows={2}
                                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setShowRechazoInput(null)}
                                  disabled={actionLoading === sol.id}
                                  className="px-3 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-border/40 transition-colors disabled:opacity-40"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleRechazar(sol.id)}
                                  disabled={actionLoading === sol.id}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                                >
                                  {actionLoading === sol.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                  Confirmar Rechazo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setShowRechazoInput(sol.id)}
                                disabled={actionLoading === sol.id}
                                className="flex items-center gap-2 px-4 py-2.5 border border-red-600/40 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/20 transition-colors disabled:opacity-40"
                              >
                                <XCircle className="w-4 h-4" />
                                Rechazar
                              </button>
                              <button
                                onClick={() => handleAprobar(sol.id)}
                                disabled={actionLoading === sol.id}
                                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
                              >
                                {actionLoading === sol.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Aprobar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </AppShell>
  )
}
