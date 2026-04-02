'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'
import {
  prestamosService,
  inventarioService,
  obrasService,
  solicitudesService,
  HttpError,
} from '@/services'
import type {
  PrestamoRegistro,
  EstadoPrestamo,
  ItemInventario,
  ObraItem,
  Contratista,
} from '@/types'
import {
  Package, Search, Plus, Check, Clock, Loader2, ChevronDown,
  X, ArrowDownLeft, ArrowUpRight, ClipboardList, RotateCcw,
  Trash2, AlertCircle, User, Building2,
} from 'lucide-react'

// ─── Constants ─────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoPrestamo, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  prestado: { bg: 'bg-amber-900/20 border-amber-600/30', text: 'text-amber-400', icon: Clock, label: 'Prestado' },
  devuelto: { bg: 'bg-green-900/20 border-green-600/30', text: 'text-green-400', icon: Check, label: 'Devuelto' },
  consumido: { bg: 'bg-zinc-900/20 border-zinc-600/30', text: 'text-zinc-400', icon: Trash2, label: 'Consumido' },
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PrestamosPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // View tabs
  const [mainView, setMainView] = useState<'registro' | 'activos' | 'historial'>('activos')

  // ── API data ──
  const [prestamos, setPrestamos] = useState<PrestamoRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ItemInventario[]>([])
  const [obras, setObras] = useState<ObraItem[]>([])
  const [contratistas, setContratistas] = useState<Contratista[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [stats, setStats] = useState({ prestados: 0, devueltos: 0, consumidos: 0 })

  // ── Registro form ──
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemInventario | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [personaPrestamo, setPersonaPrestamo] = useState('')
  const [selectedObra, setSelectedObra] = useState('')
  const [seccion, setSeccion] = useState('')
  const [selectedContratista, setSelectedContratista] = useState('')
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // ── Historial filters ──
  const [filterEstado, setFilterEstado] = useState<'todos' | EstadoPrestamo>('todos')
  const [filterSearch, setFilterSearch] = useState('')

  // ── Devolver modal ──
  const [devolverModal, setDevolverModal] = useState<PrestamoRegistro | null>(null)
  const [devolverTipo, setDevolverTipo] = useState<'devuelto' | 'consumido'>('devuelto')
  const [devolverNotas, setDevolverNotas] = useState('')
  const [devolverLoading, setDevolverLoading] = useState(false)

  // ── Load catalog (items, obras, contratistas) ──
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setCatalogLoading(true)
      try {
        const [itemsRes, obrasRes, contratistasRes] = await Promise.all([
          inventarioService.getAll(),
          obrasService.getAll(),
          solicitudesService.getContratistas(),
        ])
        if (!cancelled) {
          setItems(itemsRes.data.filter((i) => i.activo && i.stock_total > 0))
          setObras(obrasRes.data.filter((o) => o.estado === 'activa'))
          setContratistas(contratistasRes.data)
        }
      } catch {
        if (!cancelled) toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [toast])

  // ── Fetch prestamos ──
  const fetchPrestamos = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        prestamosService.getAll(),
        prestamosService.getStats(),
      ])
      setPrestamos(listRes.data)
      setStats(statsRes.data)
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la lista', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPrestamos()
  }, [fetchPrestamos])

  // ── Derived data ──
  const activos = useMemo(() => prestamos.filter((p) => p.estado === 'prestado'), [prestamos])

  const filteredHistorial = useMemo(() => {
    return prestamos.filter((p) => {
      const matchEstado = filterEstado === 'todos' || p.estado === filterEstado
      const term = filterSearch.toLowerCase()
      const matchSearch =
        term.length === 0 ||
        p.item_codigo.toLowerCase().includes(term) ||
        (p.item_descripcion ?? '').toLowerCase().includes(term) ||
        (p.item_nombre ?? '').toLowerCase().includes(term) ||
        p.persona_prestamo.toLowerCase().includes(term)
      return matchEstado && matchSearch
    })
  }, [prestamos, filterEstado, filterSearch])

  const filteredItems = useMemo(() => {
    const term = searchQuery.toLowerCase()
    if (!term) return items.slice(0, 30)
    return items.filter(
      (i) =>
        i.codigo.toLowerCase().includes(term) ||
        (i.descripcion ?? '').toLowerCase().includes(term) ||
        (i.nombre ?? '').toLowerCase().includes(term),
    )
  }, [items, searchQuery])

  // ── Handlers ──
  const handleSelectItem = (item: ItemInventario) => {
    setSelectedItem(item)
    setSearchQuery('')
    setShowResults(false)
  }

  const canSubmit =
    selectedItem &&
    cantidad &&
    parseInt(cantidad, 10) > 0 &&
    parseInt(cantidad, 10) <= (selectedItem?.stock_total ?? 0) &&
    personaPrestamo.trim().length > 0 &&
    !isSubmitting

  const handleSubmit = async () => {
    if (!canSubmit || !selectedItem) return
    setIsSubmitting(true)
    try {
      await prestamosService.create({
        itemId: selectedItem.id,
        cantidad: parseInt(cantidad, 10),
        personaPrestamo: personaPrestamo.trim(),
        obraId: selectedObra || undefined,
        seccion: seccion.trim() || undefined,
        contratistaId: selectedContratista || undefined,
        notas: notas.trim() || undefined,
      })
      toast({ title: 'Préstamo registrado', description: `${selectedItem.descripcion || selectedItem.nombre || selectedItem.codigo} — ${cantidad} ${selectedItem.unidad}` })
      setSubmitted(true)
      fetchPrestamos()
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al registrar el préstamo'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setSelectedItem(null)
    setCantidad('')
    setPersonaPrestamo('')
    setSelectedObra('')
    setSeccion('')
    setSelectedContratista('')
    setNotas('')
    setSubmitted(false)
  }

  const handleDevolver = async () => {
    if (!devolverModal) return
    setDevolverLoading(true)
    try {
      await prestamosService.devolver(devolverModal.id, {
        estado: devolverTipo,
        notas: devolverNotas.trim() || undefined,
      })
      toast({
        title: devolverTipo === 'devuelto' ? 'Devolución registrada' : 'Consumo registrado',
        description: `${devolverModal.item_descripcion || devolverModal.item_codigo}`,
      })
      setDevolverModal(null)
      setDevolverNotas('')
      setDevolverTipo('devuelto')
      fetchPrestamos()
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al procesar'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setDevolverLoading(false)
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

  const getDaysActive = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <AppShell>
      <div className="w-full max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Control de Almacén</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de préstamos, devoluciones y consumo de materiales
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-card border border-border rounded-xl p-1 gap-1">
          {([
            { id: 'activos', label: 'Préstamos Activos', labelShort: 'Activos', icon: Clock, count: stats.prestados },
            { id: 'registro', label: 'Nuevo Préstamo', labelShort: 'Nuevo', icon: Plus, count: null },
            { id: 'historial', label: 'Historial', labelShort: 'Historial', icon: ClipboardList, count: null },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setMainView(tab.id); if (tab.id === 'registro') setSubmitted(false) }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mainView === tab.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-border/40'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.labelShort}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  mainView === tab.id ? 'bg-white/20' : 'bg-amber-900/30 text-amber-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-amber-600/20 rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Prestados</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400">{stats.prestados}</p>
          </div>
          <div className="bg-card border border-green-600/20 rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-green-400" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Devueltos</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-400">{stats.devueltos}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Consumidos</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-zinc-400">{stats.consumidos}</p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ACTIVOS VIEW                                                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mainView === 'activos' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando préstamos…</span>
              </div>
            ) : activos.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-10 text-center">
                <Check className="w-12 h-12 text-green-400/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No hay préstamos activos — todo el material está en almacén</p>
              </div>
            ) : (
              activos.map((p) => {
                const days = getDaysActive(p.created_at)
                const dayColor = days > 30 ? 'text-red-400' : days > 14 ? 'text-amber-400' : 'text-green-400'

                return (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-amber-900/20 border border-amber-600/20 flex items-center justify-center flex-shrink-0">
                        <ArrowUpRight className="w-5 h-5 text-amber-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground truncate">
                            {p.item_descripcion || p.item_nombre || p.item_codigo}
                          </span>
                          <span className={`text-xs font-bold ${dayColor}`}>
                            {days}d
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="font-mono text-accent">{p.item_codigo}</span>
                          <span>·</span>
                          <span className="font-bold text-foreground">{p.cantidad} {p.unidad}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {p.persona_prestamo}
                          </span>
                          {p.contratista_nombre && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {p.contratista_nombre}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {p.obra_nombre && <span>{p.obra_nombre}</span>}
                          {p.seccion && <><span>·</span><span>{p.seccion}</span></>}
                          <span>·</span>
                          <span>{formatDate(p.created_at)}</span>
                          <span>·</span>
                          <span>Salida: {p.hora_prestamo}</span>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => setDevolverModal(p)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex-shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Finalizar</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* REGISTRO VIEW                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mainView === 'registro' && !submitted && (
          <div className="space-y-4">
            {/* Step 1: Select Item */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">1</span>
                </div>
                <h2 className="text-base font-bold text-foreground">Material a prestar</h2>
              </div>

              {catalogLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Cargando productos…</span>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por código, nombre o descripción…"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }}
                      onFocus={() => setShowResults(true)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    {searchQuery && (
                      <button onClick={() => { setSearchQuery(''); setShowResults(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showResults && !selectedItem && (
                    <div className="border border-border rounded-lg bg-card max-h-64 overflow-y-auto divide-y divide-border">
                      {filteredItems.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">No se encontraron productos</div>
                      ) : (
                        filteredItems.slice(0, 50).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-border/30 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.descripcion || item.nombre || item.codigo}</p>
                              <p className="text-xs text-muted-foreground">
                                <span className="font-mono text-accent">{item.codigo}</span>
                                {item.categoria_nombre && <><span className="mx-1.5">·</span>{item.categoria_nombre}</>}
                                <span className="mx-1.5">·</span>Stock: {item.stock_total} {item.unidad}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {selectedItem && (
                    <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{selectedItem.descripcion || selectedItem.nombre || selectedItem.codigo}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono text-accent">{selectedItem.codigo}</span>
                          <span className="mx-1.5">·</span>Stock: {selectedItem.stock_total} {selectedItem.unidad}
                        </p>
                      </div>
                      <button onClick={() => setSelectedItem(null)} className="p-1.5 rounded-lg hover:bg-border transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Step 2: Details */}
            <div className={`bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4 transition-opacity ${selectedItem ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">2</span>
                </div>
                <h2 className="text-base font-bold text-foreground">Detalles del préstamo</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem?.stock_total || 999}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  {selectedItem && (
                    <p className="text-xs text-muted-foreground mt-1">Disponible: {selectedItem.stock_total} {selectedItem.unidad}</p>
                  )}
                  {cantidad && selectedItem && parseInt(cantidad, 10) > selectedItem.stock_total && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      La cantidad excede el stock disponible
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Persona que recibe <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={personaPrestamo}
                    onChange={(e) => setPersonaPrestamo(e.target.value)}
                    placeholder="Nombre de la persona…"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Obra</label>
                  <div className="relative">
                    <select
                      value={selectedObra}
                      onChange={(e) => setSelectedObra(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none pr-8"
                    >
                      <option value="">Sin obra</option>
                      {obras.map((o) => (
                        <option key={o.id} value={o.id}>{o.nombre}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Sección</label>
                  <input
                    type="text"
                    value={seccion}
                    onChange={(e) => setSeccion(e.target.value)}
                    placeholder="Ej: Post U, P7, etc."
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Contratista (opcional)</label>
                  <div className="relative">
                    <select
                      value={selectedContratista}
                      onChange={(e) => setSelectedContratista(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none pr-8"
                    >
                      <option value="">Sin contratista</option>
                      {contratistas.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} — {c.empresa}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Notas (opcional)</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Observaciones adicionales…"
                    rows={2}
                    maxLength={1000}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-border/40 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                Registrar Salida
              </button>
            </div>
          </div>
        )}

        {/* Submitted confirmation */}
        {mainView === 'registro' && submitted && (
          <div className="bg-card border border-border rounded-xl p-6 sm:p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Préstamo Registrado</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Se registró la salida de <span className="font-semibold text-foreground">{selectedItem?.descripcion || selectedItem?.nombre}</span> a nombre de <span className="font-semibold text-foreground">{personaPrestamo}</span>.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Préstamo
              </button>
              <button
                onClick={() => { handleReset(); setMainView('activos') }}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-border/40 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Ver Activos
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HISTORIAL VIEW                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mainView === 'historial' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por código, ítem o persona…"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['todos', 'prestado', 'devuelto', 'consumido'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterEstado(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      filterEstado === f
                        ? 'bg-accent text-white border-accent'
                        : 'bg-border/30 text-foreground border-border hover:bg-border/60'
                    }`}
                  >
                    {f === 'todos' ? 'Todos' : ESTADO_CONFIG[f].label + 's'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando…</span>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-border/30">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Fecha</th>
                        <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Ítem</th>
                        <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Cant.</th>
                        <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Persona</th>
                        <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Obra / Sección</th>
                        <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Salida</th>
                        <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Devolución</th>
                        <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredHistorial.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                            No hay registros con los filtros seleccionados
                          </td>
                        </tr>
                      ) : (
                        filteredHistorial.map((p) => {
                          const est = ESTADO_CONFIG[p.estado]
                          const EstIcon = est.icon
                          return (
                            <tr key={p.id} className="hover:bg-border/10 transition-colors">
                              <td className="px-3 py-3 text-foreground font-mono text-xs whitespace-nowrap">{formatDate(p.created_at)}</td>
                              <td className="px-3 py-3">
                                <p className="text-foreground font-medium text-sm truncate max-w-[200px]">{p.item_descripcion || p.item_nombre || p.item_codigo}</p>
                                <p className="text-xs font-mono text-accent">{p.item_codigo}</p>
                              </td>
                              <td className="px-3 py-3 text-center text-foreground font-bold">{p.cantidad} <span className="text-xs font-normal text-muted-foreground">{p.unidad}</span></td>
                              <td className="px-3 py-3">
                                <p className="text-foreground text-sm">{p.persona_prestamo}</p>
                                {p.contratista_nombre && (
                                  <p className="text-xs text-muted-foreground">{p.contratista_nombre}</p>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-foreground text-sm">{p.obra_nombre || '—'}</p>
                                {p.seccion && <p className="text-xs text-muted-foreground">{p.seccion}</p>}
                              </td>
                              <td className="px-3 py-3 text-center text-muted-foreground font-mono text-xs">{p.hora_prestamo}</td>
                              <td className="px-3 py-3 text-center font-mono text-xs">
                                {p.hora_devolucion ? (
                                  <span className="text-green-400">{p.hora_devolucion}</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${est.bg} ${est.text}`}>
                                  <EstIcon className="w-3 h-3" />
                                  {est.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DEVOLVER/CONSUMIR MODAL                                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {devolverModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-base font-bold text-foreground">Finalizar Préstamo</h2>
                <button
                  onClick={() => { setDevolverModal(null); setDevolverNotas(''); setDevolverTipo('devuelto') }}
                  className="p-1.5 rounded-lg hover:bg-border transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Item info */}
                <div className="flex items-center gap-3 p-3 bg-border/20 rounded-lg">
                  <Package className="w-5 h-5 text-accent flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {devolverModal.item_descripcion || devolverModal.item_nombre || devolverModal.item_codigo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {devolverModal.cantidad} {devolverModal.unidad} · {devolverModal.persona_prestamo}
                    </p>
                  </div>
                </div>

                {/* Estado selector */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">¿Cómo finalizó?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDevolverTipo('devuelto')}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        devolverTipo === 'devuelto'
                          ? 'bg-green-900/20 border-green-600/40 text-green-400'
                          : 'border-border text-muted-foreground hover:bg-border/40'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Devuelto
                    </button>
                    <button
                      onClick={() => setDevolverTipo('consumido')}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        devolverTipo === 'consumido'
                          ? 'bg-zinc-900/20 border-zinc-600/40 text-zinc-300'
                          : 'border-border text-muted-foreground hover:bg-border/40'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Consumido
                    </button>
                  </div>
                  {devolverTipo === 'devuelto' && (
                    <p className="text-xs text-green-400/70 mt-1.5">El stock se repondrá al almacén</p>
                  )}
                  {devolverTipo === 'consumido' && (
                    <p className="text-xs text-zinc-400/70 mt-1.5">Material descartable/usado — no se repone stock</p>
                  )}
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Notas (opcional)</label>
                  <textarea
                    value={devolverNotas}
                    onChange={(e) => setDevolverNotas(e.target.value)}
                    placeholder="Observaciones sobre la devolución…"
                    rows={2}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end p-4 border-t border-border">
                <button
                  onClick={() => { setDevolverModal(null); setDevolverNotas(''); setDevolverTipo('devuelto') }}
                  disabled={devolverLoading}
                  className="px-3 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-border/40 transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDevolver}
                  disabled={devolverLoading}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                    devolverTipo === 'devuelto' ? 'bg-green-600 hover:bg-green-700' : 'bg-zinc-600 hover:bg-zinc-700'
                  }`}
                >
                  {devolverLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : devolverTipo === 'devuelto' ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {devolverTipo === 'devuelto' ? 'Registrar Devolución' : 'Marcar como Consumido'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
