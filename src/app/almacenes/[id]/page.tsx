'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import Link from 'next/link'
import { ChevronLeft, Search, Filter, Plus, Edit2, Move } from 'lucide-react'
import { MOCK_ALMACENES_EXTERNOS, MOCK_ALMACENES_OBRA, MOCK_ITEMS_CATALOGO } from '@/lib/constants'

export default function AlmacenDetailPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')
  
  // Combine all almacenes and find the one by id
  const allAlmacenes = [...MOCK_ALMACENES_EXTERNOS, ...MOCK_ALMACENES_OBRA]
  const almacen = allAlmacenes.find(a => a.id === params.id)

  // Mock detailed inventory items for this warehouse
  const inventoryItems = MOCK_ITEMS_CATALOGO.map((item, idx) => ({
    ...item,
    num: idx + 1,
    cantidad_actual: Math.floor(Math.random() * 500) + 10,
    saldo: Math.floor(Math.random() * 100),
  }))

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      item.codigo_fab.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.item_contab?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesFilter = filterTipo === 'todos' || item.tipo === filterTipo
    
    return matchesSearch && matchesFilter
  })

  if (!almacen) {
    return (
      <AppShell>
        <div className="p-6">
          <Link href="/almacenes" className="text-accent hover:underline">Volver a almacenes</Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Link 
            href="/almacenes" 
            className="flex items-center gap-2 text-accent hover:underline font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a Almacenes
          </Link>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-foreground text-balance">{almacen.nombre}</h1>
                <p className="text-muted-foreground mt-1 text-sm">{almacen.tipo}</p>
              </div>
              <span className="px-3 py-1 bg-green-900 text-green-200 rounded text-sm font-medium shrink-0">
                {almacen.estado}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Responsable</p>
                <p className="font-medium text-foreground">{almacen.responsable}</p>
              </div>
              {almacen.obra && (
                <div>
                  <p className="text-muted-foreground mb-1">Obra</p>
                  <p className="font-medium text-foreground">{almacen.obra}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">Total Ítems</p>
                <p className="font-bold text-accent text-lg">{almacen.items_count}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Tipo</p>
                <p className="text-foreground">{almacen.border_color === 'teal' ? 'Externo' : 'Obra'}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por código, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="bg-transparent text-foreground text-sm focus:outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="Imp. Nueva">Imp. Nueva</option>
                  <option value="Imp. Antigua">Imp. Antigua</option>
                </select>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm">
                <Plus className="w-4 h-4" />
                Agregar ítem
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase hidden sm:table-cell">N°</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Código</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase hidden md:table-cell">Ítem contab.</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Descripción</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase hidden sm:table-cell">Und</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">Cant.</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-semibold text-xs uppercase hidden sm:table-cell">Saldo</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase hidden lg:table-cell">Rendimiento</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase hidden md:table-cell">Tipo</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Act.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-background/50 transition-colors"
                    >
                      <td className="px-3 py-3 text-foreground hidden sm:table-cell">{idx + 1}</td>
                      <td className="px-3 py-3 text-foreground font-mono text-xs">{item.codigo_fab}</td>
                      <td className="px-3 py-3 text-foreground font-mono text-xs hidden md:table-cell">
                        {item.item_contab || '—'}
                      </td>
                      <td className="px-3 py-3 text-foreground max-w-[160px] truncate text-xs sm:text-sm">{item.descripcion}</td>
                      <td className="px-3 py-3 text-foreground text-xs hidden sm:table-cell">{item.unidad}</td>
                      <td className={`px-3 py-3 text-right font-bold text-sm ${
                        item.cantidad < 5 ? 'text-accent' : 'text-foreground'
                      }`}>
                        {item.cantidad}
                      </td>
                      <td className="px-3 py-3 text-right text-muted-foreground hidden sm:table-cell">{item.saldo || '—'}</td>
                      <td className="px-3 py-3 text-foreground text-xs hidden lg:table-cell">{item.rendimiento || '—'}</td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          item.tipo === 'Imp. Nueva'
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-border rounded transition-colors" title="Editar">
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-border rounded transition-colors" title="Movimiento">
                            <Move className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron ítems que coincidan con los filtros</p>
            </div>
          )}
      </div>
    </AppShell>
  )
}
