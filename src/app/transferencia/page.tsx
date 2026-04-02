'use client'

import { useState, useEffect, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { useAlmacenes } from '@/hooks/use-almacenes'
import { inventarioService, transferenciasService } from '@/services'
import type { AlmacenItemResponse } from '@/services'
import { ArrowRight, ArrowLeft, Upload, Send, Loader2, Check, Minus, Plus, X, Search, ChevronDown, Package } from 'lucide-react'
import type { ItemInventario } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? ''

function getItemImage(item: ItemInventario): string {
  if (item.foto_url) return `${API_BASE}${item.foto_url}`
  const d = ((item.descripcion ?? '') + ' ' + item.codigo).toLowerCase()
  if (d.includes('porcelanato') || d.includes('mosaico') || d.includes('cristal')) return '/items/porcelanato.jpg'
  if (d.includes('puerta') || d.includes('door') || d.includes('flush')) return '/items/puerta.jpg'
  if (d.includes('piso') || d.includes('laminado') || d.includes('underlayment')) return '/items/piso-laminado.jpg'
  if (d.includes('extractor') || d.includes('encimera') || d.includes('horno') || d.includes('microonda')) return '/items/electrodomestico.jpg'
  return '/items/material-general.jpg'
}

type Step = 'almacenes' | 'items' | 'evidencia' | 'confirmacion'
const STEPS: Step[] = ['almacenes', 'items', 'evidencia', 'confirmacion']
const STEP_LABELS = ['Almacenes', 'Ítems', 'Evidencia', 'Confirmar']

interface AllocatedItem {
  itemId: string
  codigo: string
  nombre: string | null
  descripcion: string | null
  unidad: string
  fotoUrl: string
  stockOrigen: number
  allocations: { almacenDestinoId: string; cantidad: number }[]
}

export default function TransferenciaPage() {
  const { almacenes } = useAlmacenes()
  const [step, setStep] = useState<Step>('almacenes')

  // Step 1
  const [almacenOrigenId, setAlmacenOrigenId] = useState('')
  const [destinoIds, setDestinoIds] = useState<Set<string>>(new Set())

  // Step 2
  const [originItems, setOriginItems] = useState<AlmacenItemResponse[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [allocatedItems, setAllocatedItems] = useState<AllocatedItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedDestinos, setCollapsedDestinos] = useState<Set<string>>(new Set())

  // Step 3
  const [observaciones, setObservaciones] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const activeAlmacenes = useMemo(() => almacenes.filter((a) => a.estado === 'activo'), [almacenes])
  const destinosArr = useMemo(() => {
    const selected = activeAlmacenes.filter((a) => destinoIds.has(a.id))
    return selected.sort((a, b) => {
      if (a.tipo_almacen === 'fijo' && b.tipo_almacen !== 'fijo') return -1
      if (a.tipo_almacen !== 'fijo' && b.tipo_almacen === 'fijo') return 1
      const obraA = a.obra_nombre ?? ''
      const obraB = b.obra_nombre ?? ''
      if (obraA !== obraB) return obraA.localeCompare(obraB)
      return a.nombre.localeCompare(b.nombre)
    })
  }, [activeAlmacenes, destinoIds])
  const origenAlmacen = activeAlmacenes.find((a) => a.id === almacenOrigenId)

  const almacenLabel = (alm: typeof activeAlmacenes[number]) =>
    alm.tipo_almacen === 'obra' && alm.obra_nombre ? `${alm.nombre} — ${alm.obra_nombre}` : alm.nombre

  // Fetch items when origin changes
  useEffect(() => {
    if (!almacenOrigenId) { setOriginItems([]); return }
    let cancelled = false
    setLoadingItems(true)
    inventarioService.getByAlmacen(almacenOrigenId).then((res) => {
      if (!cancelled) {
        setOriginItems(res.data.filter((ai) => ai.cantidad > 0))
        setLoadingItems(false)
      }
    }).catch(() => {
      if (!cancelled) setLoadingItems(false)
    })
    return () => { cancelled = true }
  }, [almacenOrigenId])

  // Reset allocations when origin changes
  useEffect(() => { setAllocatedItems([]) }, [almacenOrigenId])

  const filteredOriginItems = useMemo(() => {
    if (!searchTerm.trim()) return originItems
    const term = searchTerm.toLowerCase()
    return originItems.filter((ai) => {
      const item = ai.item
      return (
        (item?.codigo ?? '').toLowerCase().includes(term) ||
        (item?.nombre ?? '').toLowerCase().includes(term) ||
        (item?.descripcion ?? '').toLowerCase().includes(term)
      )
    })
  }, [originItems, searchTerm])

  const toggleCollapseDestino = (id: string) => {
    setCollapsedDestinos((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleDestino = (id: string) => {
    setDestinoIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addItemToAllocate = (ai: AlmacenItemResponse) => {
    if (allocatedItems.find((a) => a.itemId === ai.item_id)) return
    const item = ai.item
    setAllocatedItems((prev) => [
      ...prev,
      {
        itemId: ai.item_id,
        codigo: item?.codigo ?? '—',
        nombre: item?.nombre ?? null,
        descripcion: item?.descripcion ?? null,
        unidad: item?.unidad ?? 'pza',
        fotoUrl: item ? getItemImage(item) : '/items/material-general.jpg',
        stockOrigen: ai.cantidad,
        allocations: Array.from(destinoIds).map((did) => ({ almacenDestinoId: did, cantidad: 0 })),
      },
    ])
  }

  const removeAllocatedItem = (itemId: string) => {
    setAllocatedItems((prev) => prev.filter((a) => a.itemId !== itemId))
  }

  const setAllocation = (itemId: string, almacenDestinoId: string, cantidad: number) => {
    setAllocatedItems((prev) =>
      prev.map((a) => {
        if (a.itemId !== itemId) return a
        const otherTotal = a.allocations
          .filter((al) => al.almacenDestinoId !== almacenDestinoId)
          .reduce((s, al) => s + al.cantidad, 0)
        const maxForThis = a.stockOrigen - otherTotal
        const clamped = Math.max(0, Math.min(cantidad, maxForThis))
        return {
          ...a,
          allocations: a.allocations.map((al) =>
            al.almacenDestinoId === almacenDestinoId ? { ...al, cantidad: clamped } : al,
          ),
        }
      }),
    )
  }

  const totalAllocated = (item: AllocatedItem) => item.allocations.reduce((s, al) => s + al.cantidad, 0)
  const itemsWithAllocations = allocatedItems.filter((a) => totalAllocated(a) > 0)

  const canProceed = (): boolean => {
    if (step === 'almacenes') return !!almacenOrigenId && destinoIds.size > 0
    if (step === 'items') return itemsWithAllocations.length > 0
    if (step === 'evidencia') return true
    return false
  }

  const goNext = () => { const idx = STEPS.indexOf(step); if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]) }
  const goBack = () => { const idx = STEPS.indexOf(step); if (idx > 0) setStep(STEPS[idx - 1]) }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const flatItems = itemsWithAllocations.flatMap((a) =>
        a.allocations.filter((al) => al.cantidad > 0).map((al) => ({
          almacenDestinoId: al.almacenDestinoId,
          itemId: a.itemId,
          cantidad: al.cantidad,
        })),
      )
      const res = await transferenciasService.create({
        almacenOrigenId,
        items: flatItems,
        observaciones: observaciones || undefined,
      })
      if (archivo && res.data?.id) {
        await transferenciasService.uploadEvidencia(res.data.id, archivo)
      }
      setDone(true)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear la transferencia')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep('almacenes')
    setAlmacenOrigenId('')
    setDestinoIds(new Set())
    setOriginItems([])
    setAllocatedItems([])
    setObservaciones('')
    setArchivo(null)
    setSearchTerm('')
    setCollapsedDestinos(new Set())
    setDone(false)
    setSubmitError('')
  }

  const stepIdx = STEPS.indexOf(step)

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Transferencia de Materiales</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Transfiere materiales entre almacenes</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STEPS.map((s, idx) => (
            <div key={s} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                  done ? 'bg-green-500 text-white' :
                  step === s ? 'bg-accent text-background' :
                  stepIdx > idx ? 'bg-green-500 text-white' :
                  'bg-border text-muted-foreground'
                }`}>
                  {done || stepIdx > idx ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">{STEP_LABELS[idx]}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${done || stepIdx > idx ? 'bg-green-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Done state */}
        {done && (
          <div className="bg-card border border-green-500/30 rounded-lg p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Transferencia Completada</h2>
            <p className="text-muted-foreground">Los materiales han sido transferidos correctamente</p>
            <button onClick={handleReset} className="px-6 py-3 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium">
              Nueva Transferencia
            </button>
          </div>
        )}

        {/* Step 1: Origin + Destinations */}
        {!done && step === 'almacenes' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Almacén de Origen</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeAlmacenes.map((alm) => (
                  <button
                    key={alm.id}
                    onClick={() => { setAlmacenOrigenId(alm.id); setDestinoIds((prev) => { const n = new Set(prev); n.delete(alm.id); return n }) }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      almacenOrigenId === alm.id ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <p className="font-bold text-foreground text-sm">{alm.nombre}</p>
                    {alm.tipo_almacen === 'obra' && alm.obra_nombre && (
                      <p className="text-xs text-accent mt-0.5">{alm.obra_nombre}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{alm.tipo_almacen === 'fijo' ? 'Almacén fijo' : 'Obra'} — {alm.items_count} ítems</p>
                  </button>
                ))}
              </div>
            </div>

            {almacenOrigenId && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <h2 className="text-lg font-bold text-foreground mb-2">Almacenes de Destino</h2>
                <p className="text-sm text-muted-foreground mb-4">Selecciona uno o más destinos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeAlmacenes.filter((a) => a.id !== almacenOrigenId).map((alm) => (
                    <button
                      key={alm.id}
                      onClick={() => toggleDestino(alm.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        destinoIds.has(alm.id) ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <p className="font-bold text-foreground text-sm">{alm.nombre}</p>
                      {alm.tipo_almacen === 'obra' && alm.obra_nombre && (
                        <p className="text-xs text-accent mt-0.5">{alm.obra_nombre}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{alm.tipo_almacen === 'fijo' ? 'Almacén fijo' : 'Obra'} — {alm.items_count} ítems</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Allocate quantities — Two-panel layout */}
        {!done && step === 'items' && (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* LEFT PANEL — Origin Stock */}
            <div className="w-full lg:w-1/2 bg-card border border-border rounded-lg p-4 sm:p-5 flex flex-col max-h-[75vh]">
              <h2 className="text-lg font-bold text-foreground mb-3">Stock en {origenAlmacen?.nombre ?? 'origen'}</h2>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por código, nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
                  </div>
                ) : filteredOriginItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {originItems.length === 0 ? 'No hay ítems con stock en este almacén.' : 'No se encontraron ítems.'}
                  </p>
                ) : (
                  filteredOriginItems.map((ai) => {
                    const isAdded = allocatedItems.some((a) => a.itemId === ai.item_id)
                    const allocated = allocatedItems.find((a) => a.itemId === ai.item_id)
                    const remaining = allocated ? ai.cantidad - totalAllocated(allocated) : ai.cantidad
                    const imgSrc = ai.item ? getItemImage(ai.item) : '/items/material-general.jpg'
                    return (
                      <button
                        key={ai.id}
                        onClick={() => addItemToAllocate(ai)}
                        disabled={isAdded}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          isAdded
                            ? remaining === 0
                              ? 'border-red-500/30 bg-red-500/5 opacity-50 cursor-not-allowed'
                              : 'border-accent/50 bg-accent/5 opacity-70 cursor-default'
                            : 'border-border hover:border-accent hover:bg-accent/5'
                        }`}
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-background border border-border shrink-0">
                          <img src={imgSrc} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/items/material-general.jpg' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">{ai.item?.codigo ?? '—'}</p>
                          <p className="text-sm font-medium text-foreground line-clamp-2">{ai.item?.descripcion ?? ai.item?.nombre ?? '—'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ai.item?.unidad ?? ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${isAdded && remaining === 0 ? 'text-red-400' : 'text-accent'}`}>
                            {isAdded ? remaining : ai.cantidad}
                          </p>
                          <p className="text-xs text-muted-foreground">disp.</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANEL — Destination Warehouses */}
            <div className="w-full lg:w-1/2 flex flex-col max-h-[75vh] overflow-y-auto space-y-3 pr-1">
              {allocatedItems.length === 0 ? (
                <div className="bg-card border border-border border-dashed rounded-lg p-8 flex items-center justify-center h-full min-h-[200px]">
                  <p className="text-sm text-muted-foreground text-center">
                    Selecciona ítems del panel izquierdo para asignar cantidades a los almacenes de destino
                  </p>
                </div>
              ) : (
                destinosArr.map((dest) => {
                  const isCollapsed = collapsedDestinos.has(dest.id)
                  const itemsWithQty = allocatedItems.filter((a) => {
                    const al = a.allocations.find((al) => al.almacenDestinoId === dest.id)
                    return al && al.cantidad > 0
                  }).length
                  return (
                    <div key={dest.id} className="bg-card border border-border rounded-lg">
                      <button
                        onClick={() => toggleCollapseDestino(dest.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-foreground truncate">{dest.nombre}</h3>
                            {dest.tipo_almacen === 'obra' && dest.obra_nombre && (
                              <p className="text-xs text-accent truncate">{dest.obra_nombre}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({itemsWithQty} {itemsWithQty === 1 ? 'ítem' : 'ítems'})
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isCollapsed ? '' : 'rotate-180'}`} />
                      </button>

                      {!isCollapsed && (
                        <div className="px-4 pb-4 space-y-2">
                          {allocatedItems.map((item) => {
                            const alloc = item.allocations.find((al) => al.almacenDestinoId === dest.id)
                            const cant = alloc?.cantidad ?? 0
                            const remaining = item.stockOrigen - totalAllocated(item)
                            return (
                              <div key={item.itemId} className="flex items-center gap-2 bg-background border border-border rounded-lg p-2">
                                <div className="w-9 h-9 rounded overflow-hidden bg-border shrink-0">
                                  <img src={item.fotoUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/items/material-general.jpg' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">{item.descripcion ?? item.nombre ?? '—'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-mono">{item.codigo}</span> · Restante: <span className={remaining === 0 && cant === 0 ? 'text-red-400' : 'text-accent'}>{remaining}</span> {item.unidad}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={() => setAllocation(item.itemId, dest.id, cant - 1)} className="p-1 rounded bg-border hover:bg-accent/20">
                                    <Minus className="w-3 h-3 text-foreground" />
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    max={item.stockOrigen}
                                    value={cant}
                                    onChange={(e) => setAllocation(item.itemId, dest.id, parseInt(e.target.value) || 0)}
                                    className="w-14 px-1 py-1 bg-background border border-border rounded text-sm text-center text-foreground"
                                  />
                                  <button onClick={() => setAllocation(item.itemId, dest.id, cant + 1)} className="p-1 rounded bg-border hover:bg-accent/20">
                                    <Plus className="w-3 h-3 text-foreground" />
                                  </button>
                                </div>
                                <button onClick={() => removeAllocatedItem(item.itemId)} className="p-1 hover:bg-red-500/20 rounded text-red-400 shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Step 3: Evidence */}
        {!done && step === 'evidencia' && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-foreground">Evidencia y Observaciones</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Observaciones (opcional)</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Motivo de la transferencia..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Adjuntar evidencia (opcional)</label>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">{archivo ? archivo.name : 'PDF, JPG o PNG (máx. 10 MB)'}</span>
                </div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {!done && step === 'confirmacion' && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-foreground">Resumen de Transferencia</h2>

            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Origen</p>
              <p className="font-bold text-foreground">{origenAlmacen?.nombre}</p>
            </div>

            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Destino(s)</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {destinosArr.map((d) => (
                  <span key={d.id} className="px-2 py-1 rounded bg-accent/20 text-accent text-sm font-medium">
                    {almacenLabel(d)}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-3">Ítems a transferir por destino</p>
              <div className="space-y-4">
                {destinosArr.map((dest) => {
                  const destItems = itemsWithAllocations
                    .map((item) => {
                      const al = item.allocations.find((a) => a.almacenDestinoId === dest.id)
                      return al && al.cantidad > 0 ? { ...item, cantDest: al.cantidad } : null
                    })
                    .filter(Boolean) as (AllocatedItem & { cantDest: number })[]
                  if (destItems.length === 0) return null
                  return (
                    <div key={dest.id} className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-accent/5 px-4 py-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <div>
                          <p className="text-sm font-bold text-foreground">{dest.nombre}</p>
                          {dest.tipo_almacen === 'obra' && dest.obra_nombre && (
                            <p className="text-xs text-accent">{dest.obra_nombre}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto">{destItems.length} {destItems.length === 1 ? 'ítem' : 'ítems'}</span>
                      </div>
                      <div className="divide-y divide-border">
                        {destItems.map((item) => (
                          <div key={item.itemId} className="px-4 py-2.5 flex items-center gap-3">
                            <div className="w-9 h-9 rounded overflow-hidden bg-border shrink-0">
                              <img src={item.fotoUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/items/material-general.jpg' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-xs text-muted-foreground">{item.codigo}</p>
                              <p className="text-sm font-medium text-foreground truncate">{item.descripcion ?? item.nombre ?? '—'}</p>
                            </div>
                            <p className="text-sm font-bold text-accent shrink-0">{item.cantDest} {item.unidad}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {observaciones && (
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
                <p className="text-sm text-foreground">{observaciones}</p>
              </div>
            )}
            {archivo && (
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Evidencia</p>
                <p className="text-sm text-foreground">{archivo.name}</p>
              </div>
            )}

            {submitError && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{submitError}</div>
            )}
          </div>
        )}

        {/* Navigation */}
        {!done && (
          <div className="flex gap-3 justify-end flex-wrap">
            {stepIdx > 0 && (
              <button
                onClick={goBack}
                className="px-6 py-3 bg-border text-foreground rounded-lg hover:bg-border/80 transition-colors font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Atrás
              </button>
            )}
            {step !== 'confirmacion' ? (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="px-6 py-3 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Procesando...' : 'Completar Transferencia'}
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
