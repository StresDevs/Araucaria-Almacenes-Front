'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { MOCK_CONTROL_ALMACEN, type RegistroControlAlmacen } from '@/lib/constants'
import { Search, Plus, Check, Clock, AlertTriangle, X } from 'lucide-react'

export default function PrestamosPage() {
  const [searchItem, setSearchItem] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [filterSeccion, setFilterSeccion] = useState('todos')
  const [filterObra, setFilterObra] = useState('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [registros, setRegistros] = useState<RegistroControlAlmacen[]>(MOCK_CONTROL_ALMACEN)

  // New record form state
  const [newRecord, setNewRecord] = useState({
    fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'numeric', year: '2-digit' }).replace(/\//g, '-'),
    item: '',
    unidad: 'PZA',
    ingreso: '',
    salida: '',
    seccion: '',
    obra: '',
    persona_prestamo: '',
    hora_prestamo: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  })

  // Calculate stats
  const prestados = registros.filter(r => r.estado === 'prestado').length
  const devueltos = registros.filter(r => r.estado === 'devuelto').length
  const pendientes = registros.filter(r => r.estado === 'pendiente').length

  // Get unique values for filters
  const secciones = Array.from(new Set(registros.map(r => r.seccion)))
  const obras = Array.from(new Set(registros.map(r => r.obra)))

  // Filter records
  const filteredRecords = registros.filter(record => {
    const matchesItem = record.item.toLowerCase().includes(searchItem.toLowerCase()) ||
      record.persona_prestamo.toLowerCase().includes(searchItem.toLowerCase())
    const matchesEstado = filterEstado === 'todos' || record.estado === filterEstado
    const matchesSeccion = filterSeccion === 'todos' || record.seccion === filterSeccion
    const matchesObra = filterObra === 'todos' || record.obra === filterObra
    return matchesItem && matchesEstado && matchesSeccion && matchesObra
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'prestado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-900/30 text-amber-400 border border-amber-600/30">
            <Clock className="w-3 h-3" />
            PRESTADO
          </span>
        )
      case 'devuelto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-green-900/30 text-green-400 border border-green-600/30">
            <Check className="w-3 h-3" />
            DEVUELTO
          </span>
        )
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-blue-900/30 text-blue-400 border border-blue-600/30">
            <AlertTriangle className="w-3 h-3" />
            PENDIENTE
          </span>
        )
      default:
        return null
    }
  }

  const handleAddRecord = () => {
    const lastRecord = registros[0]
    const newId = `reg-${String(registros.length + 1).padStart(3, '0')}`
    
    const record: RegistroControlAlmacen = {
      id: newId,
      fecha: newRecord.fecha,
      item: newRecord.item,
      unidad: newRecord.unidad,
      ingreso: newRecord.ingreso ? parseInt(newRecord.ingreso) : null,
      salida: newRecord.salida ? parseInt(newRecord.salida) : null,
      saldo: 0, // Would be calculated based on previous saldo
      seccion: newRecord.seccion,
      obra: newRecord.obra,
      persona_prestamo: newRecord.persona_prestamo,
      hora_prestamo: newRecord.hora_prestamo,
      hora_devolucion: null,
      estado: 'prestado',
    }

    setRegistros([record, ...registros])
    setShowAddModal(false)
    setNewRecord({
      fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'numeric', year: '2-digit' }).replace(/\//g, '-'),
      item: '',
      unidad: 'PZA',
      ingreso: '',
      salida: '',
      seccion: '',
      obra: '',
      persona_prestamo: '',
      hora_prestamo: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    })
  }

  const handleMarkReturned = (id: string) => {
    setRegistros(registros.map(r => {
      if (r.id === id) {
        return {
          ...r,
          estado: 'devuelto' as const,
          hora_devolucion: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        }
      }
      return r
    }))
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Control de Almacén - Préstamos</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Registro de préstamos, ingresos y salidas de materiales</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-background rounded-lg font-medium hover:bg-accent/90 transition-colors min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            Nuevo Registro
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
          <div className="border border-amber-600/30 bg-amber-900/10 rounded-lg p-3 sm:p-6">
            <p className="text-xs text-muted-foreground font-mono uppercase mb-1 sm:mb-2 leading-tight">Prestados</p>
            <p className="text-2xl sm:text-4xl font-bold text-amber-400">{prestados}</p>
          </div>
          <div className="border border-green-600/30 bg-green-900/10 rounded-lg p-3 sm:p-6">
            <p className="text-xs text-muted-foreground font-mono uppercase mb-1 sm:mb-2 leading-tight">Devueltos</p>
            <p className="text-2xl sm:text-4xl font-bold text-green-400">{devueltos}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-6">
            <p className="text-xs text-muted-foreground font-mono uppercase mb-1 sm:mb-2 leading-tight">Pendientes</p>
            <p className="text-2xl sm:text-4xl font-bold text-foreground">{pendientes}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-2">BUSCAR ÍTEM / PERSONA</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Nombre del ítem o persona..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-2">ESTADO</label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-4 py-2.5 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
              >
                <option value="todos">Todos</option>
                <option value="prestado">Prestado</option>
                <option value="devuelto">Devuelto</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-2">SECCIÓN</label>
              <select
                value={filterSeccion}
                onChange={(e) => setFilterSeccion(e.target.value)}
                className="w-full px-4 py-2.5 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
              >
                <option value="todos">Todas</option>
                {secciones.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-2">OBRA</label>
              <select
                value={filterObra}
                onChange={(e) => setFilterObra(e.target.value)}
                className="w-full px-4 py-2.5 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
              >
                <option value="todos">Todas</option>
                {obras.map(obra => (
                  <option key={obra} value={obra}>{obra}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-border/30">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Fecha</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Ítem</th>
                  <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Unidad</th>
                  <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Ingreso</th>
                  <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Salida</th>
                  <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Saldo</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Sección</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Obra</th>
                  <th className="px-3 py-3 text-left text-xs font-mono font-semibold text-foreground uppercase">Persona</th>
                  <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">H. Préstamo</th>
                  <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">H. Devolución</th>
                  <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Estado</th>
                  <th className="px-3 py-3 text-center text-xs font-mono font-semibold text-foreground uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-border/10 transition-colors">
                    <td className="px-3 py-3 text-foreground font-mono text-xs whitespace-nowrap">{record.fecha}</td>
                    <td className="px-3 py-3">
                      <p className="text-foreground font-medium text-sm line-clamp-2">{record.item}</p>
                    </td>
                    <td className="px-3 py-3 text-center text-foreground font-mono text-xs">{record.unidad}</td>
                    <td className="px-3 py-3 text-center text-green-400 font-bold">
                      {record.ingreso ?? '-'}
                    </td>
                    <td className="px-3 py-3 text-center text-red-400 font-bold">
                      {record.salida ?? '-'}
                    </td>
                    <td className="px-3 py-3 text-center text-foreground font-bold">{record.saldo}</td>
                    <td className="px-3 py-3 text-foreground text-sm">{record.seccion}</td>
                    <td className="px-3 py-3 text-foreground text-sm">{record.obra}</td>
                    <td className="px-3 py-3 text-accent font-medium text-sm">{record.persona_prestamo}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground font-mono text-xs">{record.hora_prestamo}</td>
                    <td className="px-3 py-3 text-center font-mono text-xs">
                      {record.hora_devolucion ? (
                        <span className="text-green-400">{record.hora_devolucion}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {getEstadoBadge(record.estado)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {record.estado === 'prestado' && (
                        <button
                          onClick={() => handleMarkReturned(record.id)}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors whitespace-nowrap mx-auto min-h-[36px]"
                        >
                          <Check className="w-3 h-3" />
                          Devolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay registros que coincidan con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Nuevo Registro de Préstamo</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-border/30 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground font-mono mb-2">FECHA</label>
                  <input
                    type="text"
                    value={newRecord.fecha}
                    onChange={(e) => setNewRecord({ ...newRecord, fecha: e.target.value })}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-mono mb-2">HORA PRÉSTAMO</label>
                  <input
                    type="text"
                    value={newRecord.hora_prestamo}
                    onChange={(e) => setNewRecord({ ...newRecord, hora_prestamo: e.target.value })}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground font-mono mb-2">ÍTEM</label>
                <input
                  type="text"
                  placeholder="Nombre del ítem..."
                  value={newRecord.item}
                  onChange={(e) => setNewRecord({ ...newRecord, item: e.target.value })}
                  className="w-full px-3 py-2.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground font-mono mb-2">UNIDAD</label>
                  <select
                    value={newRecord.unidad}
                    onChange={(e) => setNewRecord({ ...newRecord, unidad: e.target.value })}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  >
                    <option value="PZA">PZA</option>
                    <option value="PAR">PAR</option>
                    <option value="Rollo">Rollo</option>
                    <option value="Caja">Caja</option>
                    <option value="Metro">Metro</option>
                    <option value="Kg">Kg</option>
                    <option value="Litro">Litro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-mono mb-2">INGRESO</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newRecord.ingreso}
                    onChange={(e) => setNewRecord({ ...newRecord, ingreso: e.target.value })}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-mono mb-2">SALIDA</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newRecord.salida}
                    onChange={(e) => setNewRecord({ ...newRecord, salida: e.target.value })}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground font-mono mb-2">SECCIÓN</label>
                  <input
                    type="text"
                    placeholder="Sección..."
                    value={newRecord.seccion}
                    onChange={(e) => setNewRecord({ ...newRecord, seccion: e.target.value })}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-mono mb-2">OBRA</label>
                  <input
                    type="text"
                    placeholder="Obra..."
                    value={newRecord.obra}
                    onChange={(e) => setNewRecord({ ...newRecord, obra: e.target.value })}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground font-mono mb-2">PERSONA QUE SE HACE PRESTAR</label>
                <input
                  type="text"
                  placeholder="Nombre de la persona..."
                  value={newRecord.persona_prestamo}
                  onChange={(e) => setNewRecord({ ...newRecord, persona_prestamo: e.target.value })}
                  className="w-full px-3 py-2.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-border/30 transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddRecord}
                disabled={!newRecord.item || !newRecord.persona_prestamo}
                className="flex-1 px-4 py-2.5 bg-accent text-background rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                Registrar Préstamo
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
