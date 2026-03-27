'use client'

import { X, CheckCircle2, AlertCircle, Warehouse, Package, Search } from 'lucide-react'
import { useState } from 'react'
import { MOCK_ALMACENES_EXTERNOS } from '@/lib/constants'

interface CloseObraDrawerProps {
  isOpen: boolean
  obraName?: string
  onClose: () => void
  onConfirm: () => void
}

type Step = 'review' | 'items-used' | 'distribution' | 'confirm' | 'done'

interface ItemDistribution {
  [itemId: string]: {
    totalCantidad: number
    almacenes: {
      [almacenId: string]: number
    }
  }
}

interface UsedItem {
  id: string
  codigo: string
  descripcion: string
  cantidad: number
  categoria: string
}

const MOCK_AVAILABLE_ITEMS: UsedItem[] = [
  { id: '1', codigo: 'IND-001', descripcion: 'Casco de seguridad amarillo', cantidad: 25, categoria: 'Seguridad' },
  { id: '2', codigo: 'IND-002', descripcion: 'Chaleco reflectivo naranja', cantidad: 30, categoria: 'Seguridad' },
  { id: '3', codigo: 'IND-003', descripcion: 'Guantes de cuero', cantidad: 50, categoria: 'Seguridad' },
  { id: '4', codigo: 'IND-004', descripcion: 'Botas de seguridad', cantidad: 20, categoria: 'Seguridad' },
  { id: '5', codigo: 'MAT-001', descripcion: 'Cemento bolsa 50kg', cantidad: 100, categoria: 'Materiales' },
  { id: '6', codigo: 'MAT-002', descripcion: 'Arena m³', cantidad: 15, categoria: 'Materiales' },
  { id: '7', codigo: 'MAT-003', descripcion: 'Varilla 3/8', cantidad: 500, categoria: 'Materiales' },
  { id: '8', codigo: 'MAT-004', descripcion: 'Tubo PVC 4 pulgadas', cantidad: 80, categoria: 'Materiales' },
]

const CATEGORIAS = ['Todas', ...new Set(MOCK_AVAILABLE_ITEMS.map(i => i.categoria))]

export function CloseObraDrawer({
  isOpen,
  obraName = 'Obra',
  onClose,
  onConfirm,
}: CloseObraDrawerProps) {
  const [step, setStep] = useState<Step>('review')
  const [usedItems, setUsedItems] = useState<{ [itemId: string]: number }>({})
  const [itemDistribution, setItemDistribution] = useState<ItemDistribution>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('Todas')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const handleClose = () => {
    setStep('review')
    setUsedItems({})
    setItemDistribution({})
    setSearchTerm('')
    setSelectedCategoria('Todas')
    setExpandedItem(null)
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

  const updateItemQuantity = (itemId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setUsedItems(prev => {
        const newItems = { ...prev }
        delete newItems[itemId]
        return newItems
      })
      setItemDistribution(prev => {
        const newDist = { ...prev }
        delete newDist[itemId]
        return newDist
      })
    } else {
      setUsedItems(prev => ({
        ...prev,
        [itemId]: cantidad
      }))
      if (!itemDistribution[itemId]) {
        setItemDistribution(prev => ({
          ...prev,
          [itemId]: {
            totalCantidad: cantidad,
            almacenes: {}
          }
        }))
      }
    }
  }

  const updateItemDistribution = (itemId: string, almacenId: string, cantidad: number) => {
    setItemDistribution(prev => {
      const current = prev[itemId] || { totalCantidad: 0, almacenes: {} }
      const newAlmacenes = { ...current.almacenes }
      
      if (cantidad <= 0) {
        delete newAlmacenes[almacenId]
      } else {
        newAlmacenes[almacenId] = cantidad
      }
      
      return {
        ...prev,
        [itemId]: {
          totalCantidad: current.totalCantidad,
          almacenes: newAlmacenes
        }
      }
    })
  }

  const getDistributedTotal = (itemId: string) => {
    const dist = itemDistribution[itemId]
    if (!dist) return 0
    return Object.values(dist.almacenes).reduce((a, b) => a + b, 0)
  }

  const filteredItems = MOCK_AVAILABLE_ITEMS.filter(item => {
    const matchesCategory = selectedCategoria === 'Todas' || item.categoria === selectedCategoria
    const matchesSearch = item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && usedItems[item.id]
  })

  const usedItemsCount = Object.keys(usedItems).length
  const allDistributed = Object.entries(usedItems).every(([itemId, totalQty]) => {
    const distributed = getDistributedTotal(itemId)
    return distributed === totalQty
  })

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

              {/* Filtros */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar por código o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoria(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategoria === cat
                          ? 'bg-accent text-background'
                          : 'bg-border text-foreground hover:bg-border/80'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Ítems disponibles:</p>
                {MOCK_AVAILABLE_ITEMS.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 bg-background border border-border rounded">
                    No hay items disponibles
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {MOCK_AVAILABLE_ITEMS.map((item) => {
                      const matchesCategory = selectedCategoria === 'Todas' || item.categoria === selectedCategoria
                      const matchesSearch = item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                      
                      if (!matchesCategory || !matchesSearch) return null

                      return (
                        <div
                          key={item.id}
                          className="bg-background border border-border rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-1">{item.descripcion}</p>
                              <p className="text-xs text-muted-foreground font-mono">{item.codigo}</p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 bg-border/50 px-2 py-1 rounded">
                              {item.categoria}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={item.cantidad}
                              value={usedItems[item.id] || ''}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                              placeholder={`0 de ${item.cantidad}`}
                              className="flex-1 px-2 py-1.5 bg-card border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                            <span className="text-xs text-muted-foreground shrink-0">de {item.cantidad}</span>
                          </div>
                        </div>
                      )
                    })}
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
                    <p className="text-sm font-medium text-foreground">Distribuir Materiales</p>
                    <p className="text-xs text-muted-foreground mt-1">Especifica a qué almacén irá cada cantidad de material</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(usedItems).map(([itemId, totalCantidad]) => {
                  const item = MOCK_AVAILABLE_ITEMS.find(i => i.id === itemId)
                  const distributed = getDistributedTotal(itemId)
                  const remaining = totalCantidad - distributed
                  const dist = itemDistribution[itemId]

                  return (
                    <div
                      key={itemId}
                      className="bg-background border border-border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{item?.descripcion}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item?.codigo}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          remaining === 0 ? 'bg-green-900/30 text-green-400' : 'bg-amber-900/30 text-amber-400'
                        }`}>
                          {distributed}/{totalCantidad}
                        </span>
                      </div>

                      {/* Distribución por almacén */}
                      <div className="space-y-1.5 text-xs">
                        {MOCK_ALMACENES_EXTERNOS.map(almacen => (
                          <div key={almacen.id} className="flex items-center gap-2">
                            <span className="text-muted-foreground w-20 truncate">{almacen.nombre}</span>
                            <input
                              type="number"
                              min="0"
                              max={totalCantidad}
                              value={dist?.almacenes[almacen.id] || ''}
                              onChange={(e) => updateItemDistribution(itemId, almacen.id, parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="flex-1 px-2 py-1 bg-card border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                          </div>
                        ))}
                      </div>

                      {remaining > 0 && (
                        <div className="text-xs text-orange-400 flex items-center gap-1 px-2 py-1 bg-orange-900/20 rounded">
                          <AlertCircle className="w-3 h-3" />
                          Faltan {remaining} unidades por distribuir
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {!allDistributed && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                  <p className="text-xs text-orange-200">
                    Distribuye todos los items antes de continuar
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="bg-background border border-border rounded-lg p-4 space-y-4 sticky top-0">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Obra a cerrar:</p>
                  <p className="text-lg font-bold text-foreground">{obraName}</p>
                </div>
              </div>

              {/* Resumen por Almacén */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground px-4">Materiales por Almacén:</p>
                {MOCK_ALMACENES_EXTERNOS.map(almacen => {
                  const itemsForAlmacen = Object.entries(itemDistribution).filter(
                    ([_, dist]) => dist.almacenes[almacen.id] && dist.almacenes[almacen.id] > 0
                  )

                  if (itemsForAlmacen.length === 0) return null

                  return (
                    <div key={almacen.id} className="bg-background border border-border rounded-lg p-4 space-y-2">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-accent" />
                        {almacen.nombre}
                      </p>
                      <div className="space-y-1.5">
                        {itemsForAlmacen.map(([itemId, dist]) => {
                          const item = MOCK_AVAILABLE_ITEMS.find(i => i.id === itemId)
                          const cantidad = dist.almacenes[almacen.id]
                          return (
                            <div key={itemId} className="flex items-center justify-between text-xs px-2 py-1 bg-border/30 rounded">
                              <span className="text-foreground line-clamp-1 flex-1">{item?.descripcion}</span>
                              <span className="text-accent font-bold ml-2">{cantidad} {item?.codigo.includes('MAT') ? 'u.' : 'pcs'}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Resumen por Ítem */}
              {usedItemsCount > 0 && (
                <div className="bg-background border border-border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Ítems Totales ({usedItemsCount}):</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(usedItems).map(([itemId, totalCantidad]) => {
                      const item = MOCK_AVAILABLE_ITEMS.find(i => i.id === itemId)
                      const dist = itemDistribution[itemId]
                      const almacenesAsignados = Object.entries(dist?.almacenes || {})
                        .filter(([_, qty]) => qty > 0)
                        .map(([almacenId]) => MOCK_ALMACENES_EXTERNOS.find(a => a.id === almacenId)?.nombre)
                        .filter(Boolean)

                      return (
                        <div key={itemId} className="flex items-start justify-between text-xs px-2 py-1.5 bg-border/20 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground line-clamp-1">{item?.descripcion}</p>
                            <p className="text-muted-foreground text-xs mt-0.5">{almacenesAsignados.join(', ')}</p>
                          </div>
                          <span className="text-accent font-bold ml-2">{totalCantidad}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
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
                  if (allDistributed) handleNextStep()
                }
                else if (step === 'confirm') handleConfirm()
              }}
              disabled={step === 'distribution' && !allDistributed}
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
