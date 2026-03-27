'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Download, Search, TrendingDown } from 'lucide-react'

interface ReporteMaterial {
  id: string
  codigo: string
  descripcion: string
  categoria: string
  und: string
  stock_inicial: number
  stock_entregado: number
  stock_devuelto: number
  stock_danio: number
  stock_final: number
  valor_unitario: number
  tendencia: 'subida' | 'bajada' | 'estable'
}

const reportesMaterialesMock: ReporteMaterial[] = [
  {
    id: 'mat-001',
    codigo: 'YKL6000-B',
    descripcion: 'Porcelanato 30x60 cocina - lav muro',
    categoria: 'Construcción',
    und: 'caja',
    stock_inicial: 150,
    stock_entregado: 95,
    stock_devuelto: 8,
    stock_danio: 3,
    stock_final: 60,
    valor_unitario: 25000,
    tendencia: 'bajada',
  },
  {
    id: 'mat-002',
    codigo: 'K0633525TA',
    descripcion: 'Porcelanato 60x60 ales ivory',
    categoria: 'Construcción',
    und: 'caja',
    stock_inicial: 120,
    stock_entregado: 75,
    stock_devuelto: 12,
    stock_danio: 2,
    stock_final: 43,
    valor_unitario: 28000,
    tendencia: 'bajada',
  },
  {
    id: 'mat-003',
    codigo: 'JQG9009X',
    descripcion: 'Extractor',
    categoria: 'Equipo y Herramientas',
    und: 'pza',
    stock_inicial: 45,
    stock_entregado: 22,
    stock_devuelto: 5,
    stock_danio: 1,
    stock_final: 17,
    valor_unitario: 45000,
    tendencia: 'bajada',
  },
  {
    id: 'mat-004',
    codigo: 'HW25800P-C2T',
    descripcion: 'Microonda',
    categoria: 'Equipo y Herramientas',
    und: 'pza',
    stock_inicial: 30,
    stock_entregado: 15,
    stock_devuelto: 2,
    stock_danio: 0,
    stock_final: 13,
    valor_unitario: 120000,
    tendencia: 'bajada',
  },
  {
    id: 'mat-005',
    codigo: 'GLG90506',
    descripcion: 'Encimera cocina',
    categoria: 'Construcción',
    und: 'pza',
    stock_inicial: 60,
    stock_entregado: 38,
    stock_devuelto: 6,
    stock_danio: 2,
    stock_final: 14,
    valor_unitario: 185000,
    tendencia: 'bajada',
  },
  {
    id: 'mat-006',
    codigo: 'YPJ086S',
    descripcion: 'Porcelanato 60x60 cocina - lav piso',
    categoria: 'Construcción',
    und: 'caja',
    stock_inicial: 100,
    stock_entregado: 65,
    stock_devuelto: 10,
    stock_danio: 1,
    stock_final: 24,
    valor_unitario: 26000,
    tendencia: 'bajada',
  },
]

export default function ReportesMaterialPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')
  const [sortBy, setSortBy] = useState<'consumo' | 'daños' | 'stock'>('consumo')

  const categorias = ['todas', ...new Set(reportesMaterialesMock.map(r => r.categoria))]

  const filteredReportes = reportesMaterialesMock.filter(reporte => {
    const matchesSearch = reporte.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria = filterCategoria === 'todas' || reporte.categoria === filterCategoria
    return matchesSearch && matchesCategoria
  })

  const sortedReportes = [...filteredReportes].sort((a, b) => {
    if (sortBy === 'consumo') return b.stock_entregado - a.stock_entregado
    if (sortBy === 'daños') return b.stock_danio - a.stock_danio
    return a.stock_final - b.stock_final
  })

  const handleDescargar = (materialId: string) => {
    console.log('Descargando reporte para material:', materialId)
  }

  const totalValor = reportesMaterialesMock.reduce((acc, r) => acc + (r.stock_final * r.valor_unitario), 0)
  const totalConsumido = reportesMaterialesMock.reduce((acc, r) => acc + r.stock_entregado, 0)
  const totalDanios = reportesMaterialesMock.reduce((acc, r) => acc + r.stock_danio, 0)

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Reportes por Material</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Análisis de consumo y disponibilidad de materiales</p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card border border-border rounded-lg p-4">
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">BUSCAR</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">CATEGORÍA</label>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat === 'todas' ? 'Todas' : cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">ORDENAR POR</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="consumo">Mayor consumo</option>
              <option value="daños">Mayor daño</option>
              <option value="stock">Menor stock</option>
            </select>
          </div>
        </div>

        {/* Cards Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">CONSUMO TOTAL (ÍTEMS)</p>
            <p className="text-2xl font-bold text-accent">{totalConsumido}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">DAÑOS REGISTRADOS</p>
            <p className="text-2xl font-bold text-red-400">{totalDanios}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">VALOR STOCK ACTUAL</p>
            <p className="text-2xl font-bold text-foreground">
              Bs. {(totalValor / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Tabla de Reportes */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-border/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Material</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase hidden sm:table-cell">Inicial</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Consumido</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase hidden md:table-cell">Daños</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Stock Final</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase hidden lg:table-cell">V. Unit</th>
                  <th className="px-4 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Descargar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedReportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-border/10 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-accent text-sm">{reporte.codigo}</td>
                    <td className="px-4 py-3 text-foreground text-sm">{reporte.descripcion}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">{reporte.stock_inicial}</td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">{reporte.stock_entregado}</td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        reporte.stock_danio > 3 ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {reporte.stock_danio}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-accent">{reporte.stock_final}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground hidden lg:table-cell text-xs">
                      Bs. {(reporte.valor_unitario / 1000).toFixed(0)}K
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
