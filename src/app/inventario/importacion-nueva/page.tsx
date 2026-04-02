'use client'

import React, { useState, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { Search, ChevronDown, Plus, Loader2, PackagePlus, Pencil, Trash2 } from 'lucide-react'
import { AddItemModal } from '@/components/add-item-modal'
import { EditItemModal } from '@/components/edit-item-modal'
import { StockEntryModal } from '@/components/stock-entry-modal'
import { useInventario } from '@/hooks/use-inventario'
import { useCategorias } from '@/hooks/use-categorias'
import { useAlmacenes } from '@/hooks/use-almacenes'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { aprobacionesService, HttpError } from '@/services'
import type { ItemInventario } from '@/types'
import type { UpdateItemDto } from '@/services/endpoints/inventario.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? ''

function getItemImage(item: ItemInventario): string {
  if (item.foto_url) return `${API_BASE}/${item.foto_url}`
  const d = ((item.descripcion ?? '') + ' ' + item.codigo).toLowerCase()
  if (d.includes('porcelanato') || d.includes('mosaico') || d.includes('cristal')) return '/items/porcelanato.jpg'
  if (d.includes('puerta') || d.includes('door') || d.includes('flush')) return '/items/puerta.jpg'
  if (d.includes('piso') || d.includes('laminado') || d.includes('underlayment')) return '/items/piso-laminado.jpg'
  if (d.includes('extractor') || d.includes('encimera') || d.includes('horno') || d.includes('microonda')) return '/items/electrodomestico.jpg'
  return '/items/material-general.jpg'
}

export default function ImportacionNuevaPage() {
  const { items, isLoading, error, createItem, updateItem, uploadFoto, deleteItem, createEntradaStock } = useInventario('importacion_nueva')
  const { categorias } = useCategorias()
  const { almacenes } = useAlmacenes()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [selectedAlmacen, setSelectedAlmacen] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<ItemInventario | null>(null)
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
          item.codigo.toLowerCase().includes(term) ||
          (item.item_numero ?? '').toLowerCase().includes(term) ||
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

  const handleSubmitForApproval = async (itemId: string, justificacion: string, cambios: UpdateItemDto): Promise<boolean> => {
    try {
      await aprobacionesService.crearEdicionInventario({ itemId, justificacion, cambios })
      toast({ title: 'Solicitud enviada', description: 'Tu edición fue enviada para aprobación del administrador' })
      return true
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al enviar la solicitud'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
      return false
    }
  }

  const hasFilters = searchTerm || selectedCategoria || selectedAlmacen

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Ítems Importación Nueva</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">{items.length} ítems registrados</p>
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
              placeholder="Buscar por código, ítem n° o descripción..."
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

        {/* Table */}
        {!isLoading && !error && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[620px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-3 py-3 text-left font-semibold text-foreground hidden sm:table-cell">n°</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground">Ítem</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground">Descripción</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground hidden md:table-cell">Categoría</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground">Und</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground">Stock</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground hidden lg:table-cell">Rendimiento</th>
                    <th className="px-3 py-3 text-center font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsFiltrados.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-3 text-foreground hidden sm:table-cell">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getItemImage(item)}
                              alt={item.descripcion ?? item.codigo}
                              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border"
                            />
                            <span className="font-medium text-foreground text-xs sm:text-sm">{item.item_numero ?? item.codigo}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-foreground text-xs sm:text-sm max-w-[180px] truncate">{item.descripcion ?? '—'}</td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-muted text-foreground">{item.categoria_nombre ?? '—'}</span>
                        </td>
                        <td className="px-3 py-3 text-foreground text-xs">{item.unidad}</td>
                        <td className="px-3 py-3 font-bold text-accent text-sm">{item.stock_total}</td>
                        <td className="px-3 py-3 text-foreground text-xs hidden lg:table-cell">{item.rendimiento ?? ''}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditItem(item)}
                              title="Editar ítem"
                              className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setStockEntryItem(item)}
                              title="Registrar entrada"
                              className="p-1.5 rounded hover:bg-accent/20 text-accent transition-colors"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleRow(item.id)}
                              title="Ver ubicaciones"
                              className="p-1.5 rounded hover:bg-border transition-colors"
                            >
                              <ChevronDown className={`w-4 h-4 text-foreground transition-transform ${expandedRows.has(item.id) ? 'rotate-180' : ''}`} />
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
                      {expandedRows.has(item.id) && (
                        <tr className="bg-muted/20 border-b border-border">
                          <td colSpan={8} className="px-3 py-3">
                            <div className="space-y-2">
                              <p className="font-semibold text-foreground text-sm mb-2">Ubicación en almacenes:</p>
                              {item.ubicaciones.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Sin ubicaciones registradas.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {item.ubicaciones.map((ub) => (
                                    <div key={ub.almacen_id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                                      <span className="text-foreground font-medium text-sm">{ub.almacen_nombre ?? 'Almacén'}</span>
                                      <span className="px-3 py-1 rounded bg-accent/20 text-accent font-bold text-sm">{ub.cantidad} {item.unidad}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {itemsFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No se encontraron ítems.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AddItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddItem}
        inventoryType="nueva"
        categorias={categorias}
        almacenes={almacenes}
      />

      <EditItemModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={updateItem}
        onUploadFoto={uploadFoto}
        onSubmitForApproval={handleSubmitForApproval}
        item={editItem}
        categorias={categorias}
        userRole={user?.rol}
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
