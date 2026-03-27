'use client'

import { useState, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { MOCK_ALMACENES_EXTERNOS, MOCK_ALMACENES_OBRA } from '@/lib/constants'
import { Download, Filter } from 'lucide-react'

interface TransferenciaRegistro {
  id: string
  fecha: string
  almacenOrigen: string
  almacenDestino: string
  items: { codigo: string; descripcion: string; cantidad: number; unidad: string }[]
  notas: string
  archivo?: string
}

export default function HistorialTransferenciasPage() {
  const allWarehouses = [...MOCK_ALMACENES_EXTERNOS, ...MOCK_ALMACENES_OBRA]
  
  const [filtroAlmacen, setFiltroAlmacen] = useState<string>('')
  const [filtroFecha, setFiltroFecha] = useState<string>('')
  const [filtroMaterial, setFiltroMaterial] = useState<string>('')

  // Mock datos de transferencias realizadas
  const transferenciasHistorial: TransferenciaRegistro[] = [
    {
      id: '1',
      fecha: '2024-03-15',
      almacenOrigen: 'Almacén Anaya Importación Antigua',
      almacenDestino: 'Obra Proyecto Centro',
      items: [
        { codigo: 'CEMENTO-50KG', descripcion: 'Cemento gris Portland tipo I', cantidad: 50, unidad: 'Bolsa' },
        { codigo: 'ACERO-CORR-8MM', descripcion: 'Acero corrugado grado 60', cantidad: 200, unidad: 'Kg' }
      ],
      notas: 'Necesarios para fundaciones del proyecto',
      archivo: 'orden-compra-032024.pdf'
    },
    {
      id: '2',
      fecha: '2024-03-14',
      almacenOrigen: 'Almacén Anaya Importación Nueva',
      almacenDestino: 'Almacén Anaya Importación Antigua',
      items: [
        { codigo: 'HILTI-TE-30', descripcion: 'Taladro perforador Hilti TE 30', cantidad: 3, unidad: 'Pieza' }
      ],
      notas: 'Consolidación de herramientas',
      archivo: 'consolidacion-herramientas.xlsx'
    },
    {
      id: '3',
      fecha: '2024-03-13',
      almacenOrigen: 'Almacén Anaya Importación Antigua',
      almacenDestino: 'Obra Reforma Oficinas',
      items: [
        { codigo: 'TUBING-PVC-2IN', descripcion: 'Tubería PVC schedula 40', cantidad: 80, unidad: 'Metro' }
      ],
      notas: 'Instalación de sistema de tuberías',
      archivo: undefined
    },
    {
      id: '4',
      fecha: '2024-03-12',
      almacenOrigen: 'Almacén Anaya Importación Nueva',
      almacenDestino: 'Almacén Anaya Importación Antigua',
      items: [
        { codigo: 'ANDAMIO-METAL', descripcion: 'Andamio metálico estándar', cantidad: 10, unidad: 'Pieza' }
      ],
      notas: 'Retorno de andamios después de obra',
      archivo: 'comprobante-retorno.pdf'
    },
    {
      id: '5',
      fecha: '2024-03-11',
      almacenOrigen: 'Almacén Anaya Importación Antigua',
      almacenDestino: 'Obra Proyecto Centro',
      items: [
        { codigo: 'SKF-6205-2RS', descripcion: 'Rodamiento de bolas profundo', cantidad: 25, unidad: 'Pieza' }
      ],
      notas: 'Recambios para equipos mecánicos',
      archivo: 'solicitud-repuestos.xlsx'
    }
  ]

  // Filtrar transferencias
  const transfereniasFiltradas = useMemo(() => {
    return transferenciasHistorial.filter(t => {
      const coincideFecha = !filtroFecha || t.fecha === filtroFecha
      const coincideAlmacen = !filtroAlmacen || t.almacenOrigen === filtroAlmacen || t.almacenDestino === filtroAlmacen
      const coincideMaterial = !filtroMaterial || t.items.some(item => 
        item.codigo.toLowerCase().includes(filtroMaterial.toLowerCase()) ||
        item.descripcion.toLowerCase().includes(filtroMaterial.toLowerCase())
      )
      return coincideFecha && coincideAlmacen && coincideMaterial
    })
  }, [filtroAlmacen, filtroFecha, filtroMaterial])

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Historial de Transferencias</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Visualiza y filtra todas las transferencias de materiales realizadas</p>
        </div>

        {/* Filtros */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-accent" />
            <h2 className="text-base font-bold text-foreground">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Filtro por Almacén */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Almacén</label>
              <select
                value={filtroAlmacen}
                onChange={(e) => setFiltroAlmacen(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
              >
                <option value="">Todos los almacenes</option>
                {allWarehouses.map(a => (
                  <option key={a.id} value={a.nombre}>{a.nombre}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Fecha */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Fecha</label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
              />
            </div>

            {/* Filtro por Material */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tipo de Material</label>
              <input
                type="text"
                placeholder="Buscar por código o descripción..."
                value={filtroMaterial}
                onChange={(e) => setFiltroMaterial(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
              />
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="space-y-4">
          {transfereniasFiltradas.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No hay transferencias que coincidan con los filtros seleccionados</p>
            </div>
          ) : (
            transfereniasFiltradas.map((transferencia) => (
              <div key={transferencia.id} className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Información de Transferencia */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                    <p className="font-bold text-foreground mb-4">{new Date(transferencia.fecha).toLocaleDateString('es-ES')}</p>

                    <p className="text-xs text-muted-foreground mb-1">De</p>
                    <p className="font-medium text-foreground mb-4">{transferencia.almacenOrigen}</p>

                    <p className="text-xs text-muted-foreground mb-1">Para</p>
                    <p className="font-medium text-accent mb-4">{transferencia.almacenDestino}</p>
                  </div>

                  {/* Notas y Archivo */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-foreground mb-4 text-sm">{transferencia.notas}</p>

                    {transferencia.archivo && (
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-accent" />
                        <a href="#" className="text-sm text-accent hover:underline">{transferencia.archivo}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ítems Transferidos */}
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-bold text-foreground mb-3">Ítems Transferidos ({transferencia.items.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {transferencia.items.map((item, idx) => (
                      <div key={idx} className="bg-background border border-border rounded p-3">
                        <p className="font-mono text-xs text-muted-foreground">{item.codigo}</p>
                        <p className="text-sm font-medium text-foreground">{item.descripcion}</p>
                        <p className="text-xs text-accent mt-2">{item.cantidad} {item.unidad}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
