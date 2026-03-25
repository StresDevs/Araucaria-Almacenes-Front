'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { MOCK_ALMACENES_EXTERNOS, MOCK_ALMACENES_OBRA } from '@/lib/constants'
import { ArrowRight, Upload, Send, Package, Plus, Minus } from 'lucide-react'
import Image from 'next/image'

interface ItemCard {
  id: string
  codigo: string
  descripcion: string
  cantidad_disponible: number
  unidad: string
  imagen: string
}

export default function TransferenciaPage() {
  const allWarehouses = [...MOCK_ALMACENES_EXTERNOS, ...MOCK_ALMACENES_OBRA]
  
  const [step, setStep] = useState<'origen' | 'items' | 'destino' | 'evidencia' | 'confirmacion'>('origen')
  const [almacenOrigen, setAlmacenOrigen] = useState<string>('')
  const [almacenDestino, setAlmacenDestino] = useState<string>('')
  const [selectedItems, setSelectedItems] = useState<{ id: string; cantidad: number }[]>([])
  const [notas, setNotas] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [cantidades, setCantidades] = useState<{ [key: string]: number }>({})

  // Mock items disponibles en almacén origen con imágenes
  const itemsDisponibles: ItemCard[] = [
    { id: '1', codigo: 'SKF-6205-2RS', descripcion: 'Rodamiento de bolas profundo', cantidad_disponible: 50, unidad: 'Pieza', imagen: '/material-rodamiento.jpg' },
    { id: '2', codigo: 'CEMENTO-50KG', descripcion: 'Cemento gris Portland tipo I', cantidad_disponible: 200, unidad: 'Bolsa', imagen: '/material-cemento.jpg' },
    { id: '3', codigo: 'ACERO-CORR-8MM', descripcion: 'Acero corrugado grado 60', cantidad_disponible: 450, unidad: 'Kg', imagen: '/material-acero.jpg' },
    { id: '4', codigo: 'HILTI-TE-30', descripcion: 'Taladro perforador Hilti TE 30', cantidad_disponible: 12, unidad: 'Pieza', imagen: '/material-taladro.jpg' },
    { id: '5', codigo: 'TUBING-PVC-2IN', descripcion: 'Tubería PVC schedula 40', cantidad_disponible: 120, unidad: 'Metro', imagen: '/material-tuberia.jpg' },
    { id: '6', codigo: 'ANDAMIO-METAL', descripcion: 'Andamio metálico estándar', cantidad_disponible: 25, unidad: 'Pieza', imagen: '/material-andamio.jpg' },
  ]

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.find(item => item.id === itemId)) {
      setSelectedItems(selectedItems.filter(item => item.id !== itemId))
      const newCantidades = { ...cantidades }
      delete newCantidades[itemId]
      setCantidades(newCantidades)
    } else {
      setSelectedItems([...selectedItems, { id: itemId, cantidad: 1 }])
      setCantidades({ ...cantidades, [itemId]: 1 })
    }
  }

  const handleCantidadChange = (itemId: string, cantidad: number) => {
    const item = itemsDisponibles.find(i => i.id === itemId)
    if (item && cantidad <= item.cantidad_disponible && cantidad > 0) {
      setCantidades({ ...cantidades, [itemId]: cantidad })
      setSelectedItems(selectedItems.map(si => si.id === itemId ? { ...si, cantidad } : si))
    }
  }

  const handleIncrement = (itemId: string) => {
    const currentCantidad = cantidades[itemId] || 0
    const item = itemsDisponibles.find(i => i.id === itemId)
    if (item && currentCantidad < item.cantidad_disponible) {
      handleCantidadChange(itemId, currentCantidad + 1)
    }
  }

  const handleDecrement = (itemId: string) => {
    const currentCantidad = cantidades[itemId] || 0
    if (currentCantidad > 1) {
      handleCantidadChange(itemId, currentCantidad - 1)
    }
  }

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivo(e.target.files[0])
    }
  }

  const handleConfirmar = () => {
    if (step === 'origen' && almacenOrigen) {
      setStep('items')
    } else if (step === 'items' && selectedItems.length > 0) {
      setStep('destino')
    } else if (step === 'destino' && almacenDestino) {
      setStep('evidencia')
    } else if (step === 'evidencia' && (archivo || notas)) {
      setStep('confirmacion')
    }
  }

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Transferencia de Materiales</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Transfiere materiales entre almacenes con evidencia y notas</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
          {['origen', 'items', 'destino', 'evidencia', 'confirmacion'].map((s, idx) => {
            const labels = ['Origen', 'Ítems', 'Destino', 'Evidencia', 'Confirmar']
            const steps = ['origen', 'items', 'destino', 'evidencia', 'confirmacion']
            const currentIdx = steps.indexOf(step)
            return (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                    step === s ? 'bg-accent text-background' :
                    currentIdx > idx ? 'bg-green-500 text-white' :
                    'bg-border text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:block">{labels[idx]}</span>
                </div>
                {idx < 4 && <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                  currentIdx > idx ? 'bg-green-500' : 'bg-border'
                }`}></div>}
              </div>
            )
          })}
        </div>

        {/* Paso 1: Seleccionar Almacén Origen */}
        {step === 'origen' && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Selecciona Almacén de Origen</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {allWarehouses.map((almacen) => (
                <button
                  key={almacen.id}
                  onClick={() => setAlmacenOrigen(almacen.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    almacenOrigen === almacen.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  <p className="font-bold text-foreground">{almacen.nombre}</p>
                  <p className="text-sm text-muted-foreground">{almacen.tipo}</p>
                  <p className="text-xs text-muted-foreground mt-1">{almacen.items_count} ítems</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 2: Seleccionar Items */}
        {step === 'items' && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Selecciona Ítems a Transferir</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {itemsDisponibles.map((item) => (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                    selectedItems.find(si => si.id === item.id)
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  {/* Imagen */}
                  <div className="relative w-full h-40 bg-muted">
                    <Image
                      src={item.imagen}
                      alt={item.descripcion}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="12"%3EImagen%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>

                  {/* Contenido */}
                  <div className="p-4">
                    <p className="font-mono text-xs text-muted-foreground mb-1">{item.codigo}</p>
                    <p className="font-bold text-foreground mb-2 text-sm line-clamp-2">{item.descripcion}</p>
                    <p className="text-xs text-muted-foreground mb-4">Disponible: {item.cantidad_disponible} {item.unidad}</p>

                    {/* Controles */}
                    {selectedItems.find(si => si.id === item.id) ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(item.id)}
                          className="p-2 rounded bg-border hover:bg-accent/20 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-foreground" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.cantidad_disponible}
                          value={cantidades[item.id] || 1}
                          onChange={(e) => handleCantidadChange(item.id, parseInt(e.target.value))}
                          className="flex-1 px-2 py-1 bg-background border border-border rounded text-foreground text-sm text-center"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={() => handleIncrement(item.id)}
                          className="p-2 rounded bg-border hover:bg-accent/20 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectItem(item.id)}
                        className="w-full py-2 rounded bg-accent text-white hover:bg-accent/90 transition-colors font-medium text-sm"
                      >
                        Seleccionar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{selectedItems.length} ítem(s) seleccionado(s)</p>
          </div>
        )}

        {/* Paso 3: Seleccionar Almacén Destino */}
        {step === 'destino' && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Selecciona Almacén de Destino</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {allWarehouses
                .filter(a => a.id !== almacenOrigen)
                .map((almacen) => (
                <button
                  key={almacen.id}
                  onClick={() => setAlmacenDestino(almacen.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    almacenDestino === almacen.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  <p className="font-bold text-foreground">{almacen.nombre}</p>
                  <p className="text-sm text-muted-foreground">{almacen.tipo}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 4: Evidencia y Notas */}
        {step === 'evidencia' && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-8 space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Evidencia y Notas</h2>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Notas sobre la Transferencia</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Especifica el motivo de la transferencia..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Adjunta Evidencia</label>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {archivo ? archivo.name : 'PDF, Excel, Word o Foto'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleArchivo}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Paso 5: Confirmación */}
        {step === 'confirmacion' && (
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Confirmar Transferencia</h2>
            <div className="space-y-4">
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">De: {allWarehouses.find(a => a.id === almacenOrigen)?.nombre}</p>
                <p className="font-bold text-foreground mt-1">A: {allWarehouses.find(a => a.id === almacenDestino)?.nombre}</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="font-bold text-foreground mb-2">Ítems:</p>
                {selectedItems.map(si => {
                  const item = itemsDisponibles.find(i => i.id === si.id)
                  return item ? (
                    <p key={si.id} className="text-sm text-muted-foreground">
                      {item.descripcion} - {si.cantidad} {item.unidad}
                    </p>
                  ) : null
                })}
              </div>
              {notas && (
                <div className="bg-background border border-border rounded-lg p-4">
                  <p className="font-bold text-foreground mb-2">Notas:</p>
                  <p className="text-sm text-muted-foreground">{notas}</p>
                </div>
              )}
              {archivo && (
                <div className="bg-background border border-border rounded-lg p-4">
                  <p className="font-bold text-foreground mb-2">Evidencia:</p>
                  <p className="text-sm text-muted-foreground">{archivo.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de Navegación */}
        <div className="flex gap-3 justify-end flex-wrap">
          {step !== 'origen' && (
            <button
              onClick={() => {
                const steps: any[] = ['origen', 'items', 'destino', 'evidencia', 'confirmacion']
                setStep(steps[steps.indexOf(step) - 1])
              }}
              className="px-6 py-3 bg-border text-foreground rounded-lg hover:bg-border/80 transition-colors font-medium"
            >
              Atrás
            </button>
          )}
          <button
            onClick={handleConfirmar}
            disabled={
              (step === 'origen' && !almacenOrigen) ||
              (step === 'items' && selectedItems.length === 0) ||
              (step === 'destino' && !almacenDestino) ||
              (step === 'evidencia' && !archivo && !notas) ||
              (step === 'confirmacion')
            }
            className="px-6 py-3 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {step === 'confirmacion' ? (
              <>
                <Send className="w-4 h-4" />
                Completar Transferencia
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
