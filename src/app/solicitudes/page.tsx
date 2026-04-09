'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AppShell } from '@/components/app-shell'
import { solicitudesService, sectorizacionService, type ItemDisponible } from '@/services'
import { useObras } from '@/hooks/use-obras'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/providers/auth-provider'
import { HttpError } from '@/services'
import { getHTMLPDFStyles, getHTMLPDFHeader, getHTMLPDFFooter, formatDatePDF } from '@/lib/pdf-layout'
import type { Contratista, OrdenEntrega, ObraSectorizacion, Sector, Piso, Departamento } from '@/types'
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
  Loader2,
  AlertCircle,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function csvField(value: string | number | undefined | null): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ─── Helper: export to CSV ────────────────────────────────────────────────────

function exportToCSV(ordenes: OrdenEntrega[]) {
  const BOM = '\uFEFF'
  const sep = ','
  const header = ['N° Orden', 'Obra', 'Contratista', 'Título', 'Sector', 'Piso', 'Departamento', 'Items', 'Unidades totales', 'Fecha de creación'].map(csvField).join(sep)
  const rows = ordenes.map((o) =>
    [
      o.numero_orden,
      o.obra_nombre,
      o.contratista_nombre,
      o.titulo,
      o.sector,
      o.piso,
      o.departamento || '',
      o.total_items,
      o.total_unidades,
      new Date(o.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    ].map(csvField).join(sep)
  ).join('\r\n')
  const blob = new Blob([BOM + header + '\r\n' + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Ordenes_Entrega_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Helper: export to printable HTML (PDF) ──────────────────────────────────

function exportToPDF(ordenes: OrdenEntrega[]) {
  const today = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  const totalItems = ordenes.reduce((s, o) => s + o.total_items, 0)
  const totalUnidades = ordenes.reduce((s, o) => s + o.total_unidades, 0)

  const tableRows = ordenes.map((o, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8faf8'
    const fecha = new Date(o.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `<tr>
      <td style="background:${bg}; text-align:center; font-weight:600; color:#2d5a3d;">${escapeHtml(o.numero_orden)}</td>
      <td style="background:${bg};">${escapeHtml(o.obra_nombre)}</td>
      <td style="background:${bg};">${escapeHtml(o.contratista_nombre)}</td>
      <td style="background:${bg};">${escapeHtml(o.titulo)}</td>
      <td style="background:${bg};">${escapeHtml(o.sector)}</td>
      <td style="background:${bg}; text-align:center;">${escapeHtml(o.piso)}</td>
      <td style="background:${bg}; text-align:center;">${escapeHtml(o.departamento || '—')}</td>
      <td style="background:${bg}; text-align:center; font-weight:600;">${o.total_items}</td>
      <td style="background:${bg}; text-align:center; font-weight:600;">${o.total_unidades}</td>
      <td style="background:${bg}; text-align:center; white-space:nowrap;">${fecha}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Órdenes de Entrega de Material - ${today}</title>
<style>
  @page { size: landscape; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: #fff; padding-bottom: 30px; }

  ${getHTMLPDFStyles()}

  .subtitle { text-align: center; font-size: 13px; font-weight: 700; color: #2d5a3d; margin: 6px 0 10px 0; }

  .stats-bar { display: flex; gap: 24px; margin-bottom: 10px; padding: 8px 14px; background: #f0f7f2; border: 1px solid #c8d6c0; border-radius: 6px; }
  .stat-item { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #4a7c59; }
  .stat-value { font-weight: 700; font-size: 13px; color: #2d5a3d; }

  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th, .data-table td { border: 1px solid #c8d6c0; padding: 5px 8px; text-align: left; font-size: 9px; }
  .data-table th { background: #4a7c59; color: #fff; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; font-size: 8px; }
  .total-row td { background: #2d5a3d; color: #fff; font-weight: 700; font-size: 9.5px; border-color: #2d5a3d; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head><body>

${getHTMLPDFHeader({ title: 'INFORME TÉCNICO', date: formatDatePDF() })}

<div class="subtitle">Órdenes de Entrega de Material</div>

<div class="stats-bar">
  <div class="stat-item"><span>Órdenes:</span> <span class="stat-value">${ordenes.length}</span></div>
  <div class="stat-item"><span>Items totales:</span> <span class="stat-value">${totalItems}</span></div>
  <div class="stat-item"><span>Unidades totales:</span> <span class="stat-value">${totalUnidades}</span></div>
</div>

<table class="data-table">
  <thead>
    <tr>
      <th style="text-align:center; width:70px;">N° Orden</th>
      <th>Obra</th>
      <th>Contratista</th>
      <th>Título</th>
      <th>Sector</th>
      <th style="text-align:center; width:50px;">Piso</th>
      <th style="text-align:center; width:50px;">Depto</th>
      <th style="text-align:center; width:45px;">Items</th>
      <th style="text-align:center; width:55px;">Uds.</th>
      <th style="text-align:center; width:75px;">Fecha</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows}
    <tr class="total-row">
      <td colspan="7" style="text-align:right; padding-right:12px;">TOTAL</td>
      <td style="text-align:center;">${totalItems}</td>
      <td style="text-align:center;">${totalUnidades}</td>
      <td></td>
    </tr>
  </tbody>
</table>

${getHTMLPDFFooter()}

</body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    const logoImg = win.document.querySelector('.header-logo') as HTMLImageElement
    if (logoImg) {
      logoImg.src = window.location.origin + '/araucaria-logo.png'
      logoImg.onload = () => setTimeout(() => win.print(), 300)
      logoImg.onerror = () => setTimeout(() => win.print(), 300)
    } else {
      setTimeout(() => win.print(), 300)
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function SolicitudesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { obras, isLoading: obrasLoading } = useObras()
  const activeObras = useMemo(() => obras.filter((o) => o.estado === 'activa'), [obras])

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
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([])
  const [selectedPisoIds, setSelectedPisoIds] = useState<string[]>([])
  const [selectedDepartamentoIds, setSelectedDepartamentoIds] = useState<string[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchItem, setSearchItem] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fechaEntrega, setFechaEntrega] = useState(() => new Date().toISOString().split('T')[0])

  // ── API data state ──
  const [contratistas, setContratistas] = useState<Contratista[]>([])
  const [contratistasLoading, setContratistasLoading] = useState(false)
  const [catalogItems, setCatalogItems] = useState<ItemDisponible[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [creatingContratista, setCreatingContratista] = useState(false)
  const [sectorizacion, setSectorizacion] = useState<ObraSectorizacion | null>(null)
  const [sectorizacionLoading, setSectorizacionLoading] = useState(false)

  // ── Historial state ──
  const [ordenes, setOrdenes] = useState<OrdenEntrega[]>([])
  const [ordenesLoading, setOrdenesLoading] = useState(false)
  const [searchHistorial, setSearchHistorial] = useState('')
  const [filterObra, setFilterObra] = useState('')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // ── Derived ──
  const selectedObra = activeObras.find((o) => o.id === selectedObraId)
  const currentStepIdx = FORM_STEPS.indexOf(formStep)

  // ── Fetch contratistas ──
  const fetchContratistas = useCallback(async () => {
    setContratistasLoading(true)
    try {
      const res = await solicitudesService.getContratistas()
      setContratistas(res.data)
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al cargar contratistas'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setContratistasLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchContratistas()
  }, [fetchContratistas])

  // ── Fetch catalog items when reaching materials step ──
  const fetchCatalogItems = useCallback(async () => {
    setCatalogLoading(true)
    try {
      const res = await solicitudesService.getItemsDisponibles(
        selectedObraId ? { obraId: selectedObraId } : undefined,
      )
      setCatalogItems(res.data)
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al cargar materiales'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setCatalogLoading(false)
    }
  }, [toast, selectedObraId])

  useEffect(() => {
    if (formStep === 'materiales') {
      fetchCatalogItems()
    }
  }, [formStep, fetchCatalogItems])

  // ── Fetch sectorización for selected obra ──
  const fetchSectorizacion = useCallback(async (obraId: string) => {
    setSectorizacionLoading(true)
    setSectorizacion(null)
    setSelectedSectorIds([])
    setSelectedPisoIds([])
    setSelectedDepartamentoIds([])
    try {
      const res = await sectorizacionService.getAll()
      const match = res.data.find((s) => s.obra_id === obraId && s.estado === 'activa')
      setSectorizacion(match ?? null)
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al cargar sectorización'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setSectorizacionLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (selectedObraId) {
      fetchSectorizacion(selectedObraId)
    } else {
      setSectorizacion(null)
    }
  }, [selectedObraId, fetchSectorizacion])

  // ── Derived sectorización data ──
  const availableSectores = sectorizacion?.sectores ?? []
  const availablePisos = sectorizacion?.pisos ?? []
  const availableDepartamentos = useMemo(() => {
    if (selectedPisoIds.length === 0) return []
    return availablePisos
      .filter((p) => selectedPisoIds.includes(p.id))
      .flatMap((p) => p.departamentos)
      .filter((d) => selectedSectorIds.length === 0 || selectedSectorIds.some((sid) => {
        const sector = availableSectores.find((s) => s.id === sid)
        return sector && d.sector_numero === sector.numero
      }))
  }, [availablePisos, availableSectores, selectedPisoIds, selectedSectorIds])

  // ── Compose location strings from selections ──
  const composedSector = useMemo(() =>
    availableSectores.filter((s) => selectedSectorIds.includes(s.id)).map((s) => s.nombre).join(', '),
    [availableSectores, selectedSectorIds]
  )
  const composedPiso = useMemo(() =>
    availablePisos.filter((p) => selectedPisoIds.includes(p.id)).map((p) => p.nombre).join(', '),
    [availablePisos, selectedPisoIds]
  )
  const composedDepartamento = useMemo(() =>
    availableDepartamentos.filter((d) => selectedDepartamentoIds.includes(d.id)).map((d) => d.letra).join(', '),
    [availableDepartamentos, selectedDepartamentoIds]
  )

  // ── Fetch historial ──
  const fetchOrdenes = useCallback(async () => {
    setOrdenesLoading(true)
    try {
      const res = await solicitudesService.getAll({
        pageSize: 50,
        obraId: filterObra || undefined,
        fechaDesde: filterFechaDesde || undefined,
        fechaHasta: filterFechaHasta || undefined,
      })
      setOrdenes(res.data)
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al cargar historial'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setOrdenesLoading(false)
    }
  }, [filterObra, filterFechaDesde, filterFechaHasta, toast])

  useEffect(() => {
    if (mainView === 'historial') {
      fetchOrdenes()
    }
  }, [mainView, fetchOrdenes])

  // ── Filtered contratistas (client-side search) ──
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

  // ── Filtered catalog items ──
  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      const matchSearch =
        !searchItem ||
        item.codigo_fab.toLowerCase().includes(searchItem.toLowerCase()) ||
        item.descripcion.toLowerCase().includes(searchItem.toLowerCase())
      return matchSearch && item.cantidad > 0
    })
  }, [catalogItems, searchItem])

  // ── Client-side search on historial ──
  const filteredOrdenes = useMemo(() => {
    if (!searchHistorial.trim()) return ordenes
    return ordenes.filter((o) =>
      o.contratista_nombre.toLowerCase().includes(searchHistorial.toLowerCase()) ||
      o.numero_orden.toLowerCase().includes(searchHistorial.toLowerCase()) ||
      o.titulo.toLowerCase().includes(searchHistorial.toLowerCase()) ||
      o.items.some(
        (it) =>
          it.codigo_fab.toLowerCase().includes(searchHistorial.toLowerCase()) ||
          it.descripcion.toLowerCase().includes(searchHistorial.toLowerCase())
      )
    )
  }, [ordenes, searchHistorial])

  // ── Cart operations ──
  const addToCart = (item: ItemDisponible) => {
    const existing = cart.find((c) => c.id === item.id)
    if (existing) {
      if (existing.cantidad < existing.stock_disponible) {
        setCart(cart.map((c) =>
          c.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c
        ))
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
      case 'detalles': return !!titulo.trim()
      case 'ubicacion': return selectedSectorIds.length > 0 && selectedPisoIds.length > 0
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

  // ── Submit order (real API) ──
  const handleSubmit = async () => {
    if (!selectedContratista || !selectedObra || isSubmitting) return

    setIsSubmitting(true)
    try {
      await solicitudesService.create({
        obraId: selectedObraId,
        contratistaId: selectedContratista.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        sector: composedSector,
        piso: composedPiso,
        departamento: composedDepartamento || undefined,
        items: cart.map((c) => ({ itemId: c.id, cantidad: c.cantidad })),
        fechaEntrega: fechaEntrega || undefined,
      })
      const esPasada = fechaEntrega && fechaEntrega < new Date().toISOString().split('T')[0]
      toast({
        title: esPasada ? 'Orden pendiente de aprobación' : 'Orden registrada',
        description: esPasada
          ? 'La fecha es anterior a hoy, se envió a aprobaciones para su revisión'
          : 'La orden de entrega fue creada exitosamente',
      })
      setSubmitted(true)
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al crear la orden'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormStep('obra')
    setSelectedObraId('')
    setSelectedContratista(null)
    setSearchContratista('')
    setTitulo('')
    setDescripcion('')
    setSelectedSectorIds([])
    setSelectedPisoIds([])
    setSelectedDepartamentoIds([])
    setSectorizacion(null)
    setCart([])
    setSearchItem('')
    setFechaEntrega(new Date().toISOString().split('T')[0])
    setSubmitted(false)
  }

  // ── New contratista (real API) ──
  const handleCreateContratista = async () => {
    if (!newContratistaNombre.trim() || creatingContratista) return

    setCreatingContratista(true)
    try {
      const res = await solicitudesService.createContratista({
        nombre: newContratistaNombre.trim(),
        empresa: '—',
        telefono: newContratistaTelefono.trim() || undefined,
        obraId: selectedObraId || undefined,
      })
      const nuevo = res.data
      setContratistas([nuevo, ...contratistas])
      setSelectedContratista(nuevo)
      setNewContratistaNombre('')
      setNewContratistaTelefono('')
      setShowNewContratista(false)
      toast({ title: 'Contratista creado', description: `${nuevo.nombre} fue registrado` })
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al crear contratista'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setCreatingContratista(false)
    }
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
                  {obrasLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                      <span className="ml-2 text-sm text-muted-foreground">Cargando obras...</span>
                    </div>
                  ) : activeObras.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No hay obras activas disponibles</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeObras.map((obra) => (
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
                  )}
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
                      {contratistasLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-accent" />
                          <span className="ml-2 text-sm text-muted-foreground">Cargando contratistas...</span>
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
                        </>
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
                                disabled={!newContratistaNombre.trim() || creatingContratista}
                                className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white text-sm rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {creatingContratista && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
                    <h2 className="text-lg font-bold text-foreground">Detalles de la Orden</h2>
                    <p className="text-sm text-muted-foreground mt-1">Indica el título y una descripción opcional</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Título de la Orden *</label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej: Entrega de materiales Piso 3"
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
                    <p className="text-sm text-muted-foreground mt-1">Selecciona sector, piso y departamento(s) de la sectorización de la obra</p>
                  </div>

                  {sectorizacionLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                      <span className="ml-2 text-sm text-muted-foreground">Cargando sectorización...</span>
                    </div>
                  ) : !sectorizacion ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No se encontró una sectorización activa para esta obra.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Primero debes crear la sectorización en la sección correspondiente.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Sector picker */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Sector(es) *</label>
                        <div className="flex flex-wrap gap-2">
                          {availableSectores.map((s) => {
                            const isSelected = selectedSectorIds.includes(s.id)
                            return (
                              <button
                                key={s.id}
                                onClick={() => {
                                  setSelectedSectorIds(
                                    isSelected
                                      ? selectedSectorIds.filter((id) => id !== s.id)
                                      : [...selectedSectorIds, s.id]
                                  )
                                  // Reset departamentos when sectors change
                                  setSelectedDepartamentoIds([])
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-border hover:border-accent/40 text-foreground hover:bg-border/20'
                                }`}
                              >
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: s.color }}
                                />
                                {s.nombre}
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </button>
                            )
                          })}
                        </div>
                        {availableSectores.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">No hay sectores definidos.</p>
                        )}
                      </div>

                      {/* Piso picker */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Piso(s) *</label>
                        <div className="flex flex-wrap gap-2">
                          {availablePisos.map((p) => {
                            const isSelected = selectedPisoIds.includes(p.id)
                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  const newPisos = isSelected
                                    ? selectedPisoIds.filter((id) => id !== p.id)
                                    : [...selectedPisoIds, p.id]
                                  setSelectedPisoIds(newPisos)
                                  // Reset departamentos when pisos change
                                  setSelectedDepartamentoIds([])
                                }}
                                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-border hover:border-accent/40 text-foreground hover:bg-border/20'
                                }`}
                              >
                                {p.nombre}
                                {isSelected && <Check className="w-3.5 h-3.5 ml-1.5 inline" />}
                              </button>
                            )
                          })}
                        </div>
                        {availablePisos.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">No hay pisos definidos.</p>
                        )}
                      </div>

                      {/* Departamento picker (optional, appears when pisos selected) */}
                      {availableDepartamentos.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Departamento(s) <span className="text-muted-foreground font-normal">(opcional)</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {availableDepartamentos.map((d) => {
                              const isSelected = selectedDepartamentoIds.includes(d.id)
                              const sectorColor = availableSectores.find((s) => s.numero === d.sector_numero)?.color
                              return (
                                <button
                                  key={d.id}
                                  onClick={() =>
                                    setSelectedDepartamentoIds(
                                      isSelected
                                        ? selectedDepartamentoIds.filter((id) => id !== d.id)
                                        : [...selectedDepartamentoIds, d.id]
                                    )
                                  }
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                    isSelected
                                      ? 'border-accent bg-accent/10 text-accent'
                                      : 'border-border hover:border-accent/40 text-foreground hover:bg-border/20'
                                  }`}
                                >
                                  {sectorColor && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: sectorColor }}
                                    />
                                  )}
                                  Depto {d.letra}
                                  {d.nombre ? ` — ${d.nombre}` : ''}
                                  {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Location preview */}
                      {(selectedSectorIds.length > 0 || selectedPisoIds.length > 0) && (
                        <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/20 rounded-xl">
                          <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                          <span className="text-sm text-foreground">
                            {[composedSector, composedPiso, composedDepartamento].filter(Boolean).join(' → ')}
                          </span>
                        </div>
                      )}
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

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por código, nombre o descripción..."
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  {/* Split: items grid + cart */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Item catalog */}
                    <div className="lg:col-span-3 space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {catalogLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-accent" />
                          <span className="ml-2 text-sm text-muted-foreground">Cargando materiales...</span>
                        </div>
                      ) : filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          No se encontraron materiales disponibles
                        </div>
                      ) : (
                        filteredItems.map((item) => {
                          const inCart = cart.find((c) => c.id === item.id)
                          return (
                            <div
                              key={`${item.id}-${item.almacen_id}`}
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
                        })
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
                        {descripcion && <p className="text-xs text-muted-foreground mt-1">{descripcion}</p>}
                      </div>

                      <div className="bg-border/10 border border-border rounded-xl p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-accent" /> Ubicación
                        </h3>
                        <p className="text-sm text-foreground">
                          {[composedSector, composedPiso, composedDepartamento].filter(Boolean).join(' → ')}
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

                    {/* Fecha de entrega */}
                    <div className="md:col-span-2">
                      <div className="bg-border/10 border border-border rounded-xl p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-accent" /> Fecha de Entrega
                        </h3>
                        <input
                          type="date"
                          value={fechaEntrega}
                          onChange={(e) => setFechaEntrega(e.target.value)}
                          className="w-full sm:w-auto px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        {fechaEntrega && fechaEntrega < new Date().toISOString().split('T')[0] && (
                          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg px-3 py-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p className="text-xs leading-relaxed">
                              La fecha seleccionada es anterior a hoy. Esta orden será enviada a <strong>aprobaciones</strong> para su revisión antes de descontar stock.
                            </p>
                          </div>
                        )}
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
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Procesando...' : 'Confirmar Orden'}
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
                    disabled={filteredOrdenes.length === 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-border/30 transition-colors disabled:opacity-40"
                    title="Exportar a Excel/CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <button
                    onClick={() => exportToPDF(filteredOrdenes)}
                    disabled={filteredOrdenes.length === 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-border/30 transition-colors disabled:opacity-40"
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
                      {obras.map((o) => (
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

            {/* Loading */}
            {ordenesLoading ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Cargando órdenes...</p>
              </div>
            ) : filteredOrdenes.length === 0 ? (
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
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-border p-4 bg-border/5 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Departamento</p>
                              <p className="text-sm text-foreground font-medium mt-0.5">{orden.departamento || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total Unidades</p>
                              <p className="text-sm text-foreground font-medium mt-0.5">{orden.total_unidades}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total Items</p>
                              <p className="text-sm text-foreground font-medium mt-0.5">{orden.total_items}</p>
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
