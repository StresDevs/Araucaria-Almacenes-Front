'use client'

import { useState, useEffect, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { useAlmacenes } from '@/hooks/use-almacenes'
import { inventarioService, transferenciasService } from '@/services'
import type { AlmacenItemResponse } from '@/services'
import { ArrowRight, ArrowLeft, Upload, Send, Loader2, Check, Minus, Plus, X } from 'lucide-react'

type Step = 'almacenes' | 'items' | 'evidencia' | 'confirmacion'
const STEPS: Step[] = ['almacenes', 'items', 'evidencia', 'confirmacion']
const STEP_LABELS = ['Almacenes', 'Ítems', 'Evidencia', 'Confirmar']

interface AllocatedItem {
  itemId: string
  codigo: string
  nombre: string | null
  descripcion: string | null
  unidad: string
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

  // Step 3
  const [observaciones, setObservaciones] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const activeAlmacenes = useMemo(() => almacenes.filter((a) => a.estado === 'activo'), [almacenes])
  const destinosArr = useMemo(() => activeAlmacenes.filter((a) => destinoIds.has(a.id)), [activeAlmacenes, destinoIds])
  const origenAlmacen = activeAlmacenes.find((a) => a.id === almacenOrigenId)

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
                      <p className="text-xs text-muted-foreground mt-1">{alm.tipo_almacen === 'fijo' ? 'Almacén fijo' : 'Obra'}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Allocate quantities */}
        {!done && step === 'items' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Ítems disponibles en {origenAlmacen?.nombre ?? 'origen'}</h2>
              {loadingItems ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
                </div>
              ) : originItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No hay ítems con stock en este almacén.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {originItems.map((ai) => {
                    const isAdded = allocatedItems.some((a) => a.itemId === ai.item_id)
                    return (
                      <button
                        key={ai.id}
                        onClick={() => addItemToAllocate(ai)}
                        disabled={isAdded}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isAdded ? 'border-accent/50 bg-accent/5 opacity-60' : 'border-border hover:border-accent'
                        }`}
                      >
                        <p className="font-mono text-xs text-muted-foreground">{ai.item?.codigo ?? '—'}</p>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{ai.item?.descripcion ?? ai.item?.nombre ?? '—'}</p>
                        <p className="text-xs text-accent mt-1">Stock: {ai.cantidad} {ai.item?.unidad ?? ''}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {allocatedItems.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Asignar cantidades por destino</h2>
                <div className="space-y-4">
                  {allocatedItems.map((item) => (
                    <div key={item.itemId} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{item.codigo}</p>
                          <p className="text-sm font-medium text-foreground">{item.descripcion ?? item.nombre ?? '—'}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Stock: {item.stockOrigen} {item.unidad} | Asignado: {totalAllocated(item)} | Restante: {item.stockOrigen - totalAllocated(item)}
                          </p>
                        </div>
                        <button onClick={() => removeAllocatedItem(item.itemId)} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {destinosArr.map((dest) => {
                          const alloc = item.allocations.find((al) => al.almacenDestinoId === dest.id)
                          const cant = alloc?.cantidad ?? 0
                          return (
                            <div key={dest.id} className="flex items-center gap-2 bg-background border border-border rounded-lg p-2">
                              <span className="text-xs text-foreground flex-1 truncate">{dest.nombre}</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setAllocation(item.itemId, dest.id, cant - 1)} className="p-1 rounded bg-border hover:bg-accent/20">
                                  <Minus className="w-3 h-3 text-foreground" />
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={item.stockOrigen}
                                  value={cant}
                                  onChange={(e) => setAllocation(item.itemId, dest.id, parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 bg-background border border-border rounded text-sm text-center text-foreground"
                                />
                                <button onClick={() => setAllocation(item.itemId, dest.id, cant + 1)} className="p-1 rounded bg-border hover:bg-accent/20">
                                  <Plus className="w-3 h-3 text-foreground" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  <span key={d.id} className="px-2 py-1 rounded bg-accent/20 text-accent text-sm font-medium">{d.nombre}</span>
                ))}
              </div>
            </div>

            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">Ítems a transferir</p>
              <div className="space-y-3">
                {itemsWithAllocations.map((item) => (
                  <div key={item.itemId} className="border border-border rounded-lg p-3">
                    <p className="font-mono text-xs text-muted-foreground">{item.codigo}</p>
                    <p className="text-sm font-medium text-foreground">{item.descripcion ?? item.nombre ?? '—'}</p>
                    <div className="mt-2 space-y-1">
                      {item.allocations.filter((al) => al.cantidad > 0).map((al) => {
                        const dest = destinosArr.find((d) => d.id === al.almacenDestinoId)
                        return (
                          <p key={al.almacenDestinoId} className="text-xs text-muted-foreground">
                            → {dest?.nombre}: <span className="font-bold text-accent">{al.cantidad} {item.unidad}</span>
                          </p>
                        )
                      })}
                    </div>
                  </div>
                ))}
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
