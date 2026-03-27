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
  item: string
  codigo: string
  descripcion: string
  und: string
  rendimiento: string
  categoria: Categoria
  stockTotal: number
  ubicaciones: AlmacenUbicacion[]
}

const itemsIniciales: ItemInventario[] = [
  { nro: 259, item: '9013', codigo: 'JQG9009X', descripcion: 'EXTRACTOR', und: 'pza', rendimiento: '', categoria: 'Equipo y Herramientas', stockTotal: 15, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 8 }, { almacen: 'Almacén Anaya', cantidad: 7 }] },
  { nro: 260, item: '9014', codigo: 'GLG90506', descripcion: 'ENCIMERA COCINA', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 12, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 5 }, { almacen: 'Almacén Anaya', cantidad: 7 }] },
  { nro: 261, item: '9006', codigo: 'HW25800P-C2T', descripcion: 'MICROONDA', und: 'pza', rendimiento: '', categoria: 'Equipo y Herramientas', stockTotal: 8, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 8 }] },
  { nro: 262, item: '9016', codigo: 'KSG7003AT', descripcion: 'HORNO ELECTRICO', und: 'pza', rendimiento: '', categoria: 'Equipo y Herramientas', stockTotal: 10, ubicaciones: [{ almacen: 'Almacén Anaya', cantidad: 10 }] },
  { nro: 263, item: '9025', codigo: 'EIG76203', descripcion: 'ENCIMERA COCINA ELECTRICA', und: 'pza', rendimiento: '', categoria: 'Equipo y Herramientas', stockTotal: 6, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 3 }, { almacen: 'Almacén Anaya', cantidad: 3 }] },
  { nro: 264, item: '9013', codigo: 'JQG9009X', descripcion: 'embellecedores extractores de cocina', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 20, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 12 }, { almacen: 'Almacén Anaya', cantidad: 8 }] },
  { nro: 265, item: '6130', codigo: 'YKL6000-B', descripcion: 'porcelanato 30x60 cocina - lav muro', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 45, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 25 }, { almacen: 'Almacén Anaya', cantidad: 20 }] },
  { nro: 266, item: '6102', codigo: 'YPJ086S', descripcion: 'porcelanato 60x60 cocina - lav piso', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 38, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 18 }, { almacen: 'Almacén Anaya', cantidad: 20 }] },
  { nro: 267, item: '6125', codigo: 'YC6A112B', descripcion: 'porcelanato 30x60', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 32, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 15 }, { almacen: 'Almacén Anaya', cantidad: 17 }] },
  { nro: 268, item: '6042', codigo: 'YMCN1006', descripcion: 'cristal mosaico 30x30', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 28, ubicaciones: [{ almacen: 'Almacén Anaya', cantidad: 28 }] },
  { nro: 269, item: '6110', codigo: 'K0633525TA', descripcion: 'porcelanato 60x60 ales ivory', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 50, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 30 }, { almacen: 'Almacén Anaya', cantidad: 20 }] },
  { nro: 270, item: '6111', codigo: 'K0633525TA', descripcion: 'porcelanato 30x60 ales ivory', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 35, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 20 }, { almacen: 'Almacén Anaya', cantidad: 15 }] },
  { nro: 271, item: '6105', codigo: 'K012266854tam', descripcion: 'porcelanato 1200x600 tiroll mat', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 22, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 12 }, { almacen: 'Almacén Anaya', cantidad: 10 }] },
  { nro: 272, item: '6135', codigo: 'K012266854tam', descripcion: 'porcelanato 600x600 tiroll ash', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 19, ubicaciones: [{ almacen: 'Almacén Anaya', cantidad: 19 }] },
  { nro: 273, item: '6118', codigo: 'K0603520TA', descripcion: 'porcelanato 60x60 CASSERO ASH', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 42, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 25 }, { almacen: 'Almacén Anaya', cantidad: 17 }] },
  { nro: 274, item: '6069', codigo: 'K0633516DT', descripcion: 'Glaze Decor 300x600', und: 'caja', rendimiento: '', categoria: 'Construcción', stockTotal: 16, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 16 }] },
  { nro: 275, item: '6124', codigo: 'YC6A112B', descripcion: 'porcelanato 60x60', und: 'caja', rendimiento: '1.44 m2', categoria: 'Construcción', stockTotal: 29, ubicaciones: [{ almacen: 'Almacén Anaya', cantidad: 29 }] },
  { nro: 276, item: '6131', codigo: 'YLM2869', descripcion: 'piso laminado 12mm 1212x198', und: 'caja', rendimiento: '2.64 m2', categoria: 'Construcción', stockTotal: 24, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 14 }, { almacen: 'Almacén Anaya', cantidad: 10 }] },
  { nro: 277, item: '6059', codigo: 'Underlayment EPE 3mm YFE4-3-4', descripcion: 'lámina niveladora de piso', und: 'rollo', rendimiento: '18.58 m2', categoria: 'Construcción', stockTotal: 11, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 6 }, { almacen: 'Almacén Anaya', cantidad: 5 }] },
  { nro: 278, item: '2060', codigo: 'Aluminium Moulding', descripcion: 'moldura T 2700x20mm', und: 'pza', rendimiento: '2.7 m', categoria: 'Construcción', stockTotal: 18, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 10 }, { almacen: 'Almacén Anaya', cantidad: 8 }] },
  { nro: 279, item: '10041', codigo: 'Flush Door Principal 2200x1000x150', descripcion: 'puerta 2200x1000 - derecha + marco', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 7, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 4 }, { almacen: 'Almacén Anaya', cantidad: 3 }] },
  { nro: 280, item: '10041', codigo: 'Flush Door Principal 2200x1000x150', descripcion: 'puerta 2200x1000 - izquierda + marco', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 7, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 3 }, { almacen: 'Almacén Anaya', cantidad: 4 }] },
  { nro: 281, item: '10042', codigo: 'Flush Door Int Bedrooms 2200x900x150', descripcion: 'puerta 2200x900 dormitorio - derecha + marco', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 9, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 5 }, { almacen: 'Almacén Anaya', cantidad: 4 }] },
  { nro: 282, item: '10042', codigo: 'Flush Door Int Bedrooms 2200x900x150', descripcion: 'puerta 2200x900 dormitorio - izquierda + marco', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 9, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 4 }, { almacen: 'Almacén Anaya', cantidad: 5 }] },
  { nro: 283, item: '10043', codigo: 'Flush Door Int Bathrooms 2200x800x150', descripcion: 'puerta 2200x800 baño - derecha + marco', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 8, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 4 }, { almacen: 'Almacén Anaya', cantidad: 4 }] },
  { nro: 284, item: '10043', codigo: 'Flush Door Int Bathrooms 2200x800x150', descripcion: 'puerta 2200x800 baño - izquierda + marco', und: 'pza', rendimiento: '', categoria: 'Construcción', stockTotal: 8, ubicaciones: [{ almacen: 'Almacén Central', cantidad: 5 }, { almacen: 'Almacén Anaya', cantidad: 3 }] },
]

const categorias: Categoria[] = ['Todos', 'Construcción', 'Seguridad', 'Equipo y Herramientas']

export default function ImportacionNuevaPage() {
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
    const newNro = Math.max(...items.map(i => i.nro)) + 1
    const newItem: ItemInventario = {
      nro: newNro,
      item: String(newNro),
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Ítems Importación Nueva</h1>
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
            <table className="w-full text-sm min-w-[560px]">
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
                          <span className="font-medium text-foreground text-xs sm:text-sm">{item.item}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-foreground text-xs sm:text-sm max-w-[180px] truncate">{item.descripcion}</td>
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
                        <td colSpan={9} className="px-3 py-3">
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
        inventoryType="nueva"
      />
    </AppShell>
  )
}
