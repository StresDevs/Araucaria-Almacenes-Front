'use client'

import { useState, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { useAlmacenes } from '@/hooks/use-almacenes'
import { useObras } from '@/hooks/use-obras'
import Link from 'next/link'
import type { Almacen, AlmacenTipo } from '@/types'
import {
  Eye,
  Plus,
  ArrowRight,
  Loader2,
  X,
  Search,
  Power,
  PowerOff,
} from 'lucide-react'

export default function AlmacenesPage() {
  const { almacenes, isLoading, error, createAlmacen, toggleActive } = useAlmacenes()
  const { obras } = useObras()

  const [selectedObraFilter, setSelectedObraFilter] = useState<string>('Todas')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [form, setForm] = useState({
    nombre: '',
    tipoAlmacen: 'fijo' as AlmacenTipo,
    direccion: '',
    obraId: '',
  })

  // Separate almacenes by type
  const almacenesFijos = useMemo(
    () => almacenes.filter((a) => a.tipo_almacen === 'fijo'),
    [almacenes],
  )

  const almacenesObra = useMemo(
    () => almacenes.filter((a) => a.tipo_almacen === 'obra'),
    [almacenes],
  )

  // Unique obra names from almacenes for filter tabs
  const obrasConAlmacen = useMemo(() => {
    const names = new Set<string>()
    almacenesObra.forEach((a) => {
      if (a.obra_nombre) names.add(a.obra_nombre)
    })
    return Array.from(names)
  }, [almacenesObra])

  // Filter obra almacenes
  const filteredAlmacenesObra = useMemo(() => {
    if (selectedObraFilter === 'Todas') return almacenesObra
    return almacenesObra.filter((a) => a.obra_nombre === selectedObraFilter)
  }, [almacenesObra, selectedObraFilter])

  // Search filter for fijos
  const filteredAlmacenesFijos = useMemo(() => {
    if (!searchQuery) return almacenesFijos
    const q = searchQuery.toLowerCase()
    return almacenesFijos.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        (a.direccion?.toLowerCase().includes(q) ?? false),
    )
  }, [almacenesFijos, searchQuery])

  // Active obras for the create modal dropdown
  const obrasActivas = useMemo(
    () => obras.filter((o) => o.estado === 'activa'),
    [obras],
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)

    const success = await createAlmacen({
      nombre: form.nombre,
      tipoAlmacen: form.tipoAlmacen,
      direccion: form.direccion || undefined,
      obraId: form.tipoAlmacen === 'obra' ? form.obraId || undefined : undefined,
    })

    setCreating(false)
    if (success) {
      setShowCreateModal(false)
      setForm({ nombre: '', tipoAlmacen: 'fijo', direccion: '', obraId: '' })
    } else {
      setCreateError('Error al crear el almacén')
    }
  }

  const handleToggleActive = async (id: string) => {
    await toggleActive(id)
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Title + Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">
              Almacenes
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gestión de almacenes externos y dentro de obra
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Almacén
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {/* SECTION A: Externos (fijos) */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-cyan-400 rounded-full"></span>
                Externos (fijos)
              </h2>

              {filteredAlmacenesFijos.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <p className="text-muted-foreground">No hay almacenes fijos registrados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAlmacenesFijos.map((almacen) => (
                    <AlmacenCard
                      key={almacen.id}
                      almacen={almacen}
                      borderColor="rgb(34, 211, 238)"
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* SECTION B: Dentro de obra */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-amber-400 rounded-full"></span>
                Dentro de obra
              </h2>

              {/* Obra Filter Tabs */}
              {obrasConAlmacen.length > 0 && (
                <div className="flex gap-2 mb-6 flex-wrap">
                  <button
                    onClick={() => setSelectedObraFilter('Todas')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      selectedObraFilter === 'Todas'
                        ? 'bg-accent text-background'
                        : 'bg-border text-foreground hover:bg-border/80'
                    }`}
                  >
                    Todas ({almacenesObra.length})
                  </button>
                  {obrasConAlmacen.map((obraNombre) => {
                    const count = almacenesObra.filter(
                      (a) => a.obra_nombre === obraNombre,
                    ).length
                    return (
                      <button
                        key={obraNombre}
                        onClick={() => setSelectedObraFilter(obraNombre)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                          selectedObraFilter === obraNombre
                            ? 'bg-accent text-background'
                            : 'bg-border text-foreground hover:bg-border/80'
                        }`}
                      >
                        {obraNombre} ({count})
                      </button>
                    )
                  })}
                </div>
              )}

              {filteredAlmacenesObra.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <p className="text-muted-foreground">
                    No hay almacenes dentro de obra registrados
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAlmacenesObra.map((almacen) => (
                    <AlmacenCard
                      key={almacen.id}
                      almacen={almacen}
                      borderColor="rgb(245, 158, 11)"
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ── Modal: Crear Almacén ──────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Nuevo Almacén</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateError('')
                }}
                className="p-1.5 rounded-lg hover:bg-border transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  {createError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                    placeholder="Ej: Almacén Central"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Tipo de Almacén *
                  </label>
                  <select
                    value={form.tipoAlmacen}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tipoAlmacen: e.target.value as AlmacenTipo,
                        obraId: e.target.value === 'fijo' ? '' : form.obraId,
                      })
                    }
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  >
                    <option value="fijo">Externo (fijo)</option>
                    <option value="obra">Dentro de obra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Dirección del almacén (opcional)"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                {form.tipoAlmacen === 'obra' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Obra *
                    </label>
                    <select
                      value={form.obraId}
                      onChange={(e) => setForm({ ...form, obraId: e.target.value })}
                      required={form.tipoAlmacen === 'obra'}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    >
                      <option value="">Seleccionar obra...</option>
                      {obrasActivas.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateError('')
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-border/60 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Almacén'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}

/* ── Card Component ───────────────────────────────────────────────── */

function AlmacenCard({
  almacen,
  borderColor,
  onToggleActive,
}: {
  almacen: Almacen
  borderColor: string
  onToggleActive: (id: string) => void
}) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">{almacen.nombre}</h3>
        {almacen.obra_nombre && (
          <p className="text-xs text-muted-foreground mt-1">{almacen.obra_nombre}</p>
        )}
      </div>

      <div className="space-y-3 mb-6 text-sm">
        {almacen.direccion && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dirección:</span>
            <span className="text-foreground font-medium text-right max-w-[60%] truncate">
              {almacen.direccion}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estado:</span>
          <span
            className={`px-3 py-1 rounded text-xs font-medium ${
              almacen.estado === 'activo'
                ? 'bg-green-900 text-green-200'
                : 'bg-red-900 text-red-200'
            }`}
          >
            {almacen.estado === 'activo' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ítems:</span>
          <span className="text-accent font-bold">{almacen.items_count}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/almacenes/${almacen.id}`}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm"
        >
          <Eye className="w-4 h-4" />
          Ver inventario
        </Link>
        <button
          onClick={() => onToggleActive(almacen.id)}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
            almacen.estado === 'activo'
              ? 'bg-border text-foreground hover:bg-border/80'
              : 'bg-green-900/50 text-green-200 hover:bg-green-900/70'
          }`}
          title={almacen.estado === 'activo' ? 'Desactivar' : 'Activar'}
        >
          {almacen.estado === 'activo' ? (
            <PowerOff className="w-4 h-4" />
          ) : (
            <Power className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}
