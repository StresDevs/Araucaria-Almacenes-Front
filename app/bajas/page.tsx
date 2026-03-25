'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Trash2, Plus, Calendar, Trash, Edit2, Check } from 'lucide-react'

interface BajaItem {
  id: string
  codigo: string
  descripcion: string
  cantidad: number
  motivo: 'daño' | 'vencimiento' | 'robo' | 'perdida' | 'obsoleto' | 'otro'
  fecha: string
  registradoPor: string
  notas: string
}

const MOTIVOS_BAJA = [
  { id: 'daño', label: 'Daño', color: 'bg-red-900/20 text-red-400 border-red-600/30' },
  { id: 'vencimiento', label: 'Vencimiento', color: 'bg-orange-900/20 text-orange-400 border-orange-600/30' },
  { id: 'robo', label: 'Robo', color: 'bg-purple-900/20 text-purple-400 border-purple-600/30' },
  { id: 'perdida', label: 'Pérdida', color: 'bg-amber-900/20 text-amber-400 border-amber-600/30' },
  { id: 'obsoleto', label: 'Obsoleto', color: 'bg-gray-900/20 text-gray-400 border-gray-600/30' },
  { id: 'otro', label: 'Otro', color: 'bg-blue-900/20 text-blue-400 border-blue-600/30' },
]

const MOCK_BAJAS: BajaItem[] = [
  {
    id: '1',
    codigo: 'IND-001',
    descripcion: 'Casco de seguridad amarillo',
    cantidad: 5,
    motivo: 'daño',
    fecha: '2024-03-10',
    registradoPor: 'Juan García',
    notas: 'Dañados por accidente en obra',
  },
  {
    id: '2',
    codigo: 'MAT-002',
    descripcion: 'Arena m³',
    cantidad: 2,
    motivo: 'vencimiento',
    fecha: '2024-03-09',
    registradoPor: 'María López',
    notas: 'Vencimiento según etiqueta',
  },
  {
    id: '3',
    codigo: 'IND-003',
    descripcion: 'Guantes de cuero',
    cantidad: 15,
    motivo: 'perdida',
    fecha: '2024-03-08',
    registradoPor: 'Carlos Rodríguez',
    notas: 'Pérdida en transporte a sitio',
  },
  {
    id: '4',
    codigo: 'MAT-004',
    descripcion: 'Tubo PVC 4 pulgadas',
    cantidad: 8,
    motivo: 'daño',
    fecha: '2024-03-07',
    registradoPor: 'Ana Martínez',
    notas: 'Rotura durante manipuleo',
  },
  {
    id: '5',
    codigo: 'IND-002',
    descripcion: 'Chaleco reflectivo naranja',
    cantidad: 3,
    motivo: 'robo',
    fecha: '2024-03-06',
    registradoPor: 'Juan García',
    notas: 'Reporte de robo en almacén',
  },
]

export default function BajasPage() {
  const [bajas, setBajas] = useState<BajaItem[]>(MOCK_BAJAS)
  const [filtroMotivo, setFiltroMotivo] = useState('todos')
  const [isNewBajaOpen, setIsNewBajaOpen] = useState(false)
  const [newBaja, setNewBaja] = useState({
    codigo: '',
    descripcion: '',
    cantidad: '',
    motivo: 'daño' as const,
    notas: '',
  })

  const bajasFiltered = bajas.filter(
    baja => filtroMotivo === 'todos' || baja.motivo === filtroMotivo
  )

  const totalItemsDados = bajas.reduce((sum, baja) => sum + baja.cantidad, 0)
  const motivoMasComun = bajas.length > 0
    ? MOTIVOS_BAJA[MOTIVOS_BAJA.findIndex(m => m.id === bajas.reduce((prev, current) =>
      bajas.filter(b => b.motivo === prev).length > bajas.filter(b => b.motivo === current).length ? prev : current
    ))]?.label
    : '-'

  const handleAddBaja = () => {
    if (newBaja.codigo && newBaja.descripcion && newBaja.cantidad) {
      const baja: BajaItem = {
        id: (bajas.length + 1).toString(),
        codigo: newBaja.codigo,
        descripcion: newBaja.descripcion,
        cantidad: parseInt(newBaja.cantidad),
        motivo: newBaja.motivo,
        fecha: new Date().toISOString().split('T')[0],
        registradoPor: 'Usuario Admin',
        notas: newBaja.notas,
      }
      setBajas([baja, ...bajas])
      setNewBaja({
        codigo: '',
        descripcion: '',
        cantidad: '',
        motivo: 'daño',
        notas: '',
      })
      setIsNewBajaOpen(false)
    }
  }

  const handleDeleteBaja = (id: string) => {
    setBajas(bajas.filter(baja => baja.id !== id))
  }

  const getMotivoColor = (motivo: string) => {
    return MOTIVOS_BAJA.find(m => m.id === motivo)?.color || 'bg-gray-900/20 text-gray-400'
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Registro de Bajas</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Registra items dados de baja por daño, vencimiento, pérdida o robo</p>
          </div>
          <button
            onClick={() => setIsNewBajaOpen(true)}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Nueva Baja</span>
            <span className="xs:hidden">Nuevo</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-6">
            <p className="text-xs text-muted-foreground font-mono uppercase mb-1 sm:mb-2 leading-tight">Total Bajas</p>
            <p className="text-2xl sm:text-4xl font-bold text-foreground">{bajas.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-6">
            <p className="text-xs text-muted-foreground font-mono uppercase mb-1 sm:mb-2 leading-tight">Items Dados</p>
            <p className="text-2xl sm:text-4xl font-bold text-accent">{totalItemsDados}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-6">
            <p className="text-xs text-muted-foreground font-mono uppercase mb-1 sm:mb-2 leading-tight">Motivo Mayor</p>
            <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{motivoMasComun}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-4 h-4 text-accent" />
            <h2 className="text-base font-bold text-foreground">Filtros</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroMotivo('todos')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtroMotivo === 'todos'
                  ? 'bg-accent text-white'
                  : 'bg-border text-foreground hover:bg-border/80'
              }`}
            >
              Todos
            </button>
            {MOTIVOS_BAJA.map(motivo => (
              <button
                key={motivo.id}
                onClick={() => setFiltroMotivo(motivo.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filtroMotivo === motivo.id
                    ? 'bg-accent text-white'
                    : 'bg-border text-foreground hover:bg-border/80'
                }`}
              >
                {motivo.label}
              </button>
            ))}
          </div>
        </div>

        {/* New Baja Form */}
        {isNewBajaOpen && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Registrar Nueva Baja</h3>
              <button
                onClick={() => setIsNewBajaOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Código</label>
                <input
                  type="text"
                  value={newBaja.codigo}
                  onChange={(e) => setNewBaja({ ...newBaja, codigo: e.target.value })}
                  placeholder="Ej: IND-001"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={newBaja.cantidad}
                  onChange={(e) => setNewBaja({ ...newBaja, cantidad: e.target.value })}
                  placeholder="1"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">Descripción</label>
                <input
                  type="text"
                  value={newBaja.descripcion}
                  onChange={(e) => setNewBaja({ ...newBaja, descripcion: e.target.value })}
                  placeholder="Descripción del item"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">Motivo de Baja</label>
                <select
                  value={newBaja.motivo}
                  onChange={(e) => setNewBaja({ ...newBaja, motivo: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {MOTIVOS_BAJA.map(motivo => (
                    <option key={motivo.id} value={motivo.id}>{motivo.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">Notas</label>
                <textarea
                  value={newBaja.notas}
                  onChange={(e) => setNewBaja({ ...newBaja, notas: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsNewBajaOpen(false)}
                className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-border transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBaja}
                className="px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Registrar Baja
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-border/30">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase hidden sm:table-cell">Fecha</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase">Código</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase">Descripción</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-foreground uppercase">Cant.</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase">Motivo</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase hidden md:table-cell">Registrado</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-foreground uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bajasFiltered.map(baja => (
                  <tr key={baja.id} className="hover:bg-border/10 transition-colors">
                    <td className="px-3 py-3 text-sm text-foreground hidden sm:table-cell">{baja.fecha}</td>
                    <td className="px-3 py-3 font-mono text-xs text-accent font-bold">{baja.codigo}</td>
                    <td className="px-3 py-3 text-sm text-foreground max-w-[180px] truncate">{baja.descripcion}</td>
                    <td className="px-3 py-3 text-right text-sm font-bold text-foreground">{baja.cantidad}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getMotivoColor(baja.motivo)}`}>
                        {MOTIVOS_BAJA.find(m => m.id === baja.motivo)?.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground hidden md:table-cell">{baja.registradoPor}</td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleDeleteBaja(baja.id)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
                        title="Eliminar"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bajasFiltered.length === 0 && (
            <div className="p-8 text-center">
              <Trash2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay registros de bajas con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
