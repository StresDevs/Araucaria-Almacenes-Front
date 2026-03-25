'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { MOCK_CONTRATISTAS, MOCK_PRESTAMOS_INDUMENTARIA, MOCK_ITEMS_CATALOGO } from '@/lib/constants'
import { Search, AlertCircle, Info, CheckCircle } from 'lucide-react'

export default function DevolucionesPage() {
  const [activeTab, setActiveTab] = useState<'indumentaria' | 'defecto' | 'dano'>('indumentaria')
  const [searchContratista, setSearchContratista] = useState('')
  const [selectedContratista, setSelectedContratista] = useState<string | null>(null)
  const [searchItem, setSearchItem] = useState('')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  // Tab 1: Devolución de indumentaria
  const [devolucionesIndumentaria, setDevolucionesIndumentaria] = useState<{ [key: string]: number }>({})
  const [faltantes, setFaltantes] = useState<{ [key: string]: number }>({})

  // Tab 2: Defecto de fábrica
  const [defectoDescripcion, setDefectoDescripcion] = useState('')
  const [defectoCantidad, setDefectoCantidad] = useState(0)
  const [requiereReposicion, setRequiereReposicion] = useState(false)
  const [reposicionCantidad, setReposicionCantidad] = useState(0)

  // Tab 3: Daño por contratista
  const [danoDescripcion, setDanoDescripcion] = useState('')
  const [danoCantidad, setDanoCantidad] = useState(0)
  const [reposicionDanoCantidad, setReposicionDanoCantidad] = useState(0)

  const filteredContratistas = MOCK_CONTRATISTAS.filter(c =>
    c.nombre.toLowerCase().includes(searchContratista.toLowerCase()) ||
    c.empresa.toLowerCase().includes(searchContratista.toLowerCase())
  )

  const selectedContratistaData = selectedContratista
    ? MOCK_CONTRATISTAS.find(c => c.id === selectedContratista)
    : null

  const loansForContratista = selectedContratista
    ? MOCK_PRESTAMOS_INDUMENTARIA.filter(l => l.contratista === selectedContratistaData?.nombre)
    : []

  const handleDevolucionQuantity = (id: string, qty: number, loaned: number) => {
    setDevolucionesIndumentaria(prev => ({ ...prev, [id]: qty }))
    if (qty < loaned) {
      setFaltantes(prev => ({ ...prev, [id]: loaned - qty }))
    } else {
      setFaltantes(prev => {
        const newFaltantes = { ...prev }
        delete newFaltantes[id]
        return newFaltantes
      })
    }
  }

  const handleSubmitIndumentaria = () => {
    if (!selectedContratista || loansForContratista.length === 0) {
      alert('Seleccione un contratista con préstamos activos')
      return
    }
    alert('Devolución de indumentaria registrada')
    setDevolucionesIndumentaria({})
    setFaltantes({})
    setSelectedContratista(null)
  }

  const handleSubmitDefecto = () => {
    if (!selectedItem || !defectoDescripcion || defectoCantidad <= 0) {
      alert('Complete todos los campos requeridos')
      return
    }
    alert(`Defecto registrado: ${defectoCantidad} unidades${requiereReposicion ? ` - Reposición: ${reposicionCantidad}` : ''}`)
    setDefectoDescripcion('')
    setDefectoCantidad(0)
    setRequiereReposicion(false)
    setReposicionCantidad(0)
    setSelectedItem(null)
  }

  const handleSubmitDano = () => {
    if (!selectedContratista || !selectedItem || !danoDescripcion || danoCantidad <= 0 || reposicionDanoCantidad <= 0) {
      alert('Complete todos los campos requeridos')
      return
    }
    alert(`Daño registrado y reposición autorizada: ${reposicionDanoCantidad} unidades`)
    setDanoDescripcion('')
    setDanoCantidad(0)
    setReposicionDanoCantidad(0)
    setSelectedContratista(null)
    setSelectedItem(null)
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Devoluciones</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Registre devoluciones, defectos y daños</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-6 border-b border-border overflow-x-auto scrollbar-none">
          {[
            { id: 'indumentaria', label: 'Indumentaria', labelFull: 'Devolución de indumentaria' },
            { id: 'defecto', label: 'Defecto', labelFull: 'Defecto de fábrica' },
            { id: 'dano', label: 'Daño', labelFull: 'Daño por contratista' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-5 py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="sm:hidden">{tab.label}</span>
              <span className="hidden sm:inline">{tab.labelFull}</span>
            </button>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Tab 1: Devolución de indumentaria */}
          {activeTab === 'indumentaria' && (
            <div className="space-y-6">
              {/* Contractor Search */}
              <div className="bg-card border border-border rounded-lg p-6">
                <label className="block text-sm font-medium text-foreground mb-3">Buscar contratista</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="text"
                    placeholder="Nombre o empresa..."
                    value={searchContratista}
                    onChange={(e) => setSearchContratista(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {searchContratista && !selectedContratista && (
                  <div className="border border-border rounded-lg overflow-hidden mt-3">
                    {filteredContratistas.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedContratista(c.id)
                          setSearchContratista('')
                        }}
                        className="w-full p-3 border-b border-border last:border-b-0 hover:bg-border/50 text-left transition-colors"
                      >
                        <p className="font-medium text-foreground">{c.nombre}</p>
                        <p className="text-xs text-muted-foreground">{c.empresa}</p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedContratistaData && (
                  <div className="flex items-center justify-between bg-border/30 rounded-lg p-4 mt-3">
                    <div>
                      <p className="font-medium text-foreground">{selectedContratistaData.nombre}</p>
                      <p className="text-xs text-muted-foreground">{selectedContratistaData.empresa}</p>
                    </div>
                    <button onClick={() => setSelectedContratista(null)} className="text-accent hover:text-accent/80 text-sm font-medium">
                      cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* Loans Table */}
              {selectedContratista && loansForContratista.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h3 className="font-medium text-foreground">Préstamos activos</h3>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead className="bg-border/30">
                        <tr>
                          <th className="px-4 py-3 text-left text-foreground font-semibold">Ítem</th>
                          <th className="px-4 py-3 text-right text-foreground font-semibold">Cant. prestada</th>
                          <th className="px-4 py-3 text-left text-foreground font-semibold hidden sm:table-cell">Fecha préstamo</th>
                          <th className="px-4 py-3 text-right text-foreground font-semibold hidden sm:table-cell">Días</th>
                          <th className="px-4 py-3 text-right text-foreground font-semibold">Cant. devuelta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loansForContratista.map(loan => (
                          <tr key={loan.id} className="border-t border-border">
                            <td className="px-4 py-3">
                              <p className="font-mono text-accent font-bold text-xs">{loan.codigo_item}</p>
                              <p className="text-foreground">{loan.descripcion}</p>
                            </td>
                            <td className="px-4 py-3 text-right text-foreground">{loan.cantidad_prestada}</td>
                            <td className="px-4 py-3 text-foreground text-xs hidden sm:table-cell">{loan.fecha_prestamo}</td>
                            <td className="px-4 py-3 text-right hidden sm:table-cell">
                              <span className={`${loan.dias_activo > 30 ? 'text-red-400' : loan.dias_activo > 14 ? 'text-accent' : 'text-green-400'}`}>
                                {loan.dias_activo}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max={loan.cantidad_prestada}
                                value={devolucionesIndumentaria[loan.id] || 0}
                                onChange={(e) => handleDevolucionQuantity(loan.id, parseInt(e.target.value) || 0, loan.cantidad_prestada)}
                                className="w-20 px-2 py-1 bg-input border border-border rounded text-right text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>

                  {Object.keys(faltantes).length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground font-medium">Diferencia detectada</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Object.entries(faltantes).map(([id, qty]) => `${qty} unidades faltantes`).join(', ')} — se registrará como faltante
                        </p>
                      </div>
                    </div>
                  )}

                  <button onClick={handleSubmitIndumentaria} className="w-full px-4 py-2 bg-accent text-background rounded-lg font-medium hover:bg-accent/90">
                    Registrar devolución
                  </button>
                </div>
              )}

              {selectedContratista && loansForContratista.length === 0 && (
                <div className="bg-border/20 border border-border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">Este contratista no tiene préstamos activos</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Defecto de fábrica */}
          {activeTab === 'defecto' && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Buscar ítem por código</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="text"
                    placeholder="Código de fabricante..."
                    value={searchItem}
                    onChange={(e) => setSearchItem(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {searchItem && !selectedItem && (
                  <div className="border border-border rounded-lg overflow-hidden mt-3">
                    {MOCK_ITEMS_CATALOGO.filter(i => i.codigo_fab.toLowerCase().includes(searchItem.toLowerCase())).map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item.id)
                          setSearchItem('')
                        }}
                        className="w-full p-3 border-b border-border last:border-b-0 hover:bg-border/50 text-left transition-colors"
                      >
                        <p className="font-mono text-accent font-bold">{item.codigo_fab}</p>
                        <p className="text-sm text-foreground">{item.descripcion}</p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedItem && (
                  <div className="bg-border/30 rounded-lg p-3 mt-3">
                    <p className="font-mono text-accent font-bold">{MOCK_ITEMS_CATALOGO.find(i => i.id === selectedItem)?.codigo_fab}</p>
                    <button onClick={() => setSelectedItem(null)} className="text-accent hover:text-accent/80 text-xs font-medium mt-2">
                      cambiar
                    </button>
                  </div>
                )}
              </div>

              {selectedItem && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Descripción del defecto</label>
                    <textarea
                      value={defectoDescripcion}
                      onChange={(e) => setDefectoDescripcion(e.target.value)}
                      placeholder="Describe el defecto encontrado..."
                      className="w-full h-24 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Cantidad defectuosa</label>
                    <input
                      type="number"
                      min="1"
                      value={defectoCantidad}
                      onChange={(e) => setDefectoCantidad(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiereReposicion}
                        onChange={(e) => setRequiereReposicion(e.target.checked)}
                        className="w-5 h-5 accent-accent rounded"
                      />
                      <span className="text-sm font-medium text-foreground">Requiere reposición inmediata</span>
                    </label>
                  </div>

                  {requiereReposicion && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Cantidad de reposición</label>
                      <input
                        type="number"
                        min="1"
                        value={reposicionCantidad}
                        onChange={(e) => setReposicionCantidad(parseInt(e.target.value) || defectoCantidad)}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">Registrado por: Ing. Juan García (Ingeniero actual)</p>
                  </div>

                  <button onClick={handleSubmitDefecto} className="w-full px-4 py-3 bg-accent text-background rounded-lg font-medium hover:bg-accent/90">
                    Registrar defecto y gestionar reposición
                  </button>
                </>
              )}
            </div>
          )}

          {/* Tab 3: Daño por contratista */}
          {activeTab === 'dano' && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Buscar contratista</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="text"
                    placeholder="Nombre o empresa..."
                    value={searchContratista}
                    onChange={(e) => setSearchContratista(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {searchContratista && !selectedContratista && (
                  <div className="border border-border rounded-lg overflow-hidden mt-3">
                    {filteredContratistas.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedContratista(c.id)
                          setSearchContratista('')
                        }}
                        className="w-full p-3 border-b border-border last:border-b-0 hover:bg-border/50 text-left transition-colors"
                      >
                        <p className="font-medium text-foreground">{c.nombre}</p>
                        <p className="text-xs text-muted-foreground">{c.empresa}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedContratista && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Buscar ítem dañado</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <input
                        type="text"
                        placeholder="Código de fabricante..."
                        value={searchItem}
                        onChange={(e) => setSearchItem(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    {searchItem && !selectedItem && (
                      <div className="border border-border rounded-lg overflow-hidden mt-3">
                        {MOCK_ITEMS_CATALOGO.filter(i => i.codigo_fab.toLowerCase().includes(searchItem.toLowerCase())).map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedItem(item.id)
                              setSearchItem('')
                            }}
                            className="w-full p-3 border-b border-border last:border-b-0 hover:bg-border/50 text-left transition-colors"
                          >
                            <p className="font-mono text-accent font-bold">{item.codigo_fab}</p>
                            <p className="text-sm text-foreground">{item.descripcion}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedItem && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Descripción del daño</label>
                        <textarea
                          value={danoDescripcion}
                          onChange={(e) => setDanoDescripcion(e.target.value)}
                          placeholder="Describe el daño causado..."
                          className="w-full h-24 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Cantidad dañada</label>
                        <input
                          type="number"
                          min="1"
                          value={danoCantidad}
                          onChange={(e) => setDanoCantidad(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-foreground">Se registrará el daño en el historial del contratista y se habilitará la entrega de reposición</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Cantidad de reposición a entregar</label>
                        <input
                          type="number"
                          min="1"
                          value={reposicionDanoCantidad}
                          onChange={(e) => setReposicionDanoCantidad(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <button onClick={handleSubmitDano} className="w-full px-4 py-3 bg-accent text-background rounded-lg font-medium hover:bg-accent/90">
                        Registrar daño y autorizar reposición
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
