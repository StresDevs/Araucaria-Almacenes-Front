'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Download, Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

interface ConsumoDetalle {
  id: string
  material: string
  codigo: string
  und: string
  valor_unitario: number
}

interface ConsumoPorDepartamento {
  departamento: string
  cantidad: number
  consumo: ConsumoDetalle & { cantidad_consumida: number; valor_total: number }[]
}

interface ConsumoMaterial {
  id: string
  material: string
  codigo: string
  und: string
  valor_unitario: number
  categoria: string
  obra: string
  por_departamento: {
    [departamento: string]: number
  }
  total_consumido: number
  fecha: string
  contratista: string
}

const departamentos = ['MUROS 0130', 'PISO 0102', 'MUROS 0125', 'PISO 0064', 'MUROS 0042', 'PISO 0110', 'MUROS 0111', 'PISO 0112', 'MUROS 0109', 'PISO 0110', 'MUROS 0111', 'PISO 0124']

const reportesConsumoMock: ConsumoMaterial[] = [
  {
    id: 'cons-001',
    material: 'Porcelanato 30x60 cocina',
    codigo: 'YKL6000-B',
    und: 'caja',
    valor_unitario: 25000,
    categoria: 'Construcción',
    obra: 'Proyecto Residencial Centro',
    contratista: 'Juan Pérez López',
    fecha: '2024-03-20',
    total_consumido: 45,
    por_departamento: {
      'MUROS 0130': 8,
      'PISO 0102': 12,
      'MUROS 0125': 10,
      'PISO 0064': 15,
    },
  },
  {
    id: 'cons-002',
    material: 'Extractor',
    codigo: 'JQG9009X',
    und: 'pza',
    valor_unitario: 45000,
    categoria: 'Equipo y Herramientas',
    obra: 'Centro Comercial Zapote',
    contratista: 'María López Rodríguez',
    fecha: '2024-03-20',
    total_consumido: 12,
    por_departamento: {
      'MUROS 0042': 4,
      'PISO 0110': 5,
      'MUROS 0111': 3,
    },
  },
  {
    id: 'cons-003',
    material: 'Porcelanato 60x60 ales ivory',
    codigo: 'K0633525TA',
    und: 'caja',
    valor_unitario: 28000,
    categoria: 'Construcción',
    obra: 'Proyecto Residencial Centro',
    contratista: 'Juan Pérez López',
    fecha: '2024-03-19',
    total_consumido: 32,
    por_departamento: {
      'PISO 0112': 10,
      'MUROS 0109': 12,
      'PISO 0110': 10,
    },
  },
  {
    id: 'cons-004',
    material: 'Encimera cocina',
    codigo: 'GLG90506',
    und: 'pza',
    valor_unitario: 185000,
    categoria: 'Construcción',
    obra: 'Centro Comercial Zapote',
    contratista: 'María López Rodríguez',
    fecha: '2024-03-19',
    total_consumido: 18,
    por_departamento: {
      'MUROS 0111': 6,
      'PISO 0124': 8,
      'MUROS 0042': 4,
    },
  },
  {
    id: 'cons-005',
    material: 'Microonda',
    codigo: 'HW25800P-C2T',
    und: 'pza',
    valor_unitario: 120000,
    categoria: 'Equipo y Herramientas',
    obra: 'Conjunto Residencial La Guácima',
    contratista: 'Ana Martínez Soto',
    fecha: '2024-03-18',
    total_consumido: 8,
    por_departamento: {
      'PISO 0102': 3,
      'MUROS 0130': 5,
    },
  },
  {
    id: 'cons-006',
    material: 'Porcelanato 60x60 cocina - lav piso',
    codigo: 'YPJ086S',
    und: 'caja',
    valor_unitario: 26000,
    categoria: 'Construcción',
    obra: 'Ampliación Planta Industrial',
    contratista: 'Roberto Sánchez Vargas',
    fecha: '2024-03-18',
    total_consumido: 28,
    por_departamento: {
      'MUROS 0125': 10,
      'PISO 0064': 8,
      'MUROS 0042': 5,
      'PISO 0110': 5,
    },
  },
  {
    id: 'cons-007',
    material: 'Piso laminado 12mm 1212x198',
    codigo: 'YLM2869',
    und: 'caja',
    valor_unitario: 32000,
    categoria: 'Construcción',
    obra: 'Remodelación Edificio Administrativo',
    contratista: 'Carlos González Jiménez',
    fecha: '2024-03-17',
    total_consumido: 15,
    por_departamento: {
      'PISO 0112': 7,
      'MUROS 0109': 8,
    },
  },
  {
    id: 'cons-008',
    material: 'Moldura T 2700x20mm',
    codigo: 'Aluminium Moulding',
    und: 'pza',
    valor_unitario: 8500,
    categoria: 'Construcción',
    obra: 'Centro Comercial Zapote',
    contratista: 'María López Rodríguez',
    fecha: '2024-03-17',
    total_consumido: 42,
    por_departamento: {
      'MUROS 0130': 15,
      'PISO 0102': 12,
      'MUROS 0125': 10,
      'PISO 0064': 5,
    },
  },
]

export default function ReporteConsumoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterObra, setFilterObra] = useState('todas')
  const [filterMaterial, setFilterMaterial] = useState('todas')
  const [fromDate, setFromDate] = useState('2024-03-01')
  const [toDate, setToDate] = useState('2024-03-31')
  const [expandedMateriales, setExpandedMateriales] = useState<string[]>([])

  const obras = ['todas', ...new Set(reportesConsumoMock.map(r => r.obra))]
  const materiales = ['todas', ...new Set(reportesConsumoMock.map(r => r.material))]

  const filteredReportes = reportesConsumoMock.filter(reporte => {
    const reporteDate = new Date(reporte.fecha)
    const fromDateObj = new Date(fromDate)
    const toDateObj = new Date(toDate)
    
    const matchesSearch = reporte.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesObra = filterObra === 'todas' || reporte.obra === filterObra
    const matchesMaterial = filterMaterial === 'todas' || reporte.material === filterMaterial
    const matchesFecha = reporteDate >= fromDateObj && reporteDate <= toDateObj
    
    return matchesSearch && matchesObra && matchesMaterial && matchesFecha
  })

  const toggleExpanded = (materialId: string) => {
    setExpandedMateriales(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    )
  }

  const handleDescargar = () => {
    console.log('Descargando reporte de consumo por departamento')
  }

  const totalConsumo = filteredReportes.reduce((acc, r) => acc + (r.total_consumido * r.valor_unitario), 0)
  const totalItems = filteredReportes.reduce((acc, r) => acc + r.total_consumido, 0)
  const promedioPorItem = filteredReportes.length > 0 ? (totalConsumo / filteredReportes.length).toFixed(0) : '0'

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Reporte de Consumo por Departamento</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Análisis de distribución de consumo de materiales por departamento</p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-card border border-border rounded-lg p-4">
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">DESDE</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">HASTA</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">MATERIAL</label>
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {materiales.map(mat => (
                <option key={mat} value={mat}>{mat === 'todas' ? 'Todos' : mat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">OBRA</label>
            <select
              value={filterObra}
              onChange={(e) => setFilterObra(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {obras.map(obra => (
                <option key={obra} value={obra}>{obra === 'todas' ? 'Todas' : obra}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-mono mb-2">BUSCAR</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Material o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Cards Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">ÍTEMS CONSUMIDOS</p>
            <p className="text-2xl font-bold text-accent">{totalItems}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">TIPOS DE MATERIAL</p>
            <p className="text-2xl font-bold text-foreground">{filteredReportes.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">VALOR TOTAL CONSUMIDO</p>
            <p className="text-2xl font-bold text-accent">Bs. {(totalConsumo / 1000000).toFixed(1)}M</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">PROMEDIO POR MATERIAL</p>
            <p className="text-2xl font-bold text-foreground">Bs. {(parseInt(promedioPorItem) / 1000).toFixed(0)}K</p>
          </div>
        </div>

        {/* Tabla de Consumo por Departamento */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Consumo por Departamento</h3>
            <button
              onClick={handleDescargar}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Descargar Reporte
            </button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {filteredReportes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No hay datos disponibles para los filtros seleccionados
                </div>
              ) : (
                filteredReportes.map((material) => (
                  <div key={material.id} className="border-b border-border last:border-b-0">
                    {/* Fila Principal del Material */}
                    <button
                      onClick={() => toggleExpanded(material.id)}
                      className="w-full px-4 py-3 hover:bg-border/10 transition-colors flex items-center justify-between bg-border/5"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="flex-shrink-0">
                          {expandedMateriales.includes(material.id) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">{material.material}</p>
                          <p className="text-xs text-muted-foreground font-mono">CÓD: {material.codigo}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 flex-wrap justify-end">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-mono">CANTIDAD</p>
                            <p className="font-bold text-foreground">{material.total_consumido}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-mono">V. UNIT.</p>
                            <p className="text-xs font-mono text-accent">Bs. {(material.valor_unitario / 1000).toFixed(0)}K</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-mono">TOTAL</p>
                            <p className="font-bold text-accent">Bs. {((material.total_consumido * material.valor_unitario) / 1000).toFixed(0)}K</p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Detalle Expandible */}
                    {expandedMateriales.includes(material.id) && (
                      <div className="bg-background/50 border-t border-border">
                        <div className="p-4 space-y-4">
                          {/* Info General */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground font-mono mb-1">UNIDAD</p>
                              <p className="font-semibold text-foreground text-sm">{material.und}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-mono mb-1">OBRA</p>
                              <p className="font-semibold text-foreground text-sm">{material.obra}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-mono mb-1">CONTRATISTA</p>
                              <p className="font-semibold text-foreground text-sm">{material.contratista}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-mono mb-1">FECHA</p>
                              <p className="font-semibold text-foreground text-sm">{material.fecha}</p>
                            </div>
                          </div>

                          {/* Tabla de Departamentos */}
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs font-mono text-muted-foreground mb-3 uppercase">DISTRIBUCIÓN POR DEPARTAMENTO</p>
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(material.por_departamento)
                                .sort((a, b) => b[1] - a[1])
                                .map(([dept, cantidad]) => {
                                  const porcentaje = ((cantidad / material.total_consumido) * 100).toFixed(1)
                                  const totalDept = cantidad * material.valor_unitario
                                  return (
                                    <div key={dept} className="flex items-center justify-between bg-border/10 px-3 py-2 rounded text-sm">
                                      <div className="flex items-center gap-3 flex-1">
                                        <span className="font-mono text-xs text-muted-foreground min-w-24">{dept}</span>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-accent transition-all"
                                                style={{ width: `${porcentaje}%` }}
                                              />
                                            </div>
                                            <span className="text-xs text-muted-foreground min-w-12">{porcentaje}%</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right ml-4">
                                        <span className="font-bold text-foreground">{cantidad}</span>
                                        <span className="text-xs text-muted-foreground ml-1">und</span>
                                      </div>
                                      <div className="text-right ml-4 min-w-24">
                                        <span className="font-semibold text-accent text-xs">Bs. {(totalDept / 1000).toFixed(0)}K</span>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
