'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Download, Search, Calendar } from 'lucide-react'

interface ReporteObra {
  id: string
  nombre_obra: string
  ubicacion: string
  responsable: string
  estado: 'activa' | 'finalizada'
  fecha_inicio: string
  items_entregados: number
  items_devueltos: number
  items_danios: number
  valor_total: number
  contratos: number
}

const reportesObrasMock: ReporteObra[] = [
  {
    id: 'obra-001',
    nombre_obra: 'Proyecto Residencial Centro',
    ubicacion: 'San José, Centro',
    responsable: 'Juan Pérez',
    estado: 'activa',
    fecha_inicio: '2024-01-15',
    items_entregados: 245,
    items_devueltos: 18,
    items_danios: 5,
    valor_total: 125000,
    contratos: 3,
  },
  {
    id: 'obra-002',
    nombre_obra: 'Centro Comercial Zapote',
    ubicacion: 'Zapote, San José',
    responsable: 'María López',
    estado: 'activa',
    fecha_inicio: '2024-02-01',
    items_entregados: 456,
    items_devueltos: 32,
    items_danios: 8,
    valor_total: 245000,
    contratos: 5,
  },
  {
    id: 'obra-003',
    nombre_obra: 'Remodelación Edificio Administrativo',
    ubicacion: 'Pavas, San José',
    responsable: 'Carlos González',
    estado: 'finalizada',
    fecha_inicio: '2023-10-01',
    items_entregados: 189,
    items_devueltos: 15,
    items_danios: 2,
    valor_total: 98000,
    contratos: 2,
  },
  {
    id: 'obra-004',
    nombre_obra: 'Conjunto Residencial La Guácima',
    ubicacion: 'La Guácima, Alajuela',
    responsable: 'Ana Martínez',
    estado: 'activa',
    fecha_inicio: '2024-03-10',
    items_entregados: 312,
    items_devueltos: 22,
    items_danios: 4,
    valor_total: 156000,
    contratos: 4,
  },
  {
    id: 'obra-005',
    nombre_obra: 'Ampliación Planta Industrial',
    ubicacion: 'Cartago, Cartago',
    responsable: 'Roberto Sánchez',
    estado: 'activa',
    fecha_inicio: '2024-01-20',
    items_entregados: 523,
    items_devueltos: 41,
    items_danios: 9,
    valor_total: 312000,
    contratos: 6,
  },
]

export default function ReportesObraPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<'todas' | 'activa' | 'finalizada'>('todas')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const filteredReportes = reportesObrasMock.filter(reporte => {
    const matchesSearch = reporte.nombre_obra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.responsable.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = filterEstado === 'todas' || reporte.estado === filterEstado
    return matchesSearch && matchesEstado
  })

  const handleDescargar = (obraId: string) => {
    console.log('Descargando reporte para obra:', obraId)
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Reportes por Obras</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Análisis de movimientos, consumo y daños por proyecto</p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card border border-border rounded-lg p-4">
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">BUSCAR</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Nombre, ubicación o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">ESTADO</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="todas">Todas</option>
              <option value="activa">Activas</option>
              <option value="finalizada">Finalizadas</option>
            </select>
          </div>
        </div>

        {/* Cards Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">OBRAS ACTIVAS</p>
            <p className="text-2xl font-bold text-foreground">
              {reportesObrasMock.filter(r => r.estado === 'activa').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">OBRAS FINALIZADAS</p>
            <p className="text-2xl font-bold text-foreground">
              {reportesObrasMock.filter(r => r.estado === 'finalizada').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">ÍTEMS TOTALES ENTREGADOS</p>
            <p className="text-2xl font-bold text-foreground">
              {reportesObrasMock.reduce((acc, r) => acc + r.items_entregados, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">VALOR TOTAL</p>
            <p className="text-2xl font-bold text-accent">
              Bs. {(reportesObrasMock.reduce((acc, r) => acc + r.valor_total, 0) / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Tabla de Reportes */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-border/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase hidden md:table-cell">Ubicación</th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase hidden lg:table-cell">Responsable</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Entregados</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Devueltos</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Daños</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Descargar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-border/10 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{reporte.nombre_obra}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-sm">{reporte.ubicacion}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-sm">{reporte.responsable}</td>
                    <td className="px-4 py-3 text-center font-semibold text-accent">{reporte.items_entregados}</td>
                    <td className="px-4 py-3 text-center text-foreground">{reporte.items_devueltos}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        reporte.items_danios > 5 ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {reporte.items_danios}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        reporte.estado === 'activa' ? 'bg-green-900/30 text-green-400' : 'bg-gray-900/30 text-gray-400'
                      }`}>
                        {reporte.estado === 'activa' ? 'Activa' : 'Finalizada'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDescargar(reporte.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
