'use client'

import { useState, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import {
  MOCK_CONTRATISTAS,
  MOCK_ITEMS_CATALOGO,
  MOCK_OBRAS,
  MOCK_ORDENES_ENTREGA,
} from '@/lib/constants'
import type { Contratista, OrdenEntrega } from '@/types'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  FileText,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  Clock,
  User,
  Phone,
  Briefcase,
  MapPin,
  Download,
  SlidersHorizontal,
  Check,
  Warehouse,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type MainView = 'nueva' | 'historial'
type FormStep = 'obra' | 'contratista' | 'detalles' | 'ubicacion' | 'materiales' | 'resumen'

interface CartItem {
  id: string
  codigo_fab: string
  descripcion: string
  cantidad: number
  unidad: string
  stock_disponible: number
  categoria: 'Materiales' | 'Herramientas' | 'Indumentaria'
  almacen_nombre: string
}

const FORM_STEPS: FormStep[] = ['obra', 'contratista', 'detalles', 'ubicacion', 'materiales', 'resumen']
const STEP_LABELS: Record<FormStep, string> = {
  obra: 'Obra',
  contratista: 'Contratista',
  detalles: 'Trabajo',
  ubicacion: 'Ubicación',
  materiales: 'Materiales',
  resumen: 'Resumen',
}

const TIPOS_TRABAJO = [
  'Pintura interior',
  'Pintura exterior',
  'Obra gris',
  'Instalación eléctrica',
  'Plomería',
  'Soldadura estructural',
  'Carpintería',
  'Albañilería',
  'Acabados',
  'Impermeabilización',
  'Otro',
]

// ─── Helper: classify item by code ────────────────────────────────────────────

function getCategoria(codigo: string): 'Materiales' | 'Herramientas' | 'Indumentaria' {
  if (codigo.includes('ANDAMIO') || codigo.includes('HILTI')) return 'Herramientas'
  if (codigo.includes('CASCO') || codigo.includes('CHALECO') || codigo.includes('GUANTES')) return 'Indumentaria'
  return 'Materiales'
}

// ─── Helper: export to CSV ────────────────────────────────────────────────────

function exportToCSV(ordenes: OrdenEntrega[]) {
  const header = 'N° Orden,Obra,Contratista,Tipo Trabajo,Título,Sector,Piso,Depto,Duración (días),Items,Unidades,Creado por,Fecha\n'
  const rows = ordenes.map((o) =>
    [
      o.numero_orden,
      `"${o.obra_nombre}"`,
      `"${o.contratista_nombre}"`,
      `"${o.tipo_trabajo}"`,
      `"${o.titulo}"`,
      `"${o.sector}"`,
      `"${o.piso}"`,
      `"${o.departamento}"`,
      o.duracion_dias,
      o.total_items,
      o.total_unidades,
      `"${o.creado_por}"`,
      new Date(o.created_at).toLocaleDateString('es-MX'),
    ].join(',')
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ordenes_entrega_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Helper: export to printable HTML (PDF) ──────────────────────────────────

function exportToPDF(ordenes: OrdenEntrega[]) {
  const html = `
    <html><head><title>Órdenes de Entrega</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
      h1 { font-size: 18px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 11px; }
      th { background: #f5f5f5; font-weight: bold; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>Reporte de Órdenes de Entrega de Material</h1>
    <p>Generado: ${new Date().toLocaleString('es-MX')}</p>
    <table>
      <tr><th>N° Orden</th><th>Obra</th><th>Contratista</th><th>Tipo Trabajo</th><th>Título</th><th>Sector / Piso / Depto</th><th>Duración</th><th>Items</th><th>Unidades</th><th>Creado por</th><th>Fecha</th></tr>
      ${ordenes.map((o) => `
        <tr>
          <td>${o.numero_orden}</td>
          <td>${o.obra_nombre}</td>
          <td>${o.contratista_nombre}</td>
          <td>${o.tipo_trabajo}</td>
          <td>${o.titulo}</td>
          <td>${o.sector} / ${o.piso} / ${o.departamento}</td>
          <td>${o.duracion_dias} días</td>
          <td>${o.total_items}</td>
          <td>${o.total_unidades}</td>
          <td>${o.creado_por}</td>
          <td>${new Date(o.created_at).toLocaleDateString('es-MX')}</td>
        </tr>
      `).join('')}
    </table>
    </body></html>`
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.print()
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function SolicitudesPage() {
  // ── Main view toggle ──
  const [mainView, setMainView] = useState<MainView>('nueva')

  // ── Form state ──
  const [formStep, setFormStep] = useState<FormStep>('obra')
  const [selectedObraId, setSelectedObraId] = useState('')
  const [selectedContratista, setSelectedContratista] = useState<Contratista | null>(null)
  const [searchContratista, setSearchContratista] = useState('')
  const [showNewContratista, setShowNewContratista] = useState(false)
  const [newContratistaNombre, setNewContratistaNombre] = useState('')
  const [newContratistaTelefono, setNewContratistaTelefono] = useState('')
  const [tipoTrabajo, setTipoTrabajo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [sector, setSector] = useState('')
  const [piso, setPiso] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [duracionDias, setDuracionDias] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchItem, setSearchItem] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'Todo' | 'Materiales' | 'Herramientas' | 'Indumentaria'>('Todo')
  const [submitted, setSubmitted] = useState(false)

  // ── Historial state ──
  const [ordenes, setOrdenes] = useState<OrdenEntrega[]>(MOCK_ORDENES_ENTREGA)
  const [contratistas, setContratistas] = useState<Contratista[]>(MOCK_CONTRATISTAS)
  const [searchHistorial, setSearchHistorial] = useState('')
  const [filterObra, setFilterObra] = useState('')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // ── Derived ──
  const selectedObra = MOCK_OBRAS.find((o) => o.id === selectedObraId)
  const currentStepIdx = FORM_STEPS.indexOf(formStep)

  const filteredContratistas = useMemo(() => {
    if (!searchContratista.trim()) return []
    return contratistas.filter(
      (c) =>
        c.estado === 'activo' &&
        (c.nombre.toLowerCase().includes(searchContratista.toLowerCase()) ||
          c.empresa.toLowerCase().includes(searchContratista.toLowerCase()) ||
          (c.telefono && c.telefono.includes(searchContratista)))
    )
  }, [contratistas, searchContratista])

  const catalogItems = useMemo(() => {
    return MOCK_ITEMS_CATALOGO.map((item) => ({
      ...item,
      categoria: getCategoria(item.codigo_fab),
    }))
  }, [])

  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      const matchSearch =
        !searchItem ||
        item.codigo_fab.toLowerCase().includes(searchItem.toLowerCase()) ||
        item.descripcion.toLowerCase().includes(searchItem.toLowerCase())
      const matchCategory = categoryFilter === 'Todo' || item.categoria === categoryFilter
      return matchSearch && matchCategory && item.cantidad > 0
    })
  }, [catalogItems, searchItem, categoryFilter])

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((o) => {
      const matchSearch =
        !searchHistorial ||
        o.contratista_nombre.toLowerCase().includes(searchHistorial.toLowerCase()) ||
        o.numero_orden.toLowerCase().includes(searchHistorial.toLowerCase()) ||
        o.titulo.toLowerCase().includes(searchHistorial.toLowerCase()) ||
        o.items.some(
          (it) =>
            it.codigo_fab.toLowerCase().includes(searchHistorial.toLowerCase()) ||
            it.descripcion.toLowerCase().includes(searchHistorial.toLowerCase())
        )
      const matchObra = !filterObra || o.obra_id === filterObra
      const matchFechaDesde = !filterFechaDesde || new Date(o.created_at) >= new Date(filterFechaDesde)
      const matchFechaHasta = !filterFechaHasta || new Date(o.created_at) <= new Date(filterFechaHasta + 'T23:59:59')
      return matchSearch && matchObra && matchFechaDesde && matchFechaHasta
    })
  }, [ordenes, searchHistorial, filterObra, filterFechaDesde, filterFechaHasta])

  // ── Cart operations ──
  const addToCart = (item: { id: string; codigo_fab: string; descripcion: string; unidad: string; cantidad: number; categoria: 'Materiales' | 'Herramientas' | 'Indumentaria'; almacen_nombre?: string }) => {
    const existing = cart.find((c) => c.id === item.id)
    if (existing) {
      if (existing.cantidad < existing.stock_disponible) {
        setCart(cart.map((c) => (c.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c)))
      }
    } else {
      setCart([
        ...cart,
        {
          id: item.id,
          codigo_fab: item.codigo_fab,
          descripcion: item.descripcion,
          cantidad: 1,
          unidad: item.unidad,
          stock_disponible: item.cantidad,
          categoria: item.categoria,
          almacen_nombre: item.almacen_nombre || 'Sin asignar',
        },
      ])
    }
  }

  const updateQty = (id: string, delta: number) => {
    setCart(
      cart
        .map((c) => {
          if (c.id !== id) return c
          const newQty = c.cantidad + delta
          if (newQty <= 0) return null
          return { ...c, cantidad: Math.min(newQty, c.stock_disponible) }
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const setQty = (id: string, val: number) => {
    if (val <= 0) {
      setCart(cart.filter((c) => c.id !== id))
    } else {
      setCart(cart.map((c) => (c.id === id ? { ...c, cantidad: Math.min(val, c.stock_disponible) } : c)))
    }
  }

  const removeFromCart = (id: string) => setCart(cart.filter((c) => c.id !== id))

  // ── Step navigation ──
  const canProceed = (): boolean => {
    switch (formStep) {
      case 'obra': return !!selectedObraId
      case 'contratista': return !!selectedContratista
      case 'detalles': return !!tipoTrabajo && !!titulo.trim()
      case 'ubicacion': return !!sector.trim() && !!piso.trim()
      case 'materiales': return cart.length > 0
      case 'resumen': return true
      default: return false
    }
  }

  const goNext = () => {
    const idx = FORM_STEPS.indexOf(formStep)
    if (idx < FORM_STEPS.length - 1) setFormStep(FORM_STEPS[idx + 1])
  }
  const goPrev = () => {
    const idx = FORM_STEPS.indexOf(formStep)
    if (idx > 0) setFormStep(FORM_STEPS[idx - 1])
  }

  // ── Submit order ──
  const handleSubmit = () => {
    if (!selectedContratista || !selectedObra) return
    const newOrder: OrdenEntrega = {
      id: `oe-${Date.now()}`,
      numero_orden: `OE-2026-${String(ordenes.length + 1).padStart(3, '0')}`,
      obra_id: selectedObraId,
      obra_nombre: selectedObra.nombre,
      contratista_id: selectedContratista.id,
      contratista_nombre: selectedContratista.nombre,
      contratista_telefono: selectedContratista.telefono,
      tipo_trabajo: tipoTrabajo,
      titulo,
      descripcion: descripcion || undefined,
      sector,
      piso,
      departamento,
      duracion_dias: duracionDias,
      items: cart.map((c) => ({
        id: c.id,
        codigo_fab: c.codigo_fab,
        descripcion: c.descripcion,
        cantidad: c.cantidad,
        unidad: c.unidad,
        categoria: c.categoria,
      })),
      total_items: cart.length,
      total_unidades: cart.reduce((s, c) => s + c.cantidad, 0),
      creado_por: 'Usuario Actual',
      created_at: new Date().toISOString(),
    }
    setOrdenes([newOrder, ...ordenes])
    setSubmitted(true)
  }

  const resetForm = () => {
    setFormStep('obra')
    setSelectedObraId('')
    setSelectedContratista(null)
    setSearchContratista('')
    setTipoTrabajo('')
    setTitulo('')
    setDescripcion('')
    setSector('')
    setPiso('')
    setDepartamento('')
    setDuracionDias(1)
    setCart([])
    setSearchItem('')
    setCategoryFilter('Todo')
    setSubmitted(false)
  }

  // ── New contratista ──
  const handleCreateContratista = () => {
    if (!newContratistaNombre.trim()) return
    const nuevo: Contratista = {
      id: `c-${Date.now()}`,
      nombre: newContratistaNombre.trim(),
      empresa: '—',
      telefono: newContratistaTelefono.trim() || undefined,
      obra: selectedObra?.nombre || '',
      estado: 'activo',
      fecha_registro: new Date().toISOString().split('T')[0],
    }
    setContratistas([nuevo, ...contratistas])
    setSelectedContratista(nuevo)
    setNewContratistaNombre('')
    setNewContratistaTelefono('')
    setShowNewContratista(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Entrega de Material</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea órdenes de entrega y consulta el historial de despachos
          </p>
        </div>

        {/* ── Main Tab Switcher ── */}
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
            <span className="hidden sm:inline">Nueva Orden</span>
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
        {/* NUEVA ORDEN VIEW                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mainView === 'nueva' && !submitted && (
          <div className="space-y-4">
            {/* ── Stepper ── */}
            <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
                {FORM_STEPS.map((step, idx) => (
                  <div key={step} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        if (idx < currentStepIdx) setFormStep(step)
                      }}
                      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                        idx === currentStepIdx
                          ? 'bg-accent text-white'
                          : idx < currentStepIdx
                            ? 'bg-accent/15 text-accent cursor-pointer hover:bg-accent/25'
                            : 'bg-border/40 text-muted-foreground'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === currentStepIdx
                            ? 'bg-white/20'
                            : idx < currentStepIdx
                              ? 'bg-accent/20'
                              : 'bg-border'
                        }`}
                      >
                        {idx < currentStepIdx ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
                    </button>
                    {idx < FORM_STEPS.length - 1 && (
                      <div
                        className={`w-4 sm:w-8 h-0.5 rounded ${
                          idx < currentStepIdx ? 'bg-accent' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Step Content ── */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 min-h-[320px]">

              {/* STEP: OBRA */}
              {formStep === 'obra' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Seleccionar Obra</h2>
                    <p className="text-sm text-muted-foreground mt-1">Elige la obra a la que se asignará la entrega de material</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {MOCK_OBRAS.filter((o) => o.estado === 'activa').map((obra) => (
                      <button
                        key={obra.id}
                        onClick={() => setSelectedObraId(obra.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          selectedObraId === obra.id
                            ? 'border-accent bg-accent/5 shadow-sm'
                            : 'border-border hover:border-accent/40 hover:bg-border/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              selectedObraId === obra.id ? 'bg-accent text-white' : 'bg-border/50 text-muted-foreground'
                            }`}
                          >
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{obra.nombre}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{obra.ubicacion}</p>
                            <p className="text-xs text-muted-foreground">Resp: {obra.responsable}</p>
                          </div>
                        </div>
                        {selectedObraId === obra.id && (
                          <div className="mt-2 flex items-center gap-1 text-accent text-xs font-medium">
                            <Check className="w-3.5 h-3.5" /> Seleccionada
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP: CONTRATISTA */}
              {formStep === 'contratista' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Seleccionar Contratista</h2>
                    <p className="text-sm text-muted-foreground mt-1">Busca un contratista existente o agrega uno nuevo</p>
                  </div>

                  {selectedContratista ? (
                    <div className="bg-accent/5 border-2 border-accent rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                            <User className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{selectedContratista.nombre}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{selectedContratista.empresa}</span>
                              {selectedContratista.telefono && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {selectedContratista.telefono}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedContratista(null)
                            setSearchContratista('')
                          }}
                          className="text-xs text-accent font-medium hover:underline"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre, empresa o teléfono..."
                          value={searchContratista}
                          onChange={(e) => setSearchContratista(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      {filteredContratistas.length > 0 && (
                        <div className="border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                          {filteredContratistas.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedContratista(c)
                                setSearchContratista('')
                              }}
                              className="w-full flex items-center gap-3 p-3 hover:bg-border/30 transition-colors border-b border-border last:border-b-0"
                            >
                              <div className="w-9 h-9 rounded-full bg-border/50 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{c.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  {c.empresa}
                                  {c.telefono ? ` · ${c.telefono}` : ''}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchContratista && filteredContratistas.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No se encontraron contratistas
                        </div>
                      )}

                      <div className="border-t border-border pt-4">
                        {!showNewContratista ? (
                          <button
                            onClick={() => setShowNewContratista(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 text-accent rounded-xl text-sm font-medium hover:bg-accent/20 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar nuevo contratista
                          </button>
                        ) : (
                          <div className="bg-border/10 border border-border rounded-xl p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-foreground">Nuevo Contratista</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">Nombre *</label>
                                <input
                                  value={newContratistaNombre}
                                  onChange={(e) => setNewContratistaNombre(e.target.value)}
                                  placeholder="Nombre completo"
                                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">Teléfono</label>
                                <input
                                  value={newContratistaTelefono}
                                  onChange={(e) => setNewContratistaTelefono(e.target.value)}
                                  placeholder="+591 7XXXXXXX"
                                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setShowNewContratista(false)}
                                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleCreateContratista}
                                disabled={!newContratistaNombre.trim()}
                                className="px-4 py-1.5 bg-accent text-white text-sm rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Crear y seleccionar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP: DETALLES */}
              {formStep === 'detalles' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Detalles del Trabajo</h2>
                    <p className="text-sm text-muted-foreground mt-1">Indica el tipo de trabajo, título y descripción</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Tipo de Trabajo *</label>
                      <select
                        value={tipoTrabajo}
                        onChange={(e) => setTipoTrabajo(e.target.value)}
                        className="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="">Seleccionar...</option>
                        {TIPOS_TRABAJO.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Duración estimada</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDuracionDias(Math.max(1, duracionDias - 1))}
                          className="w-9 h-9 flex items-center justify-center bg-border/50 rounded-lg hover:bg-border transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={duracionDias}
                          onChange={(e) => setDuracionDias(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center px-2 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <button
                          onClick={() => setDuracionDias(duracionDias + 1)}
                          className="w-9 h-9 flex items-center justify-center bg-border/50 rounded-lg hover:bg-border transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-muted-foreground">días</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Título de la Orden *</label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej: Pintura de acabados Piso 3"
                      className="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Breve descripción del trabajo a realizar..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP: UBICACIÓN */}
              {formStep === 'ubicacion' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Ubicación del Trabajo</h2>
                    <p className="text-sm text-muted-foreground mt-1">Asigna el sector, piso y departamento(s) donde se trabajará</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Sector *</label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="Ej: Sector 1"
                        className="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Piso *</label>
                      <input
                        type="text"
                        value={piso}
                        onChange={(e) => setPiso(e.target.value)}
                        placeholder="Ej: Piso 3"
                        className="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Departamento(s) <span className="text-muted-foreground font-normal">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={departamento}
                        onChange={(e) => setDepartamento(e.target.value)}
                        placeholder="Ej: A, B, C"
                        className="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                  {(sector || piso || departamento) && (
                    <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/20 rounded-xl">
                      <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground">
                        {[sector, piso, departamento].filter(Boolean).join(' → ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: MATERIALES */}
              {formStep === 'materiales' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Asignar Materiales</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Busca y agrega los materiales que se entregarán al contratista
                    </p>
                  </div>

                  {/* Search and filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar por código, nombre o descripción..."
                        value={searchItem}
                        onChange={(e) => setSearchItem(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div className="flex gap-1 bg-border/30 rounded-xl p-0.5">
                      {(['Todo', 'Materiales', 'Herramientas', 'Indumentaria'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                            categoryFilter === cat
                              ? 'bg-accent text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split: items grid + cart */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Item catalog */}
                    <div className="lg:col-span-3 space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {filteredItems.map((item) => {
                        const inCart = cart.find((c) => c.id === item.id)
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              inCart ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-accent/20 hover:bg-border/10'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-lg bg-border/40 flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-xs font-bold text-accent">{item.codigo_fab}</p>
                              <p className="text-sm text-foreground line-clamp-1">{item.descripcion}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-muted-foreground">
                                  Stock: {item.cantidad} {item.unidad}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    item.categoria === 'Herramientas'
                                      ? 'bg-orange-500/10 text-orange-500'
                                      : item.categoria === 'Indumentaria'
                                        ? 'bg-blue-500/10 text-blue-500'
                                        : 'bg-accent/10 text-accent'
                                  }`}
                                >
                                  {item.categoria}
                                </span>
                              </div>
                              {item.almacen_nombre && (
                                <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                                  <Warehouse className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{item.almacen_nombre}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => addToCart(item)}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                                inCart
                                  ? 'bg-accent/20 text-accent'
                                  : 'bg-accent text-white hover:bg-accent/90'
                              }`}
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        )
                      })}
                      {filteredItems.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          No se encontraron materiales
                        </div>
                      )}
                    </div>

                    {/* Cart sidebar */}
                    <div className="lg:col-span-2">
                      <div className="bg-border/10 border border-border rounded-xl p-4 sticky top-0">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-foreground text-sm">
                            Materiales seleccionados
                          </h3>
                          <span className="text-xs text-muted-foreground bg-border/50 px-2 py-0.5 rounded-full">
                            {cart.length}
                          </span>
                        </div>

                        {cart.length === 0 ? (
                          <div className="text-center py-8">
                            <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">
                              Agrega materiales desde el catálogo
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[320px] overflow-y-auto">
                            {cart.map((item) => (
                              <div
                                key={item.id}
                                className="bg-card border border-border rounded-lg p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-mono text-[10px] font-bold text-accent">{item.codigo_fab}</p>
                                    <p className="text-xs text-foreground line-clamp-2 mt-0.5">{item.descripcion}</p>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <Warehouse className="w-2.5 h-2.5" /> {item.almacen_nombre}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => updateQty(item.id, -1)}
                                      className="w-7 h-7 flex items-center justify-center bg-border/50 rounded-md hover:bg-border transition-colors"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      max={item.stock_disponible}
                                      value={item.cantidad}
                                      onChange={(e) => setQty(item.id, parseInt(e.target.value) || 0)}
                                      className="w-12 h-7 text-center text-xs bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                    <button
                                      onClick={() => updateQty(item.id, 1)}
                                      disabled={item.cantidad >= item.stock_disponible}
                                      className="w-7 h-7 flex items-center justify-center bg-border/50 rounded-md hover:bg-border transition-colors disabled:opacity-30"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{item.unidad}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {cart.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold text-foreground">
                              {cart.length} items · {cart.reduce((s, c) => s + c.cantidad, 0)} uds
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: RESUMEN */}
              {formStep === 'resumen' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Resumen de la Orden</h2>
                    <p className="text-sm text-muted-foreground mt-1">Revisa los datos antes de confirmar</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-border/10 border border-border rounded-xl p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-accent" /> Obra
                        </h3>
                        <p className="text-sm text-foreground">{selectedObra?.nombre}</p>
                      </div>

                      <div className="bg-border/10 border border-border rounded-xl p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <User className="w-4 h-4 text-accent" /> Contratista
                        </h3>
                        <p className="text-sm text-foreground">{selectedContratista?.nombre}</p>
                        {selectedContratista?.telefono && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {selectedContratista.telefono}
                          </p>
                        )}
                      </div>

                      <div className="bg-border/10 border border-border rounded-xl p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4 text-accent" /> Trabajo
                        </h3>
                        <p className="text-sm text-foreground font-medium">{titulo}</p>
                        <p className="text-xs text-muted-foreground">{tipoTrabajo} · {duracionDias} días</p>
                        {descripcion && <p className="text-xs text-muted-foreground mt-1">{descripcion}</p>}
                      </div>

                      <div className="bg-border/10 border border-border rounded-xl p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-accent" /> Ubicación
                        </h3>
                        <p className="text-sm text-foreground">
                          {[sector, piso, departamento].filter(Boolean).join(' → ')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-border/10 border border-border rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-accent" /> Materiales ({cart.length})
                      </h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-2.5">
                            <div className="w-9 h-9 bg-border/40 rounded flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-mono font-bold text-accent">{item.codigo_fab}</p>
                              <p className="text-xs text-foreground line-clamp-1">{item.descripcion}</p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Warehouse className="w-2.5 h-2.5" /> {item.almacen_nombre}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-foreground">{item.cantidad}</p>
                              <p className="text-[10px] text-muted-foreground">{item.unidad}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex justify-between">
                        <span className="text-sm text-muted-foreground">Total unidades</span>
                        <span className="text-sm font-bold text-foreground">
                          {cart.reduce((s, c) => s + c.cantidad, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Navigation buttons ── */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={goPrev}
                disabled={currentStepIdx === 0}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground bg-card border border-border rounded-xl hover:bg-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="text-xs text-muted-foreground">
                Paso {currentStepIdx + 1} de {FORM_STEPS.length}
              </div>

              {formStep === 'resumen' ? (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Confirmar Orden
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CONFIRMATION VIEW                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mainView === 'nueva' && submitted && (
          <div className="bg-card border border-border rounded-xl p-6 sm:p-10">
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Orden Registrada</h2>
              <p className="text-sm text-muted-foreground">
                La orden de entrega de material ha sido creada exitosamente
              </p>
              <div className="bg-border/20 rounded-xl p-4 text-left space-y-1 text-sm">
                <p><strong>Título:</strong> {titulo}</p>
                <p><strong>Obra:</strong> {selectedObra?.nombre}</p>
                <p><strong>Contratista:</strong> {selectedContratista?.nombre}</p>
                <p><strong>Items:</strong> {cart.length} · {cart.reduce((s, c) => s + c.cantidad, 0)} unidades</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => { resetForm(); setMainView('historial') }}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-border/30 transition-colors"
                >
                  Ver Historial
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                  Nueva Orden
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HISTORIAL VIEW                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mainView === 'historial' && (
          <div className="space-y-4">
            {/* Search + Filters + Export */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por contratista, N° orden, título o material..."
                    value={searchHistorial}
                    onChange={(e) => setSearchHistorial(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      showFilters
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-card border-border text-foreground hover:bg-border/30'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">Filtros</span>
                  </button>
                  <button
                    onClick={() => exportToCSV(filteredOrdenes)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-border/30 transition-colors"
                    title="Exportar a Excel/CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <button
                    onClick={() => exportToPDF(filteredOrdenes)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-border/30 transition-colors"
                    title="Exportar a PDF"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
              </div>

              {/* Expandable filters */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Obra</label>
                    <select
                      value={filterObra}
                      onChange={(e) => setFilterObra(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Todas</option>
                      {MOCK_OBRAS.map((o) => (
                        <option key={o.id} value={o.id}>{o.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Desde</label>
                    <input
                      type="date"
                      value={filterFechaDesde}
                      onChange={(e) => setFilterFechaDesde(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Hasta</label>
                    <input
                      type="date"
                      value={filterFechaHasta}
                      onChange={(e) => setFilterFechaHasta(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  {(filterObra || filterFechaDesde || filterFechaHasta) && (
                    <button
                      onClick={() => {
                        setFilterObra('')
                        setFilterFechaDesde('')
                        setFilterFechaHasta('')
                      }}
                      className="text-xs text-accent hover:underline self-end pb-2"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredOrdenes.length} {filteredOrdenes.length === 1 ? 'orden' : 'órdenes'} encontrada{filteredOrdenes.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Order cards */}
            {filteredOrdenes.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No se encontraron órdenes de entrega</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrdenes.map((orden) => {
                  const isExpanded = expandedOrder === orden.id
                  const fecha = new Date(orden.created_at)
                  return (
                    <div
                      key={orden.id}
                      className="bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                    >
                      {/* Card header */}
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : orden.id)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-accent">{orden.numero_orden}</span>
                            </div>
                            <h3 className="font-semibold text-foreground mt-1 text-sm sm:text-base truncate">{orden.titulo}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> {orden.obra_nombre}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {orden.contratista_nombre}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {orden.sector} / {orden.piso}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                <Calendar className="w-3 h-3" />
                                {fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                                <Clock className="w-3 h-3" />
                                {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                por {orden.creado_por}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="bg-border/30 rounded-lg px-2.5 py-1.5 text-center">
                                <p className="text-lg font-bold text-foreground leading-none">{orden.total_items}</p>
                                <p className="text-[9px] text-muted-foreground">items</p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mobile date info */}
                        <div className="sm:hidden flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>por {orden.creado_por}</span>
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-border p-4 bg-border/5 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Tipo Trabajo</p>
                              <p className="text-sm text-foreground font-medium mt-0.5">{orden.tipo_trabajo}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Duración</p>
                              <p className="text-sm text-foreground font-medium mt-0.5">{orden.duracion_dias} días</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Departamento</p>
                              <p className="text-sm text-foreground font-medium mt-0.5">{orden.departamento || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total Unidades</p>
                              <p className="text-sm text-foreground font-medium mt-0.5">{orden.total_unidades}</p>
                            </div>
                          </div>

                          {orden.descripcion && (
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Descripción</p>
                              <p className="text-sm text-foreground mt-0.5">{orden.descripcion}</p>
                            </div>
                          )}

                          {orden.contratista_telefono && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-foreground">{orden.contratista_telefono}</span>
                            </div>
                          )}

                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Materiales entregados</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {orden.items.map((item, idx) => (
                                <div
                                  key={`${item.id}-${idx}`}
                                  className="flex items-center gap-3 bg-card border border-border rounded-lg p-2.5"
                                >
                                  <div className="w-10 h-10 bg-border/40 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-mono text-[10px] font-bold text-accent">{item.codigo_fab}</p>
                                    <p className="text-xs text-foreground line-clamp-1">{item.descripcion}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-foreground">{item.cantidad}</p>
                                    <p className="text-[9px] text-muted-foreground">{item.unidad}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
