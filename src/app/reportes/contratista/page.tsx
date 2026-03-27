'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Download, Search } from 'lucide-react'

interface ReporteContratista {
  id: string
  nombre: string
  empresa: string
  telefono: string
  email: string
  estado: 'activo' | 'inactivo'
  items_entregados: number
  items_devueltos: number
  items_danios: number
  obras_activas: number
  valor_total_movimientos: number
  porcentaje_danos: number
}

const reportesContratistasMock: ReporteContratista[] = [
  {
    id: 'cont-001',
    nombre: 'Juan Pérez López',
    empresa: 'Constructora Pérez S.A.',
    telefono: '+506 8765-4321',
    email: 'juan.perez@constructora.cr',
    estado: 'activo',
    items_entregados: 245,
    items_devueltos: 18,
    items_danios: 5,
    obras_activas: 2,
    valor_total_movimientos: 125000,
    porcentaje_danos: 2.04,
  },
  {
    id: 'cont-002',
    nombre: 'María López Rodríguez',
    empresa: 'Empresa Constructora López',
    telefono: '+506 8765-1234',
    email: 'maria.lopez@constructora.cr',
    estado: 'activo',
    items_entregados: 456,
    items_devueltos: 32,
    items_danios: 12,
    obras_activas: 3,
    valor_total_movimientos: 245000,
    porcentaje_danos: 2.63,
  },
  {
    id: 'cont-003',
    nombre: 'Carlos González Jiménez',
    empresa: 'Grupos Constructores Inc.',
    telefono: '+506 8765-5678',
    email: 'carlos.gonzalez@gruposconstructores.cr',
    estado: 'activo',
    items_entregados: 189,
    items_devueltos: 15,
    items_danios: 2,
    obras_activas: 1,
    valor_total_movimientos: 98000,
    porcentaje_danos: 1.06,
  },
  {
    id: 'cont-004',
    nombre: 'Ana Martínez Soto',
    empresa: 'Construcciones Martinex',
    telefono: '+506 8765-9012',
    email: 'ana.martinez@construcciones.cr',
    estado: 'activo',
    items_entregados: 312,
    items_devueltos: 22,
    items_danios: 8,
    obras_activas: 2,
    valor_total_movimientos: 156000,
    porcentaje_danos: 2.56,
  },
  {
    id: 'cont-005',
    nombre: 'Roberto Sánchez Vargas',
    empresa: 'Inmobiliaria Sánchez',
    telefono: '+506 8765-3456',
    email: 'roberto.sanchez@inmobiliaria.cr',
    estado: 'inactivo',
    items_entregados: 523,
    items_devueltos: 41,
    items_danios: 15,
    obras_activas: 0,
    valor_total_movimientos: 312000,
    porcentaje_danos: 2.87,
  },
]

export default function ReportesContratistaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [sortBy, setSortBy] = useState<'entregados' | 'danios' | 'obras'>('entregados')

  const filteredReportes = reportesContratistasMock.filter(reporte => {
    const matchesSearch = reporte.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.empresa.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = filterEstado === 'todos' || reporte.estado === filterEstado
    return matchesSearch && matchesEstado
  })

  const sortedReportes = [...filteredReportes].sort((a, b) => {
    if (sortBy === 'entregados') return b.items_entregados - a.items_entregados
    if (sortBy === 'danios') return b.items_danios - a.items_danios
    return b.obras_activas - a.obras_activas
  })

  const handleDescargar = (contratistaId: string) => {
    console.log('Descargando reporte para contratista:', contratistaId)
  }

  const totalContratistas = reportesContratistasMock.length
  const totalActivos = reportesContratistasMock.filter(r => r.estado === 'activo').length
  const promedioDanos = (reportesContratistasMock.reduce((acc, r) => acc + r.porcentaje_danos, 0) / reportesContratistasMock.length).toFixed(2)

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Reportes por Contratista</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Desempeño y análisis de movimientos por contratista</p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card border border-border rounded-lg p-4">
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">BUSCAR</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Nombre o empresa..."
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
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">ORDENAR POR</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="entregados">Mayor entrega</option>
              <option value="danios">Mayor daño</option>
              <option value="obras">Más obras</option>
            </select>
          </div>
        </div>

        {/* Cards Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">CONTRATISTAS ACTIVOS</p>
            <p className="text-2xl font-bold text-accent">{totalActivos}/{totalContratistas}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">ÍTEMS ENTREGADOS</p>
            <p className="text-2xl font-bold text-foreground">
              {reportesContratistasMock.reduce((acc, r) => acc + r.items_entregados, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">DAÑOS REGISTRADOS</p>
            <p className="text-2xl font-bold text-red-400">
              {reportesContratistasMock.reduce((acc, r) => acc + r.items_danios, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">PROMEDIO DAÑOS %</p>
            <p className="text-2xl font-bold text-yellow-400">{promedioDanos}%</p>
          </div>
        </div>

        {/* Tabla de Reportes */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-border/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Contratista</th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase hidden sm:table-cell">Empresa</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Entregados</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Daños</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase hidden md:table-cell">Obras</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Descargar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedReportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-border/10 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{reporte.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm hidden sm:table-cell">{reporte.empresa}</td>
                    <td className="px-4 py-3 text-center font-semibold text-accent">{reporte.items_entregados}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        reporte.items_danios > 10 ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {reporte.items_danios} ({reporte.porcentaje_danos.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-foreground hidden md:table-cell">{reporte.obras_activas}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        reporte.estado === 'activo' ? 'bg-green-900/30 text-green-400' : 'bg-gray-900/30 text-gray-400'
                      }`}>
                        {reporte.estado === 'activo' ? 'Activo' : 'Inactivo'}
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
