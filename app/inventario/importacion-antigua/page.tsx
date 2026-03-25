'use client'

import React, { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Filter, ChevronDown, Plus } from 'lucide-react'
import { AddItemModal, getItemImage } from '@/components/add-item-modal'

type Categoria = 'Construcción' | 'Seguridad' | 'Equipo y Herramientas' | 'Todos'


interface AlmacenUbicacion {
  almacen: string
  cantidad: number
}

interface ItemInventario {
  nro: number
  codigo: string
  descripcion: string
  und: string
  rendimiento: string
  categoria: Categoria
  stockTotal: number
  ubicaciones: AlmacenUbicacion[]
}

const itemsIniciales: ItemInventario[] = [
  { nro: 1, codigo: 'ZQM-037PP - 2200x900 sin marco', descripcion: 'puerta 2200x900 sin marco', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 5, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 3 }, { almacen: 'Almacén Anaya', cantidad: 2 }] },
  { nro: 2, codigo: 'ZQM-037PP - 2200x900 (10042)', descripcion: 'puerta 2200x900 (bedrooms 2200x900x150pp completo)', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 8, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 4 }, { almacen: 'Almacén Anaya', cantidad: 4 }] },
  { nro: 3, codigo: 'ZQM-037PP - 2200x800 (10043)', descripcion: 'puerta 2200x800 (bathrooms 2200x800x150pp)', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 6, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 3 }, { almacen: 'Almacén Anaya', cantidad: 3 }] },
  { nro: 4, codigo: 'ZQM-037PP - 2200x1000 (10041)', descripcion: 'puerta 2200x1000 (flush door principal 2200X1000X150) pp', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 4, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 2 }, { almacen: 'Almacén Anaya', cantidad: 2 }] },
  { nro: 5, codigo: 'ZQM-037(295)PP', descripcion: 'zocalos de pvc', und: 'caja', rendimiento: 'ml 24,40 (10 pzas)', categoria: 'Construcción', stockTotal: 15, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 8 }, { almacen: 'Almacén Anaya', cantidad: 7 }] },
  { nro: 6, codigo: 'ZQM-037(205)ARX', descripcion: 'zocalos de pvc', und: 'caja', rendimiento: 'ml 24,40 (10 pzas)', categoria: 'Construcción', stockTotal: 12, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 6 }, { almacen: 'Almacén Anaya', cantidad: 6 }] },
  { nro: 7, codigo: 'ZH 003 (04073)', descripcion: 'peldaño redondo blanco', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 20, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 12 }, { almacen: 'Almacén Anaya', cantidad: 8 }] },
  { nro: 8, codigo: 'ZF0021 (04071)', descripcion: 'redondo negro sobreponer', und: 'caja', rendimiento: '', categoria: 'Construcción', stockTotal: 18, ubicaciones: [{ almacen: 'Almacén Anaya', cantidad: 18 }] },
  { nro: 9, codigo: 'YPJ086S-A', descripcion: 'porcelanato 30x60', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 35, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 18 }, { almacen: 'Almacén Anaya', cantidad: 17 }] },
  { nro: 10, codigo: 'YPJ086S(Y96) (06102)', descripcion: 'porcelanato 60x60 TONO2', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 28, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 14 }, { almacen: 'Almacén Anaya', cantidad: 14 }] },
  { nro: 11, codigo: 'YPJ086S(Y60)', descripcion: 'porcelanato 60x60 TONO1', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 42, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 25 }, { almacen: 'Almacén Anaya', cantidad: 17 }] },
  { nro: 12, codigo: 'YMCN1006 (06042)', descripcion: 'mosaico 300x300 (1.98 metro de caja)', und: 'caja', rendimiento: '1.98 m2', categoria: 'Construcción', stockTotal: 31, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 16 }, { almacen: 'Almacén Anaya', cantidad: 15 }] },
  { nro: 13, codigo: 'YKL6000-B (06130)', descripcion: 'porcelanato 60x30', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 27, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 14 }, { almacen: 'Almacén Anaya', cantidad: 13 }] },
  { nro: 14, codigo: 'YHD9505/yhd95j (06103)', descripcion: 'porcelanato 45x90 (06100)', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 19, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 10 }, { almacen: 'Almacén Anaya', cantidad: 9 }] },
  { nro: 15, codigo: 'YDY061(60X60) (06064)', descripcion: 'porcelanato 60x60', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 24, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 12 }, { almacen: 'Almacén Anaya', cantidad: 12 }] },
  { nro: 16, codigo: 'YDY061(30X60) (06063)', descripcion: 'porcelanato 30x60', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 33, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 18 }, { almacen: 'Almacén Anaya', cantidad: 15 }] },
  { nro: 17, codigo: 'YDHL(D11-19-8)', descripcion: 'vidrio polarizado 900x2850', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 9, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 5 }, { almacen: 'Almacén Anaya', cantidad: 4 }] },
  { nro: 18, codigo: 'YCB060502 (06090)', descripcion: 'mosaico 300x300', und: 'caja', rendimiento: '', categoria: 'Construcción', stockTotal: 16, ubicaciones: [{ almacen: 'Almacén Anaya', cantidad: 16 }] },
  { nro: 19, codigo: 'YCB060501 (06104)', descripcion: 'mosaico 300x300', und: 'caja', rendimiento: '', categoria: 'Construcción', stockTotal: 22, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 11 }, { almacen: 'Almacén Anaya', cantidad: 11 }] },
  { nro: 20, codigo: 'YC6A112B-60x60 (06124)', descripcion: 'porcelanato 60x60', und: 'caja', rendimiento: '', categoria: 'Construcción', stockTotal: 14, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 7 }, { almacen: 'Almacén Anaya', cantidad: 7 }] },
  { nro: 21, codigo: 'YC6A112B-30x60 (06125)', descripcion: 'porcelanato 30x60', und: 'caja', rendimiento: '', categoria: 'Construcción', stockTotal: 26, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 13 }, { almacen: 'Almacén Anaya', cantidad: 13 }] },
  { nro: 22, codigo: 'Y137411', descripcion: 'tina', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 7, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 4 }, { almacen: 'Almacén Anaya', cantidad: 3 }] },
  { nro: 23, codigo: 'W-9', descripcion: 'marco de ventana de aluminio', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 11, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 6 }, { almacen: 'Almacén Anaya', cantidad: 5 }] },
]

const categorias: Categoria[] = ['Todos', 'Construcción', 'Seguridad', 'Equipo y Herramientas']

export default function ImportacionAntiguaPage() {
  const [items, setItems] = useState<ItemInventario[]>(itemsIniciales)
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria>('Todos')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)

  const itemsFiltrados = selectedCategoria === 'Todos'
    ? items
    : items.filter(item => item.categoria === selectedCategoria)

  const toggleRow = (nro: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(nro) ? next.delete(nro) : next.add(nro)
      return next
    })
  }

  const handleAddItem = (form: { codigo: string; descripcion: string; und: string; rendimiento: string; categoria: string; stockTotal: string }) => {
    const newItem: ItemInventario = {
      nro: items.length + 1,
      codigo: form.codigo,
      descripcion: form.descripcion,
      und: form.und,
      rendimiento: form.rendimiento,
      categoria: form.categoria as Categoria,
      stockTotal: parseInt(form.stockTotal) || 0,
      ubicaciones: [],
    }
    setItems(prev => [...prev, newItem])
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Ítems Importación Antigua</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Almacén Anaya — {items.length} ítems registrados</p>
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

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold text-foreground hidden sm:table-cell">n°</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground">Ítem</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground">Descripción</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground hidden md:table-cell">Categoría</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground">Und</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground">Stock</th>
                  <th className="px-3 py-3 text-left font-semibold text-foreground hidden lg:table-cell">Rendimiento</th>
                  <th className="px-3 py-3 text-center font-semibold text-foreground">Ubic.</th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((item) => (
                  <React.Fragment key={item.nro}>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 text-foreground hidden sm:table-cell">{item.nro}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={getItemImage(item.descripcion, item.codigo)}
                            alt={item.descripcion}
                            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border"
                          />
                          <span className="font-mono text-foreground text-xs leading-tight line-clamp-2 max-w-[120px]">{item.codigo}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-foreground text-xs sm:text-sm max-w-[160px] truncate">{item.descripcion}</td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-muted text-foreground">{item.categoria}</span>
                      </td>
                      <td className="px-3 py-3 text-foreground text-xs">{item.und}</td>
                      <td className="px-3 py-3 font-bold text-accent text-sm">{item.stockTotal}</td>
                      <td className="px-3 py-3 text-foreground text-xs hidden lg:table-cell">{item.rendimiento}</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleRow(item.nro)}
                          className="inline-flex items-center px-2 py-1 rounded bg-border hover:bg-border/80 transition-colors"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 text-foreground transition-transform ${expandedRows.has(item.nro) ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(item.nro) && (
                      <tr className="bg-muted/20 border-b border-border">
                        <td colSpan={8} className="px-3 py-3">
                          <div className="space-y-2">
                            <p className="font-semibold text-foreground text-sm mb-2">Ubicación en almacenes:</p>
                            {item.ubicaciones.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sin ubicaciones registradas.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {item.ubicaciones.map((ub, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                                    <span className="text-foreground font-medium text-sm">{ub.almacen}</span>
                                    <span className="px-3 py-1 rounded bg-accent/20 text-accent font-bold text-sm">{ub.cantidad} {item.und}</span>
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
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddItem}
        inventoryType="antigua"
      />
    </AppShell>
  )
}
