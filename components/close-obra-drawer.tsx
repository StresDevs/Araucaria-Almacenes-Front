'use client'

import { X, CheckCircle2, AlertCircle, Warehouse, Package } from 'lucide-react'
import { useState } from 'react'
import { MOCK_ALMACENES_EXTERNOS } from '@/lib/constants'

interface CloseObraDrawerProps {
  isOpen: boolean
  obraName?: string
  onClose: () => void
  onConfirm: () => void
}

type Step = 'review' | 'items-used' | 'distribution' | 'confirm' | 'done'

interface MaterialDistribution {
  [almacenId: string]: boolean
}

interface UsedItem {
  id: string
  codigo: string
  descripcion: string
  cantidad: number
}

const MOCK_AVAILABLE_ITEMS: UsedItem[] = [
  { id: '1', codigo: 'IND-001', descripcion: 'Casco de seguridad amarillo', cantidad: 25 },
  { id: '2', codigo: 'IND-002', descripcion: 'Chaleco reflectivo naranja', cantidad: 30 },
  { id: '3', codigo: 'IND-003', descripcion: 'Guantes de cuero', cantidad: 50 },
  { id: '4', codigo: 'IND-004', descripcion: 'Botas de seguridad', cantidad: 20 },
  { id: '5', codigo: 'MAT-001', descripcion: 'Cemento bolsa 50kg', cantidad: 100 },
  { id: '6', codigo: 'MAT-002', descripcion: 'Arena m³', cantidad: 15 },
  { id: '7', codigo: 'MAT-003', descripcion: 'Varilla 3/8', cantidad: 500 },
  { id: '8', codigo: 'MAT-004', descripcion: 'Tubo PVC 4 pulgadas', cantidad: 80 },
]

export function CloseObraDrawer({
  isOpen,
  obraName = 'Obra',
  onClose,
  onConfirm,
}: CloseObraDrawerProps) {
  const [step, setStep] = useState<Step>('review')
  const [usedItems, setUsedItems] = useState<{ [itemId: string]: number }>({})
  const [selectedAlmacenes, setSelectedAlmacenes] = useState<MaterialDistribution>(
    MOCK_ALMACENES_EXTERNOS.reduce((acc, alm) => ({
      ...acc,
      [alm.id]: false,
    }), {})
  )

  const handleClose = () => {
    setStep('review')
    setUsedItems({})
    setSelectedAlmacenes(
      MOCK_ALMACENES_EXTERNOS.reduce((acc, alm) => ({
        ...acc,
        [alm.id]: false,
      }), {})
    )
    onClose()
  }

  const handleNextStep = () => {
    if (step === 'review') setStep('items-used')
    else if (step === 'items-used') setStep('distribution')
    else if (step === 'distribution') setStep('confirm')
  }

  const handleConfirm = () => {
    setStep('done')
    setTimeout(() => {
      onConfirm()
      handleClose()
    }, 1500)
  }

  const toggleAlmacen = (almacenId: string) => {
    setSelectedAlmacenes(prev => ({
      ...prev,
      [almacenId]: !prev[almacenId]
    }))
  }

  const updateItemQuantity = (itemId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setUsedItems(prev => {
        const newItems = { ...prev }
        delete newItems[itemId]
        return newItems
      })
    } else {
      setUsedItems(prev => ({
        ...prev,
        [itemId]: cantidad
      }))
    }
  }

  const selectedCount = Object.values(selectedAlmacenes).filter(Boolean).length
  const usedItemsCount = Object.keys(usedItems).length

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/50 z-30"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full md:w-96 bg-card border-l border-border shadow-lg transition-transform duration-300 z-40 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Cerrar Obra</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-border rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {['review', 'items-used', 'distribution', 'confirm', 'done'].map((s, idx) => {
            const steps: Step[] = ['review', 'items-used', 'distribution', 'confirm', 'done']
            const currentIdx = steps.indexOf(step)
            const isCompleted = steps.indexOf(s as Step) < currentIdx
            const isCurrent = steps.indexOf(s as Step) === currentIdx
            
            return (
              <div key={s} className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-medium text-xs transition-all ${
                  isCurrent ? 'bg-accent text-background' :
                  isCompleted ? 'bg-green-500 text-white' :
                  'bg-border text-muted-foreground'
                }`}>
                  {idx + 1}
                </div>
                {idx < 3 && <div className={`w-8 h-0.5 ${isCompleted || isCurrent ? 'bg-accent' : 'bg-border'}`} />}
              </div>
            )
          })}
        </div>

          {/* Step Content */}
          {step === 'review' && (
            <div className="space-y-4 flex-1">
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Estás por cerrar:</p>
                <p className="text-lg font-bold text-foreground mt-2">{obraName}</p>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p>Esto archivará todos los ítems y préstamos asociados.</p>
                </div>
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p>Los datos históricos se preservarán para reportes.</p>
                </div>
              </div>
            </div>
          )}
          
          {step === 'items-used' && (
            <div className="space-y-4 flex-1">
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Especificar Ítems Utilizados</p>
                    <p className="text-xs text-muted-foreground mt-1">Registra los materiales e indumentaria que fueron utilizados en esta obra</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Ítems disponibles:</p>
                {MOCK_AVAILABLE_ITEMS.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 bg-background border border-border rounded">
                    No hay items disponibles
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {MOCK_AVAILABLE_ITEMS.map((item) => (
                      <div
                        key={item.id}
                        className="bg-background border border-border rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{item.descripcion}</p>
                            <p className="text-xs text-muted-foreground font-mono">{item.codigo}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">Disp: {item.cantidad}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={item.cantidad}
                          value={usedItems[item.id] || ''}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                          placeholder="Cantidad usada"
                          className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {usedItemsCount > 0 && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                  <p className="text-xs text-accent font-medium">
                    {usedItemsCount} {usedItemsCount === 1 ? 'ítem' : 'ítems'} registrado{usedItemsCount === 1 ? '' : 's'}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'distribution' && (
            <div className="space-y-4 flex-1">
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Warehouse className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Asignar Materiales Sobrantes</p>
                    <p className="text-xs text-muted-foreground mt-1">Selecciona los almacenes destino para los materiales de esta obra</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Almacenes Externos:</p>
                {MOCK_ALMACENES_EXTERNOS.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 bg-background border border-border rounded">
                    No hay almacenes externos disponibles
                  </p>
                ) : (
                  <div className="space-y-2">
                    {MOCK_ALMACENES_EXTERNOS.map((almacen) => (
                      <label
                        key={almacen.id}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-background transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAlmacenes[almacen.id] || false}
                          onChange={() => toggleAlmacen(almacen.id)}
                          className="w-4 h-4 rounded accent-accent cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{almacen.nombre}</p>
                          <p className="text-xs text-muted-foreground">{almacen.tipo}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedCount === 0 && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                  <p className="text-xs text-orange-200">
                    Selecciona al menos un almacén para continuar
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4 flex-1">
              <div className="bg-background border border-border rounded-lg p-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Obra a cerrar:</p>
                  <p className="text-lg font-bold text-foreground">{obraName}</p>
                </div>
                
                {usedItemsCount > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Ítems utilizados ({usedItemsCount}):</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(usedItems).map(([itemId, cantidad]) => {
                        const item = MOCK_AVAILABLE_ITEMS.find(i => i.id === itemId)
                        return (
                          <div key={itemId} className="flex items-center justify-between text-xs">
                            <span className="text-foreground flex-1 line-clamp-1">{item?.descripcion}</span>
                            <span className="text-accent font-bold shrink-0 ml-2">{cantidad} {item?.id.includes('MAT') ? 'u.' : 'pcs'}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Materiales irán a:</p>
                  <div className="space-y-1">
                    {Object.entries(selectedAlmacenes).map(([almacenId, selected]) => {
                      if (!selected) return null
                      const almacen = MOCK_ALMACENES_EXTERNOS.find(a => a.id === almacenId)
                      return (
                        <div key={almacenId} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-foreground">{almacen?.nombre}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4 flex-1 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-lg font-bold text-foreground">Obra Cerrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {obraName} ha sido archivada exitosamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-border transition-colors font-medium"
          >
            {step === 'done' ? 'Listo' : 'Cancelar'}
          </button>
          {step !== 'done' && (
            <button
              onClick={() => {
                if (step === 'review') handleNextStep()
                else if (step === 'items-used') handleNextStep()
                else if (step === 'distribution') {
                  if (selectedCount > 0) handleNextStep()
                }
                else if (step === 'confirm') handleConfirm()
              }}
              disabled={step === 'distribution' && selectedCount === 0}
              className="flex-1 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground transition-colors font-medium"
            >
              {step === 'review' ? 'Continuar' : step === 'items-used' ? 'Siguiente' : step === 'distribution' ? 'Revisar Cierre' : 'Confirmar'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
