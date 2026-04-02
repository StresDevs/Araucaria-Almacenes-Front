'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { bajasService, inventarioService, categoriasService, HttpError } from '@/services'
import type { SolicitudBaja, MotivoBaja, ItemInventario, CategoriaItem } from '@/types'
import {
  Trash2, Search, Upload, Send, ClipboardList, Plus, X, Image as ImageIcon,
  Check, Clock, XCircle, ChevronDown, Package, Loader2, AlertCircle,
} from 'lucide-react'

// ─── Constants ─────────────────────────────────────────────────────────────────

const MOTIVOS_BAJA: { id: MotivoBaja; label: string; color: string }[] = [
  { id: 'daño', label: 'Daño', color: 'bg-red-900/20 text-red-400 border-red-600/30' },
  { id: 'vencimiento', label: 'Vencimiento', color: 'bg-orange-900/20 text-orange-400 border-orange-600/30' },
  { id: 'robo', label: 'Robo', color: 'bg-purple-900/20 text-purple-400 border-purple-600/30' },
  { id: 'perdida', label: 'Pérdida', color: 'bg-amber-900/20 text-amber-400 border-amber-600/30' },
  { id: 'obsoleto', label: 'Obsoleto', color: 'bg-gray-900/20 text-gray-400 border-gray-600/30' },
  { id: 'defecto_fabrica', label: 'Defecto de Fábrica', color: 'bg-cyan-900/20 text-cyan-400 border-cyan-600/30' },
  { id: 'otro', label: 'Otro', color: 'bg-blue-900/20 text-blue-400 border-blue-600/30' },
]

const MOTIVOS_REQUIEREN_EVIDENCIA: MotivoBaja[] = ['daño', 'vencimiento']

const ESTADO_STYLES: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  pendiente: { bg: 'bg-amber-900/20 border-amber-600/30', text: 'text-amber-400', icon: Clock, label: 'Pendiente' },
  aprobada: { bg: 'bg-green-900/20 border-green-600/30', text: 'text-green-400', icon: Check, label: 'Aprobada' },
  rechazada: { bg: 'bg-red-900/20 border-red-600/30', text: 'text-red-400', icon: XCircle, label: 'Rechazada' },
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BajasPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // View state
  const [mainView, setMainView] = useState<'nueva' | 'historial'>('nueva')

  // Nueva baja state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('Todos')
  const [selectedItem, setSelectedItem] = useState<ItemInventario | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState<MotivoBaja>('daño')
  const [descripcionMotivo, setDescripcionMotivo] = useState('')
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null)
  const [evidenciaPreview, setEvidenciaPreview] = useState<string | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // API data
  const [items, setItems] = useState<ItemInventario[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])

  // Historial state
  const [historialFilter, setHistorialFilter] = useState<'todos' | 'pendiente' | 'aprobada' | 'rechazada'>('todos')
  const [solicitudesBaja, setSolicitudesBaja] = useState<SolicitudBaja[]>([])
  const [bajasLoading, setBajasLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ── Load items catalog ──
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setItemsLoading(true)
      try {
        const [itemsRes, catsRes] = await Promise.all([
          inventarioService.getAll(),
          categoriasService.getAll(),
        ])
        if (!cancelled) {
          setItems(itemsRes.data.filter((i) => i.activo && i.stock_total > 0))
          setCategorias(catsRes.data)
        }
      } catch (err) {
        if (!cancelled) {
          toast({ title: 'Error', description: 'No se pudieron cargar los productos', variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setItemsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [toast])

  // ── Load historial ──
  const fetchHistorial = useCallback(async () => {
    setBajasLoading(true)
    try {
      const res = await bajasService.getAll()
      setSolicitudesBaja(res.data)
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar el historial de bajas', variant: 'destructive' })
    } finally {
      setBajasLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (mainView === 'historial') {
      fetchHistorial()
    }
  }, [mainView, fetchHistorial])

  // Category names derived from items
  const categoriasDisponibles = useMemo(() => {
    const catNames = new Set<string>()
    items.forEach((item) => {
      if (item.categoria_nombre) catNames.add(item.categoria_nombre)
    })
    return ['Todos', ...Array.from(catNames).sort()]
  }, [items])

  // Filtered catalog items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const term = searchQuery.toLowerCase()
      const matchSearch =
        term.length === 0 ||
        (item.descripcion ?? '').toLowerCase().includes(term) ||
        (item.nombre ?? '').toLowerCase().includes(term) ||
        item.codigo.toLowerCase().includes(term)
      const matchCat = categoriaFilter === 'Todos' || item.categoria_nombre === categoriaFilter
      return matchSearch && matchCat
    })
  }, [items, searchQuery, categoriaFilter])

  // Filtered historial
  const filteredHistorial = useMemo(() => {
    return solicitudesBaja.filter((s) => historialFilter === 'todos' || s.estado === historialFilter)
  }, [solicitudesBaja, historialFilter])

  // Stats
  const pendientesCount = solicitudesBaja.filter((s) => s.estado === 'pendiente').length
  const aprobadasCount = solicitudesBaja.filter((s) => s.estado === 'aprobada').length
  const rechazadasCount = solicitudesBaja.filter((s) => s.estado === 'rechazada').length

  // Whether evidence is required for current motivo
  const evidenciaRequerida = MOTIVOS_REQUIEREN_EVIDENCIA.includes(motivo)

  // ── Handlers ──
  const handleSelectItem = (item: ItemInventario) => {
    setSelectedItem(item)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Error', description: 'La imagen no puede pesar más de 5MB', variant: 'destructive' })
        return
      }
      setEvidenciaFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setEvidenciaPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveFile = () => {
    setEvidenciaFile(null)
    setEvidenciaPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canSubmit =
    selectedItem &&
    cantidad &&
    parseInt(cantidad, 10) > 0 &&
    parseInt(cantidad, 10) <= (selectedItem?.stock_total ?? 0) &&
    descripcionMotivo.trim().length > 0 &&
    (!evidenciaRequerida || evidenciaFile) &&
    !isSubmitting

  const handleSubmit = async () => {
    if (!canSubmit || !selectedItem) return

    setIsSubmitting(true)
    try {
      await bajasService.create({
        itemId: selectedItem.id,
        cantidad: parseInt(cantidad, 10),
        motivo,
        descripcionMotivo: descripcionMotivo.trim(),
        evidencia: evidenciaFile ?? undefined,
      })
      toast({ title: 'Solicitud enviada', description: 'Tu solicitud de baja fue enviada al administrador para su aprobación' })
      setSubmitted(true)
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al enviar la solicitud'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setSelectedItem(null)
    setCantidad('')
    setMotivo('daño')
    setDescripcionMotivo('')
    handleRemoveFile()
    setSubmitted(false)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Registro de Bajas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Solicita la baja de productos y consulta el historial de solicitudes
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-card border border-border rounded-xl p-1 gap-1">
          <button
            onClick={() => { setMainView('nueva'); setSubmitted(false) }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mainView === 'nueva'
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-border/40'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Solicitud</span>
            <span className="sm:hidden">Nueva</span>
          </button>
          <button
            onClick={() => setMainView('historial')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mainView === 'historial'
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-border/40'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Historial</span>
            <span className="sm:hidden">Historial</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* NUEVA SOLICITUD VIEW                                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mainView === 'nueva' && !submitted && (
          <div className="space-y-4">
            {/* Step 1: Select Item */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">1</span>
                </div>
                <h2 className="text-base font-bold text-foreground">Seleccionar Producto</h2>
              </div>

              {itemsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Cargando productos…</span>
                </div>
              ) : (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por código, nombre o descripción…"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true) }}
                      onFocus={() => setShowSearchResults(true)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(''); setShowSearchResults(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Category Filters */}
                  <div className="flex gap-2 flex-wrap">
                    {categoriasDisponibles.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setCategoriaFilter(cat); setShowSearchResults(true) }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                          categoriaFilter === cat
                            ? 'bg-accent text-white border-accent'
                            : 'bg-border/30 text-foreground border-border hover:bg-border/60'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search Results Dropdown */}
                  {showSearchResults && !selectedItem && (
                    <div className="border border-border rounded-lg bg-card max-h-64 overflow-y-auto divide-y divide-border">
                      {filteredItems.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No se encontraron productos
                        </div>
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
                              <p className="text-sm font-medium text-foreground truncate">
                                {item.descripcion || item.nombre || item.codigo}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <span className="font-mono text-accent">{item.codigo}</span>
                                {item.categoria_nombre && (
                                  <>
                                    <span className="mx-1.5">·</span>
                                    {item.categoria_nombre}
                                  </>
                                )}
                                <span className="mx-1.5">·</span>
                                Stock: {item.stock_total} {item.unidad}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected Item */}
                  {selectedItem && (
                    <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">
                          {selectedItem.descripcion || selectedItem.nombre || selectedItem.codigo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono text-accent">{selectedItem.codigo}</span>
                          {selectedItem.categoria_nombre && (
                            <>
                              <span className="mx-1.5">·</span>
                              {selectedItem.categoria_nombre}
                            </>
                          )}
                          <span className="mx-1.5">·</span>
                          Stock: {selectedItem.stock_total} {selectedItem.unidad}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="p-1.5 rounded-lg hover:bg-border transition-colors text-muted-foreground hover:text-foreground"
                      >
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
                <h2 className="text-base font-bold text-foreground">Detalles de la Baja</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Cantidad a dar de baja</label>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Disponible: {selectedItem.stock_total} {selectedItem.unidad}
                    </p>
                  )}
                  {cantidad && selectedItem && parseInt(cantidad, 10) > selectedItem.stock_total && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      La cantidad excede el stock disponible
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Motivo de baja</label>
                  <div className="relative">
                    <select
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value as MotivoBaja)}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none pr-8"
                    >
                      {MOTIVOS_BAJA.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Descripción del motivo</label>
                  <textarea
                    value={descripcionMotivo}
                    onChange={(e) => setDescripcionMotivo(e.target.value)}
                    placeholder="Detalle las razones y circunstancias de la baja…"
                    rows={3}
                    maxLength={1000}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Evidence */}
            <div className={`bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4 transition-opacity ${selectedItem ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">3</span>
                </div>
                <h2 className="text-base font-bold text-foreground">Evidencia Fotográfica</h2>
                {evidenciaRequerida ? (
                  <span className="text-xs text-red-400 ml-1 font-semibold">(Obligatorio)</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-1">(Opcional)</span>
                )}
              </div>

              {evidenciaRequerida && !evidenciaFile && (
                <div className="flex items-center gap-2 p-3 bg-red-900/10 border border-red-600/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">
                    Para motivos de <strong>Daño</strong> o <strong>Vencimiento</strong>, la evidencia fotográfica es obligatoria
                  </p>
                </div>
              )}

              {!evidenciaPreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-accent/40 hover:bg-accent/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-border/30 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Subir fotografía</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      JPG, PNG o WebP · Máx. 5MB
                    </p>
                  </div>
                </button>
              ) : (
                <div className="relative border border-border rounded-xl overflow-hidden">
                  <img
                    src={evidenciaPreview}
                    alt="Evidencia"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 flex items-center gap-2 bg-card">
                    <ImageIcon className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-xs text-foreground truncate">{evidenciaFile?.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                      {evidenciaFile && (evidenciaFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
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
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Solicitar Aprobación
              </button>
            </div>
          </div>
        )}

        {/* ── Submitted confirmation ── */}
        {mainView === 'nueva' && submitted && (
          <div className="bg-card border border-border rounded-xl p-6 sm:p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Solicitud Enviada</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tu solicitud de baja para <span className="font-semibold text-foreground">{selectedItem?.descripcion || selectedItem?.nombre}</span> ha sido
              enviada al administrador para su aprobación.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Solicitud
              </button>
              <button
                onClick={() => { handleReset(); setMainView('historial') }}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-border/40 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Ver Historial
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HISTORIAL VIEW                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mainView === 'historial' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-xs text-muted-foreground font-mono uppercase">Pendientes</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-amber-400">{pendientesCount}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <p className="text-xs text-muted-foreground font-mono uppercase">Aprobadas</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-400">{aprobadasCount}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-xs text-muted-foreground font-mono uppercase">Rechazadas</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-red-400">{rechazadasCount}</p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'pendiente', 'aprobada', 'rechazada'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistorialFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    historialFilter === f
                      ? 'bg-accent text-white border-accent'
                      : 'bg-border/30 text-foreground border-border hover:bg-border/60'
                  }`}
                >
                  {f === 'todos' ? 'Todas' : ESTADO_STYLES[f].label + 's'}
                </button>
              ))}
            </div>

            {bajasLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando historial…</span>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistorial.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <Trash2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No hay solicitudes de baja con el filtro seleccionado</p>
                  </div>
                ) : (
                  filteredHistorial.map((sol) => {
                    const est = ESTADO_STYLES[sol.estado]
                    const EstIcon = est.icon
                    const motivoData = MOTIVOS_BAJA.find((m) => m.id === sol.motivo)
                    const isExpanded = expandedId === sol.id

                    return (
                      <div key={sol.id} className="bg-card border border-border rounded-xl overflow-hidden">
                        {/* Header */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : sol.id)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-border/10 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-border/30 flex items-center justify-center flex-shrink-0">
                            <Trash2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground truncate">{sol.item_descripcion}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${est.bg} ${est.text}`}>
                                <EstIcon className="w-3 h-3" />
                                {est.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <span className="font-mono text-accent">{sol.item_codigo}</span>
                              <span className="mx-1.5">·</span>
                              {sol.cantidad} unid.
                              <span className="mx-1.5">·</span>
                              {motivoData?.label}
                              <span className="mx-1.5">·</span>
                              {formatDate(sol.fecha_solicitud)}
                            </p>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Motivo</p>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${motivoData?.color}`}>
                                  {motivoData?.label}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Categoría</p>
                                <p className="text-foreground">{sol.item_categoria}</p>
                              </div>
                              <div className="sm:col-span-2">
                                <p className="text-xs text-muted-foreground mb-0.5">Descripción del motivo</p>
                                <p className="text-foreground text-sm">{sol.descripcion_motivo}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Solicitante</p>
                                <p className="text-foreground">{sol.solicitante}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Fecha de solicitud</p>
                                <p className="text-foreground">{formatDateTime(sol.fecha_solicitud)}</p>
                              </div>
                            </div>

                            {sol.evidencia_url && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1.5">Evidencia</p>
                                <a
                                  href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${sol.evidencia_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-border/20 rounded-lg hover:bg-border/40 transition-colors"
                                >
                                  <ImageIcon className="w-4 h-4 text-accent flex-shrink-0" />
                                  <span className="text-xs text-foreground">{sol.evidencia_nombre || 'Fotografía adjunta'}</span>
                                  <span className="text-xs text-accent ml-auto">Ver imagen</span>
                                </a>
                              </div>
                            )}

                            {sol.revisado_por && (
                              <div className="pt-2 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-1.5">Revisión</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Revisado por</p>
                                    <p className="text-foreground">{sol.revisado_por}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Fecha</p>
                                    <p className="text-foreground">{sol.fecha_revision ? formatDateTime(sol.fecha_revision) : '-'}</p>
                                  </div>
                                  {sol.notas_revision && (
                                    <div className="sm:col-span-2">
                                      <p className="text-xs text-muted-foreground">Notas</p>
                                      <p className="text-foreground">{sol.notas_revision}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
