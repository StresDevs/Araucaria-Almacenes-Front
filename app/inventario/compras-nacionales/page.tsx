'use client'

import React, { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Filter, ChevronDown, Plus, Search } from 'lucide-react'
import { AddItemModal } from '@/components/add-item-modal'
const AddItemModalAny: any = AddItemModal

type Categoria = 'Protección Personal' | 'Materiales Eléctricos' | 'Herramientas' | 'Consumibles' | 'Todos'

interface ItemCompra {
  nro: number
  nombre: string
  codigo: string
  cantidad: number
  und: string
  categoria: Categoria
  proveedor: string
  precio_unitario: number
}

const itemsIniciales: ItemCompra[] = [
  { nro: 1, nombre: 'Guantes de latex', codigo: 'GLT-001', cantidad: 500, und: 'par', categoria: 'Protección Personal', proveedor: 'Suministros Costa Rica', precio_unitario: 1500 },
  { nro: 2, nombre: 'Guantes de algodón', codigo: 'GLA-002', cantidad: 300, und: 'par', categoria: 'Protección Personal', proveedor: 'Distribuidora Nacional', precio_unitario: 800 },
  { nro: 3, nombre: 'Barbijo N95', codigo: 'BAR-001', cantidad: 1000, und: 'unidad', categoria: 'Protección Personal', proveedor: 'Importaciones Médicas', precio_unitario: 2500 },
  { nro: 4, nombre: 'Barbijo quirúrgico', codigo: 'BAR-002', cantidad: 2000, und: 'unidad', categoria: 'Protección Personal', proveedor: 'Suministros Costa Rica', precio_unitario: 500 },
  { nro: 5, nombre: 'Gafas de seguridad', codigo: 'GAF-001', cantidad: 150, und: 'unidad', categoria: 'Protección Personal', proveedor: 'Ferretería Premium', precio_unitario: 5000 },
  { nro: 6, nombre: 'Casco de seguridad', codigo: 'CAS-001', cantidad: 100, und: 'unidad', categoria: 'Protección Personal', proveedor: 'Seguridad Laboral S.A.', precio_unitario: 8500 },
  { nro: 7, nombre: 'Alambre galvanizado #8', codigo: 'ALA-001', cantidad: 50, und: 'kg', categoria: 'Materiales Eléctricos', proveedor: 'Ferretería Nacional', precio_unitario: 3200 },
  { nro: 8, nombre: 'Alambre de cobre #10', codigo: 'ALA-002', cantidad: 30, und: 'kg', categoria: 'Materiales Eléctricos', proveedor: 'Electricidad y Conexiones', precio_unitario: 8500 },
  { nro: 9, nombre: 'Cable eléctrico 2x12', codigo: 'CAB-001', cantidad: 100, und: 'm', categoria: 'Materiales Eléctricos', proveedor: 'Suministros Eléctricos', precio_unitario: 1200 },
  { nro: 10, nombre: 'Interruptor simple', codigo: 'INT-001', cantidad: 200, und: 'unidad', categoria: 'Materiales Eléctricos', proveedor: 'Electricidad y Conexiones', precio_unitario: 2500 },
  { nro: 11, nombre: 'Tomacorriente doble', codigo: 'TOM-001', cantidad: 150, und: 'unidad', categoria: 'Materiales Eléctricos', proveedor: 'Ferretería Premium', precio_unitario: 3000 },
  { nro: 12, nombre: 'Martillo de goma', codigo: 'HER-001', cantidad: 50, und: 'unidad', categoria: 'Herramientas', proveedor: 'Herramientas Costa Rica', precio_unitario: 4500 },
  { nro: 13, nombre: 'Destornillador Phillips', codigo: 'HER-002', cantidad: 80, und: 'unidad', categoria: 'Herramientas', proveedor: 'Herramientas Costa Rica', precio_unitario: 2000 },
  { nro: 14, nombre: 'Llave inglesa 8"', codigo: 'HER-003', cantidad: 40, und: 'unidad', categoria: 'Herramientas', proveedor: 'Ferretería Premium', precio_unitario: 6000 },
  { nro: 15, nombre: 'Cinta métrica 5m', codigo: 'HER-004', cantidad: 100, und: 'unidad', categoria: 'Herramientas', proveedor: 'Herramientas Costa Rica', precio_unitario: 3500 },
  { nro: 16, nombre: 'Nivel de burbuja', codigo: 'HER-005', cantidad: 35, und: 'unidad', categoria: 'Herramientas', proveedor: 'Ferretería Nacional', precio_unitario: 8000 },
  { nro: 17, nombre: 'Pintura blanca mate', codigo: 'CON-001', cantidad: 200, und: 'litro', categoria: 'Consumibles', proveedor: 'Pinturas Nacionales', precio_unitario: 5500 },
  { nro: 18, nombre: 'Pintura negra brillo', codigo: 'CON-002', cantidad: 150, und: 'litro', categoria: 'Consumibles', proveedor: 'Pinturas Nacionales', precio_unitario: 6000 },
  { nro: 19, nombre: 'Thinner', codigo: 'CON-003', cantidad: 100, und: 'litro', categoria: 'Consumibles', proveedor: 'Químicos Costa Rica', precio_unitario: 4200 },
  { nro: 20, nombre: 'Clavos 2.5"', codigo: 'CON-004', cantidad: 5000, und: 'unidad', categoria: 'Consumibles', proveedor: 'Ferretería Nacional', precio_unitario: 50 },
  { nro: 21, nombre: 'Tornillos 1/4" x 2"', codigo: 'CON-005', cantidad: 2000, und: 'unidad', categoria: 'Consumibles', proveedor: 'Ferretería Premium', precio_unitario: 150 },
]

const categorias: Categoria[] = ['Todos', 'Protección Personal', 'Materiales Eléctricos', 'Herramientas', 'Consumibles']

export default function ComprasNacionalesPage() {
  const [items, setItems] = useState<ItemCompra[]>(itemsIniciales)
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria>('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)

  const itemsFiltrados = items.filter(item => {
    const matchesCategoria = selectedCategoria === 'Todos' || item.categoria === selectedCategoria
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategoria && matchesSearch
  })

  const toggleRow = (nro: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(nro) ? next.delete(nro) : next.add(nro)
      return next
    })
  }

  const handleAddItem = (form: any) => {
    const newItem: ItemCompra = {
      nro: items.length + 1,
      nombre: form.nombre || form.descripcion,
      codigo: form.codigo,
      cantidad: parseInt(form.stockTotal) || 0,
      und: form.und,
      categoria: form.categoria as Categoria,
      proveedor: form.proveedor || 'Por definir',
      precio_unitario: parseInt(form.precio_unitario) || 0,
    }
    setItems(prev => [...prev, newItem])
  }

  const totalValor = itemsFiltrados.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0)

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Compras Nacionales</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Inventario nacional — {items.length} ítems registrados</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar Ítem</span>
            <span className="sm:hidden">Agregar</span>
          </button>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Filtro de Categoría */}
          <div className="flex items-start sm:items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Categoría:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategoria === cat
                      ? 'bg-accent text-white'
                      : 'bg-border text-foreground hover:bg-border/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">ÍTEMS</p>
            <p className="text-2xl font-bold text-foreground">{itemsFiltrados.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">CANTIDAD TOTAL</p>
            <p className="text-2xl font-bold text-accent">{itemsFiltrados.reduce((acc, item) => acc + item.cantidad, 0)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">VALOR TOTAL</p>
            <p className="text-2xl font-bold text-foreground">Bs. {(totalValor / 1000000).toFixed(1)}M</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold text-foreground hidden sm:table-cell">n°</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground">Nombre</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground hidden md:table-cell">Código</th>
                  <th className="px-3 py-3 text-center font-semibold text-foreground">Cant.</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground hidden lg:table-cell">Categoría</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground hidden lg:table-cell">Proveedor</th>
                  <th className="px-3 py-3 text-right font-semibold text-foreground hidden xl:table-cell">V. Unit.</th>
                  <th className="px-3 py-3 text-right font-semibold text-foreground hidden xl:table-cell">Total</th>
                  <th className="px-3 py-3 text-center font-semibold text-foreground">Det.</th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((item) => {
                  const isExpanded = expandedRows.has(item.nro)
                  return (
                    <React.Fragment key={item.nro}>
                      <tr className={`border-b border-border hover:bg-border/10 transition-colors ${isExpanded ? 'bg-border/10' : ''}`}>
                        <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">{item.nro}</td>
                        <td className="px-3 py-3 font-medium text-foreground">{item.nombre}</td>
                        <td className="px-3 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{item.codigo}</td>
                        <td className="px-3 py-3 text-center font-bold text-accent">{item.cantidad}</td>
                        <td className="px-3 py-3 text-sm text-foreground hidden lg:table-cell">
                          <span className="inline-block px-2 py-1 bg-border/50 rounded text-xs">{item.categoria}</span>
                        </td>
                        <td className="px-3 py-3 text-sm text-foreground hidden lg:table-cell">{item.proveedor}</td>
                        <td className="px-3 py-3 text-right text-muted-foreground text-xs hidden xl:table-cell">
                          Bs. {item.precio_unitario.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-accent hidden xl:table-cell">
                          Bs. {(item.cantidad * item.precio_unitario).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => toggleRow(item.nro)}
                            className="inline-flex items-center justify-center p-1 hover:bg-border rounded transition-colors"
                          >
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-border/20 border-b border-border">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground font-mono mb-1">CÓDIGO</p>
                                <p className="text-sm font-semibold text-foreground">{item.codigo}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-mono mb-1">CATEGORÍA</p>
                                <p className="text-sm font-semibold text-foreground">{item.categoria}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-mono mb-1">PROVEEDOR</p>
                                <p className="text-sm font-semibold text-foreground">{item.proveedor}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-mono mb-1">CANTIDAD</p>
                                <p className="text-sm font-semibold text-accent">{item.cantidad} {item.und}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-mono mb-1">PRECIO UNITARIO</p>
                                <p className="text-sm font-semibold text-foreground">Bs. {item.precio_unitario.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-mono mb-1">VALOR TOTAL</p>
                                <p className="text-sm font-semibold text-accent">Bs. {(item.cantidad * item.precio_unitario).toLocaleString()}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Modal */}
      <AddItemModalAny
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddItem}
      />
    </AppShell>
  )
}
