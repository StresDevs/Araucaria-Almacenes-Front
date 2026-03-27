'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { MOCK_ALMACENES_OBRA, MOCK_ALMACENES_EXTERNOS, MOCK_ITEMS_CATALOGO } from '@/lib/constants'
import { Check, ChevronRight, AlertCircle } from 'lucide-react'

interface TransferPlan {
  item_id: string
  cantidad: number
  destino: string
}

export default function TraspasoPage() {
  const [step, setStep] = useState(1)
  const [selectedObra, setSelectedObra] = useState('Torre Anaya')
  const [transferPlans, setTransferPlans] = useState<TransferPlan[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Get obra warehouses
  const obraWarehouses = MOCK_ALMACENES_OBRA.filter(w => w.obra === selectedObra)

  // Mock inventory items in obra warehouses
  const obraItems = [
    { id: 'item-001', codigo: 'SKF-6205-2RS', desc: 'Rodamiento de bolas profundo SKF 6205-2RS', cantidad: 25, saldo: 8 },
    { id: 'item-002', codigo: 'CEMENTO-GR-50KG', desc: 'Cemento gris Portland tipo I bolsa 50kg', cantidad: 150, saldo: 1200 },
    { id: 'item-003', codigo: 'ACERO-CORR-60-8MM', desc: 'Acero corrugado grado 60 diámetro 8mm', cantidad: 450, saldo: 2100 },
  ]

  const itemsWithStock = obraItems.filter(item => item.cantidad > 0)
  const allItemsEmpty = obraItems.every(item => item.cantidad === 0)

  const handleSetDestino = (itemId: string, destino: string) => {
    const existing = transferPlans.find(p => p.item_id === itemId)
    if (existing) {
      setTransferPlans(transferPlans.map(p => p.item_id === itemId ? { ...p, destino } : p))
    } else {
      const item = obraItems.find(i => i.id === itemId)
      if (item) {
        setTransferPlans([...transferPlans, { item_id: itemId, cantidad: item.cantidad, destino }])
      }
    }
  }

  const handleApplyToAll = (destino: string) => {
    const newPlans = itemsWithStock.map(item => ({
      item_id: item.id,
      cantidad: item.cantidad,
      destino,
    }))
    setTransferPlans(newPlans)
  }

  const getDestino = (itemId: string) => {
    return transferPlans.find(p => p.item_id === itemId)?.destino || ''
  }

  const allItemsAssigned = itemsWithStock.every(item => getDestino(item.id))

  const handleConfirm = () => {
    if (step === 1) {
      if (!allItemsEmpty && !allItemsAssigned) {
        alert('Todos los ítems con stock deben tener un destino asignado')
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      setIsConfirmed(true)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Traspaso por Cierre de Obra</h1>
          <p className="text-muted-foreground mt-2 text-base">Wizard guiado para cerrar una obra y traspasar saldos</p>
        </div>

        {!isConfirmed ? (
          <>
            {/* Progress Bar */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3].map(stepNum => (
                  <div key={stepNum} className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      step >= stepNum ? 'bg-accent text-background' : 'bg-border text-muted-foreground'
                    }`}>
                      {step > stepNum ? <Check className="w-5 h-5" /> : stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div className={`flex-1 h-1 mx-2 ${step > stepNum ? 'bg-accent' : 'bg-border'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Revisar saldos</span>
                <span>Seleccionar destino</span>
                <span>Confirmar traspaso</span>
              </div>
            </div>

            {/* Step 1: Revisar Saldos */}
            {step === 1 && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-3">Obra a cerrar</label>
                    <select
                      value={selectedObra}
                      onChange={(e) => setSelectedObra(e.target.value)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {Array.from(new Set(MOCK_ALMACENES_OBRA.map(w => w.obra))).map(obra => (
                        <option key={obra} value={obra}>{obra}</option>
                      ))}
                    </select>
                  </div>

                  {/* Warehouse Cards */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium text-foreground">Almacenes de la obra</h3>
                    {obraWarehouses.map(warehouse => (
                      <div key={warehouse.id} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-foreground">{warehouse.nombre}</p>
                            <p className="text-xs text-muted-foreground">{warehouse.tipo}</p>
                          </div>
                          <span className="text-xs bg-border px-2 py-1 rounded text-foreground font-mono">{warehouse.items_count} ítems</span>
                        </div>

                        {/* Mini inventory */}
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border">
                              <th className="text-left py-2">Código</th>
                              <th className="text-right py-2">Cantidad</th>
                              <th className="text-right py-2">Saldo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {obraItems.map(item => (
                              <tr key={item.id} className={`border-b border-border/30 ${item.cantidad === 0 ? 'opacity-50' : ''}`}>
                                <td className="py-2 font-mono text-accent font-bold">{item.codigo}</td>
                                <td className={`text-right py-2 ${item.cantidad > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                                  {item.cantidad}
                                </td>
                                <td className="text-right py-2 text-muted-foreground">{item.saldo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {obraItems.every(i => i.cantidad === 0) && (
                          <div className="text-xs text-muted-foreground mt-2 italic">Sin saldo</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {allItemsEmpty && (
                    <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-600/30 rounded-lg mb-6">
                      <Check className="w-5 h-5 text-green-400" />
                      <p className="text-sm text-foreground">Todos los almacenes en cero — puedes continuar al paso 2</p>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleBack}
                      disabled={step === 1}
                      className="px-6 py-3 bg-border text-foreground rounded-lg font-medium hover:bg-border/80 disabled:opacity-50"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex items-center gap-2 px-6 py-3 bg-accent text-background rounded-lg font-medium hover:bg-accent/90"
                    >
                      Siguiente <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Seleccionar Destino */}
            {step === 2 && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-card border border-border rounded-lg p-6">
                  {itemsWithStock.length > 0 && (
                    <div className="mb-6">
                      <button
                        onClick={() => {
                          const firstDestino = MOCK_ALMACENES_EXTERNOS[0].id
                          handleApplyToAll(firstDestino)
                        }}
                        className="text-accent hover:text-accent/80 text-sm font-medium"
                      >
                        Aplicar mismo destino a todos
                      </button>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    {itemsWithStock.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-border/20 rounded-lg">
                        <div className="flex-1">
                          <p className="font-mono text-accent font-bold text-sm">{item.codigo}</p>
                          <p className="text-sm text-foreground">{item.desc}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.cantidad} unidades</p>
                        </div>
                        <div className="w-64">
                          <select
                            value={getDestino(item.id)}
                            onChange={(e) => handleSetDestino(item.id, e.target.value)}
                            className="w-full px-4 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          >
                            <option value="">Seleccionar almacén...</option>
                            {MOCK_ALMACENES_EXTERNOS.map(alm => (
                              <option key={alm.id} value={alm.id}>{alm.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">
                    Transfiriendo: {transferPlans.length} de {itemsWithStock.length} ítems
                  </p>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 bg-border text-foreground rounded-lg font-medium hover:bg-border/80"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={!allItemsAssigned && itemsWithStock.length > 0}
                      className="flex items-center gap-2 px-6 py-3 bg-accent text-background rounded-lg font-medium hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground"
                    >
                      Siguiente <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmar Traspaso */}
            {step === 3 && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  {/* Summary Table */}
                  <div>
                    <h3 className="font-medium text-foreground mb-4">Resumen de traspasos</h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-border/30">
                          <tr>
                            <th className="px-4 py-3 text-left text-foreground font-semibold">Ítem</th>
                            <th className="px-4 py-3 text-left text-foreground font-semibold">De</th>
                            <th className="px-4 py-3 text-left text-foreground font-semibold">Hacia</th>
                            <th className="px-4 py-3 text-right text-foreground font-semibold">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {transferPlans.map(plan => {
                            const item = obraItems.find(i => i.id === plan.item_id)
                            const destino = MOCK_ALMACENES_EXTERNOS.find(a => a.id === plan.destino)
                            return (
                              <tr key={plan.item_id}>
                                <td className="px-4 py-3">
                                  <p className="font-mono text-accent font-bold">{item?.codigo}</p>
                                  <p className="text-xs text-foreground">{item?.desc}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-foreground">{obraWarehouses[0]?.nombre || 'Obra'}</td>
                                <td className="px-4 py-3 text-sm text-foreground">{destino?.nombre || '—'}</td>
                                <td className="px-4 py-3 text-right text-foreground font-bold">{plan.cantidad}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Read-only fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground font-mono mb-2">INGENIERO RESPONSABLE</label>
                      <div className="px-4 py-3 bg-input border border-border rounded text-foreground">Ing. Juan García</div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground font-mono mb-2">FECHA DE CIERRE</label>
                      <div className="px-4 py-3 bg-input border border-border rounded text-foreground">{new Date().toLocaleDateString('es-MX')}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Observaciones de cierre</label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Notas adicionales..."
                      className="w-full h-24 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">Esta acción cerrará la obra y no podrá ser revertida</p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 bg-border text-foreground rounded-lg font-medium hover:bg-border/80"
                    >
                      Volver a revisar
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex items-center gap-2 px-6 py-3 bg-accent text-background rounded-lg font-medium hover:bg-accent/90"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Confirmar traspaso y cerrar obra
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Success State
          <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg p-12">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-background" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-foreground mb-4">Obra Cerrada Exitosamente</h2>
            <p className="text-center text-muted-foreground mb-8">El cierre de {selectedObra} ha sido registrado. Todos los saldos han sido trasladados.</p>
            
            <div className="bg-border/30 rounded-lg p-6 mb-8">
              <p className="text-sm text-foreground"><strong>Ítems trasferidos:</strong> {transferPlans.length}</p>
              <p className="text-sm text-foreground"><strong>Total de unidades:</strong> {transferPlans.reduce((sum, p) => sum + p.cantidad, 0)}</p>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-accent text-background rounded-lg font-medium hover:bg-accent/90"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
