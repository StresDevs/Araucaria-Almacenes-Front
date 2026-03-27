'use client'

import React, { useState, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { Search, ChevronDown, Plus, Loader2, PackagePlus, Trash2 } from 'lucide-react'
import { AddItemModal } from '@/components/add-item-modal'
import { StockEntryModal } from '@/components/stock-entry-modal'
import { useInventario } from '@/hooks/use-inventario'
import { useCategorias } from '@/hooks/use-categorias'
import { useProveedores } from '@/hooks/use-proveedores'
import { useAlmacenes } from '@/hooks/use-almacenes'
import type { ItemInventario } from '@/types'

export default function ComprasNacionalesPage() {
  const { items, isLoading, error, createItem, deleteItem, createEntradaStock } = useInventario('compra_nacional')
  const { categorias } = useCategorias()
  const { proveedores } = useProveedores()
  const { almacenes } = useAlmacenes()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [selectedAlmacen, setSelectedAlmacen] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [stockEntryItem, setStockEntryItem] = useState<ItemInventario | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const almacenesUnicos = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) {
      for (const ub of item.ubicaciones) {
        if (ub.almacen_nombre) map.set(ub.almacen_id, ub.almacen_nombre)
      }
    }
    return Array.from(map, ([id, nombre]) => ({ id, nombre }))
  }, [items])

  const itemsFiltrados = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return items.filter((item) => {
      if (selectedCategoria && item.categoria_nombre !== selectedCategoria) return false
      if (selectedAlmacen && !item.ubicaciones.some((ub) => ub.almacen_id === selectedAlmacen)) return false
      if (term) {
        const matchesSearch =
          (item.nombre ?? '').toLowerCase().includes(term) ||
          item.codigo.toLowerCase().includes(term) ||
          (item.proveedor_nombre ?? '').toLowerCase().includes(term) ||
          (item.descripcion ?? '').toLowerCase().includes(term)
        if (!matchesSearch) return false
      }
      return true
    })
  }, [items, searchTerm, selectedCategoria, selectedAlmacen])

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAddItem = async (dto: Parameters<typeof createItem>[0]) => {
    return createItem(dto)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ítem?')) return
    setDeletingId(id)
    await deleteItem(id)
    setDeletingId(null)
  }

  const handleStockEntry = async (itemId: string, almacenId: string, cantidad: number, descripcion?: string) => {
    return createEntradaStock(itemId, { almacenId, cantidad, descripcion })
  }

  const totalValor = itemsFiltrados.reduce((acc, item) => acc + (item.stock_total * (item.precio_unitario_bob ?? 0)), 0)

  const hasFilters = searchTerm || selectedCategoria || selectedAlmacen

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

        {/* Filtros */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, código, proveedor o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
              ))}
            </select>
            <select
              value={selectedAlmacen}
              onChange={(e) => setSelectedAlmacen(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Todos los almacenes</option>
              {almacenesUnicos.map((alm) => (
                <option key={alm.id} value={alm.id}>{alm.nombre}</option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategoria(''); setSelectedAlmacen('') }}
              className="text-xs text-accent hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando inventario...</span>
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{error}</div>
        )}

        {!isLoading && !error && (
          <>
            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground font-mono mb-1">ÍTEMS</p>
                <p className="text-2xl font-bold text-foreground">{itemsFiltrados.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground font-mono mb-1">CANTIDAD TOTAL</p>
                <p className="text-2xl font-bold text-accent">{itemsFiltrados.reduce((acc, item) => acc + item.stock_total, 0)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground font-mono mb-1">VALOR TOTAL</p>
                <p className="text-2xl font-bold text-foreground">Bs. {totalValor >= 1_000_000 ? `${(totalValor / 1_000_000).toFixed(1)}M` : totalValor.toLocaleString()}</p>
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
                      <th className="px-3 py-3 text-center font-semibold text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsFiltrados.map((item, idx) => {
                      const isExpanded = expandedRows.has(item.id)
                      const precioBob = item.precio_unitario_bob ?? 0
                      return (
                        <React.Fragment key={item.id}>
                          <tr className={`border-b border-border hover:bg-border/10 transition-colors ${isExpanded ? 'bg-border/10' : ''}`}>
                            <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">{idx + 1}</td>
                            <td className="px-3 py-3 font-medium text-foreground">{item.nombre ?? item.descripcion ?? item.codigo}</td>
                            <td className="px-3 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{item.codigo}</td>
                            <td className="px-3 py-3 text-center font-bold text-accent">{item.stock_total}</td>
                            <td className="px-3 py-3 text-sm text-foreground hidden lg:table-cell">
                              <span className="inline-block px-2 py-1 bg-border/50 rounded text-xs">{item.categoria_nombre ?? '—'}</span>
                            </td>
                            <td className="px-3 py-3 text-sm text-foreground hidden lg:table-cell">{item.proveedor_nombre ?? '—'}</td>
                            <td className="px-3 py-3 text-right text-muted-foreground text-xs hidden xl:table-cell">
                              {precioBob > 0 ? `Bs. ${precioBob.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-accent hidden xl:table-cell">
                              {precioBob > 0 ? `Bs. ${(item.stock_total * precioBob).toLocaleString()}` : '—'}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setStockEntryItem(item)}
                                  title="Registrar entrada"
                                  className="p-1.5 rounded hover:bg-accent/20 text-accent transition-colors"
                                >
                                  <PackagePlus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleRow(item.id)}
                                  title="Ver detalle"
                                  className="p-1.5 rounded hover:bg-border transition-colors"
                                >
                                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deletingId === item.id}
                                  title="Eliminar"
                                  className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                                >
                                  {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                              </div>
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
                                    <p className="text-sm font-semibold text-foreground">{item.categoria_nombre ?? '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-mono mb-1">PROVEEDOR</p>
                                    <p className="text-sm font-semibold text-foreground">{item.proveedor_nombre ?? '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-mono mb-1">CANTIDAD</p>
                                    <p className="text-sm font-semibold text-accent">{item.stock_total} {item.unidad}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-mono mb-1">PRECIO UNITARIO</p>
                                    <p className="text-sm font-semibold text-foreground">{precioBob > 0 ? `Bs. ${precioBob.toLocaleString()}` : '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-mono mb-1">VALOR TOTAL</p>
                                    <p className="text-sm font-semibold text-accent">{precioBob > 0 ? `Bs. ${(item.stock_total * precioBob).toLocaleString()}` : '—'}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                    {itemsFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No se encontraron ítems.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <AddItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddItem}
        inventoryType="nacional"
        categorias={categorias}
        proveedores={proveedores}
        almacenes={almacenes}
      />

      <StockEntryModal
        isOpen={!!stockEntryItem}
        onClose={() => setStockEntryItem(null)}
        item={stockEntryItem}
        almacenes={almacenes}
        onSubmit={handleStockEntry}
      />
    </AppShell>
  )
}
