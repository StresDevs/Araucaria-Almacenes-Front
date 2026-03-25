'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { MOCK_CONTRATISTAS, MOCK_ITEMS_CATALOGO, MOCK_ALMACENES_EXTERNOS } from '@/lib/constants'
import { Search, Plus, Trash2, Printer, Check } from 'lucide-react'

interface CartItem {
  id: string
  codigo_fab: string
  descripcion: string
  cantidad: number
  unidad: string
  stock_disponible: number
  tipo: 'Materiales' | 'Herramientas' | 'Indumentaria'
}

export default function SolicitudesPage() {
  const [selectedContratista, setSelectedContratista] = useState<string | null>(null)
  const [selectedAlmacen, setSelectedAlmacen] = useState<string>('Almacén Anaya')
  const [searchContratista, setSearchContratista] = useState('')
  const [searchItem, setSearchItem] = useState('')
  const [itemTypeFilter, setItemTypeFilter] = useState<'Todo' | 'Materiales' | 'Herramientas' | 'Indumentaria'>('Todo')
  const [cart, setCart] = useState<CartItem[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  const filteredContratistas = MOCK_CONTRATISTAS.filter(c =>
    c.nombre.toLowerCase().includes(searchContratista.toLowerCase()) ||
    c.empresa.toLowerCase().includes(searchContratista.toLowerCase())
  )

  const itemsWithTypes = MOCK_ITEMS_CATALOGO.map(item => ({
    ...item,
    tipo: item.codigo_fab.includes('ANDAMIO') || item.codigo_fab.includes('HILTI')
      ? 'Herramientas'
      : item.codigo_fab.includes('CASCO') || item.codigo_fab.includes('CHALECO') || item.codigo_fab.includes('GUANTES')
        ? 'Indumentaria'
        : 'Materiales'
  }))

  const filteredItems = itemsWithTypes.filter(item => {
    const matchesSearch = item.codigo_fab.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchItem.toLowerCase())
    const matchesType = itemTypeFilter === 'Todo' || item.tipo === itemTypeFilter
    return matchesSearch && matchesType && item.cantidad > 0
  })

  const addToCart = (item: any) => {
    const existingItem = cart.find(c => c.id === item.id)
    if (existingItem) {
      setCart(cart.map(c =>
        c.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c
      ))
    } else {
      setCart([...cart, {
        id: item.id,
        codigo_fab: item.codigo_fab,
        descripcion: item.descripcion,
        cantidad: 1,
        unidad: item.unidad,
        stock_disponible: item.cantidad,
        tipo: item.tipo,
      }])
    }
  }

  const updateCartQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(id)
    } else {
      setCart(cart.map(c => c.id === id ? { ...c, cantidad: newQty } : c))
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const handleConfirmar = () => {
    if (selectedContratista && cart.length > 0) {
      setIsConfirmed(true)
    }
  }

  const handleNuevaSolicitud = () => {
    setSelectedContratista(null)
    setCart([])
    setObservaciones('')
    setIsConfirmed(false)
    setSearchContratista('')
    setSearchItem('')
  }

  const selectedContratistaData = selectedContratista
    ? MOCK_CONTRATISTAS.find(c => c.id === selectedContratista)
    : null

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Entrega de Material</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Entrega de materiales a contratistas y obras</p>
        </div>

        {isConfirmed ? (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-foreground mb-4">Despacho Registrado</h2>
            <div className="bg-border/50 rounded-lg p-6 mb-8">
              <p className="text-foreground mb-4"><strong>Contratista:</strong> {selectedContratistaData?.nombre}</p>
              <p className="text-foreground mb-4"><strong>Empresa:</strong> {selectedContratistaData?.empresa}</p>
              <p className="text-foreground mb-4"><strong>Obra:</strong> {selectedContratistaData?.obra}</p>
              <p className="text-foreground mb-4"><strong>Almacén de despacho:</strong> {selectedAlmacen}</p>
              <p className="text-foreground"><strong>Total de ítems:</strong> {cart.length} artículos ({cart.reduce((sum, item) => sum + item.cantidad, 0)} unidades)</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90">
                <Printer className="w-5 h-5" />
                Imprimir comprobante
              </button>
              <button onClick={handleNuevaSolicitud} className="px-6 py-3 bg-border text-foreground rounded-lg font-medium hover:bg-border/80">
                Nueva solicitud
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="space-y-8">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Paso 1: Identificar Contratista</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Buscar contratista por nombre o empresa</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <input
                          type="text"
                          placeholder="Escriba nombre o empresa..."
                          value={searchContratista}
                          onChange={(e) => setSearchContratista(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>

                    {searchContratista && !selectedContratista && (
                      <div className="border border-border rounded-lg overflow-hidden">
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
                            <p className="text-xs text-muted-foreground">{c.empresa} - {c.obra}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedContratista && selectedContratistaData && (
                      <div className="flex items-center justify-between bg-border/30 rounded-lg p-4">
                        <div>
                          <p className="font-medium text-foreground">{selectedContratistaData.nombre}</p>
                          <p className="text-xs text-muted-foreground">{selectedContratistaData.empresa}</p>
                        </div>
                        <button
                          onClick={() => setSelectedContratista(null)}
                          className="text-accent hover:text-accent/80 text-sm font-medium"
                        >
                          cambiar
                        </button>
                      </div>
                    )}

                    {selectedContratista && (
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Almacén de despacho</label>
                        <select
                          value={selectedAlmacen}
                          onChange={(e) => setSelectedAlmacen(e.target.value)}
                          className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          {MOCK_ALMACENES_EXTERNOS.map(alm => (
                            <option key={alm.id} value={alm.nombre}>{alm.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {selectedContratista && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Paso 2: Buscar y Agregar Ítems</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Buscar por código de fabricante o descripción</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                          <input
                            type="text"
                            placeholder="Ej: SKF-6205 o Rodamiento..."
                            value={searchItem}
                            onChange={(e) => setSearchItem(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Filtrar por tipo</label>
                        <div className="flex gap-3 flex-wrap">
                          {['Todo', 'Materiales', 'Herramientas', 'Indumentaria'].map(type => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="itemType"
                                value={type}
                                checked={itemTypeFilter === type}
                                onChange={(e) => setItemTypeFilter(e.target.value as any)}
                                className="w-4 h-4 accent-accent"
                              />
                              <span className="text-sm text-foreground">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {filteredItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-border/20 rounded-lg hover:bg-border/40 transition-colors">
                            <div className="flex-1">
                              <p className="font-mono text-sm text-accent font-bold">{item.codigo_fab}</p>
                              <p className="text-sm text-foreground">{item.descripcion}</p>
                              <p className="text-xs text-muted-foreground">Stock: {item.cantidad} {item.unidad}</p>
                            </div>
                            <button
                              onClick={() => addToCart(item)}
                              className="ml-4 p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                        {searchItem && filteredItems.length === 0 && (
                          <div className="p-4 bg-border/20 rounded-lg text-center">
                            <p className="text-muted-foreground">Sin stock disponible</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="sticky top-4 lg:top-24 bg-card border border-border rounded-lg p-4 sm:p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Resumen de Despacho</h2>

                {selectedContratistaData && (
                  <div className="mb-4 pb-4 border-b border-border">
                    <p className="font-medium text-foreground">{selectedContratistaData.nombre}</p>
                    <p className="text-xs text-muted-foreground">{new Date().toLocaleString('es-MX')}</p>
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="text-sm border-b border-border pb-3">
                        <p className="font-mono text-accent font-bold text-xs">{item.codigo_fab}</p>
                        <p className="text-foreground line-clamp-2">{item.descripcion}</p>
                        <div className="flex items-center justify-between mt-2">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-12 h-7 bg-input border border-border rounded text-center text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                          <span className="text-muted-foreground text-xs">{item.unidad}</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-border rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-muted" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Stock: {item.stock_disponible}</p>
                        <div className="mt-1">
                          {item.tipo === 'Indumentaria' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Indumentaria (Activa préstamo)</span>}
                          {item.tipo === 'Herramientas' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Herramienta (No retornable)</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-4 pb-4 border-b border-border">
                  <label className="block text-xs text-muted-foreground mb-2">Observaciones</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales..."
                    className="w-full h-20 px-3 py-2 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>

                <p className="text-sm text-foreground mb-4">
                  <strong>Total:</strong> {cart.length} artículos ({cart.reduce((sum, item) => sum + item.cantidad, 0)} unidades)
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleNuevaSolicitud}
                    className="flex-1 px-4 py-2 bg-transparent border border-border text-foreground rounded-lg hover:bg-border/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmar}
                    disabled={!selectedContratista || cart.length === 0}
                    className="flex-1 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
                  >
                    Confirmar despacho
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
