'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { MOCK_MOVIMIENTOS, MOCK_ALMACENES_EXTERNOS, MOCK_ALMACENES_OBRA, MOCK_CONTRATISTAS } from '@/lib/constants'
import { Download, Eye, Search, Calendar } from 'lucide-react'

const REPORT_CARDS = [
  {
    id: 'stock',
    title: 'Stock por almacén',
    description: 'Inventario actual de todos los almacenes con cantidades y saldos',
  },
  {
    id: 'contratista',
    title: 'Historial por contratista',
    description: 'Todos los despachos, devoluciones y daños por contratista',
  },
  {
    id: 'danios',
    title: 'Daños y defectos',
    description: 'Registro de materiales dañados por contratistas y defectos de fábrica',
  },
  {
    id: 'trazabilidad',
    title: 'Trazabilidad de ítem',
    description: 'Historial completo de un ítem: de qué almacén vino, quién lo recibió, devoluciones',
  },
]

const MOVEMENT_TYPES = {
  solicitud_contratista: { label: 'Solicitud contratista', color: 'bg-blue-900/30 text-blue-400 border-blue-600/30' },
  distribucion: { label: 'Distribución', color: 'bg-teal-900/30 text-teal-400 border-teal-600/30' },
  devolucion_normal: { label: 'Devolución normal', color: 'bg-green-900/30 text-green-400 border-green-600/30' },
  devolucion_dano: { label: 'Devolución daño', color: 'bg-red-900/30 text-red-400 border-red-600/30' },
  defecto_fabrica: { label: 'Defecto fábrica', color: 'bg-amber-900/30 text-amber-400 border-amber-600/30' },
  traspaso_cierre: { label: 'Traspaso cierre', color: 'bg-purple-900/30 text-purple-400 border-purple-600/30' },
}

export default function ReportesPage() {
  const [fromDate, setFromDate] = useState('2024-03-01')
  const [toDate, setToDate] = useState('2024-03-13')
  const [filterAlmacen, setFilterAlmacen] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterContratista, setFilterContratista] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const allWarehouses = [...MOCK_ALMACENES_EXTERNOS, ...MOCK_ALMACENES_OBRA]

  // Filter movements
  const filteredMovimientos = MOCK_MOVIMIENTOS.filter(mov => {
    const matchesAlmacen = filterAlmacen === 'todos' || mov.almacen_origen === filterAlmacen || mov.almacen_destino === filterAlmacen
    const matchesTipo = filterTipo === 'todos' || mov.tipo === filterTipo
    const matchesContratista = filterContratista === '' || (mov.contratista?.toLowerCase().includes(filterContratista.toLowerCase()))
    return matchesAlmacen && matchesTipo && matchesContratista
  })

  const handleGenerarReporte = (reportId: string) => {
    setToastMessage(`Reporte "${reportId}" generado exitosamente`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const getMostRecentReport = () => {
    return new Date().toLocaleDateString('es-MX')
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Reportes y Auditoría</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Centro de reportes e historial de movimientos</p>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-8 right-8 bg-green-900/30 border border-green-600/30 text-green-400 px-4 py-3 rounded-lg text-sm font-medium">
            {toastMessage}
          </div>
        )}

        {/* Report Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {REPORT_CARDS.map(report => (
            <div key={report.id} className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Últimos generados: {getMostRecentReport()}</p>
                <button
                  onClick={() => handleGenerarReporte(report.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg font-medium hover:bg-accent/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Generar reporte
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Historial de Movimientos */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Historial de Movimientos</h2>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-2">DESDE</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-2">HASTA</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-2">ALMACÉN</label>
              <select
                value={filterAlmacen}
                onChange={(e) => setFilterAlmacen(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="todos">Todos</option>
                {allWarehouses.map(w => (
                  <option key={w.id} value={w.nombre}>{w.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-2">TIPO</label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="todos">Todos</option>
                {Object.entries(MOVEMENT_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-2">CONTRATISTA</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filterContratista}
                  onChange={(e) => setFilterContratista(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-border/30">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Fecha</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Tipo</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Ítem</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase hidden md:table-cell">Origen</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase hidden md:table-cell">Destino</th>
                  <th className="px-3 py-3 text-right text-xs font-mono font-semibold text-foreground uppercase">Cant.</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase hidden lg:table-cell">Contratista</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase hidden lg:table-cell">Registrado por</th>
                  <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Det.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMovimientos.map(mov => {
                  const typeInfo = MOVEMENT_TYPES[mov.tipo as keyof typeof MOVEMENT_TYPES]
                  const isExpanded = expandedRow === mov.id
                  return (
                    <tr key={mov.id} className={`hover:bg-border/10 transition-colors ${isExpanded ? 'bg-border/10' : ''}`}>
                      <td className="px-4 py-3 text-muted-foreground">{mov.fecha}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-mono text-accent font-bold text-xs">{mov.codigo_item}</p>
                          <p className="text-foreground line-clamp-1 max-w-xs">{mov.descripcion_item}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-foreground hidden md:table-cell">{mov.almacen_origen}</td>
                      <td className="px-3 py-3 text-sm text-foreground hidden md:table-cell">{mov.almacen_destino}</td>
                      <td className="px-3 py-3 text-right text-foreground font-bold">{mov.cantidad}</td>
                      <td className="px-3 py-3 text-sm text-foreground hidden lg:table-cell">{mov.contratista || '—'}</td>
                      <td className="px-3 py-3 text-sm text-foreground hidden lg:table-cell">{mov.registrado_por}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : mov.id)}
                          className="p-1 hover:bg-border rounded transition-colors"
                        >
                          <Eye className="w-4 h-4 text-muted hover:text-foreground" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>

          {/* Expanded details */}
          {expandedRow && (
            <div className="border-t border-border mt-6 pt-6">
              {MOCK_MOVIMIENTOS.find(m => m.id === expandedRow) && (
                <div className="bg-border/20 rounded-lg p-6">
                  <h3 className="font-bold text-foreground mb-4">Detalles del Movimiento</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">ID Movimiento</p>
                      <p className="text-foreground font-mono font-bold">{expandedRow}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">Fecha</p>
                      <p className="text-foreground">{MOCK_MOVIMIENTOS.find(m => m.id === expandedRow)?.fecha}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground font-mono mb-1">Motivo / Observaciones</p>
                      <p className="text-foreground">{MOCK_MOVIMIENTOS.find(m => m.id === expandedRow)?.motivo || 'Sin observaciones'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground font-mono mb-1">Auditoría</p>
                      <p className="text-foreground text-sm">Registrado por {MOCK_MOVIMIENTOS.find(m => m.id === expandedRow)?.registrado_por} • {new Date().toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedRow(null)}
                    className="mt-4 px-4 py-2 bg-border text-foreground rounded hover:bg-border/80 transition-colors text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          )}

          {filteredMovimientos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay movimientos que coincidan con los filtros</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
