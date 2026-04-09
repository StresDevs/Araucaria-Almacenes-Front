'use client'

import { useState, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { useCategorias } from '@/hooks/use-categorias'
import type { CategoriaItem } from '@/types'
import {
  Plus,
  Loader2,
  Search,
  Pencil,
  Trash2,
  X,
  Layers,
  AlertTriangle,
} from 'lucide-react'

export default function CategoriasPage() {
  const { categorias, isLoading, error, createCategoria, updateCategoria, deleteCategoria } = useCategorias()

  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoriaItem | null>(null)

  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    if (!searchQuery) return categorias
    const q = searchQuery.toLowerCase()
    return categorias.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.descripcion?.toLowerCase().includes(q) ?? false),
    )
  }, [categorias, searchQuery])

  const openCreate = () => {
    setForm({ nombre: '', descripcion: '' })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEdit = (cat: CategoriaItem) => {
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' })
    setFormError('')
    setEditingCategoria(cat)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio'); return }
    setFormError('')
    setSaving(true)

    if (editingCategoria) {
      const ok = await updateCategoria(editingCategoria.id, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
      })
      setSaving(false)
      if (ok) setEditingCategoria(null)
      else setFormError('Error al actualizar. Verifica que el nombre no esté duplicado.')
    } else {
      const ok = await createCategoria({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
      })
      setSaving(false)
      if (ok) setShowCreateModal(false)
      else setFormError('Error al crear. Verifica que el nombre no esté duplicado.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const ok = await deleteCategoria(deleteTarget.id)
    setDeleting(false)
    if (ok) setDeleteTarget(null)
  }

  const isModalOpen = showCreateModal || !!editingCategoria

  return (
    <AppShell>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Categorías</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gestión de categorías para clasificar los ítems del inventario
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-accent" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Total Categorías</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{categorias.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-accent" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Resultados</p>
            </div>
            <p className="text-2xl font-bold text-accent">{filtered.length}</p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'No se encontraron categorías con esa búsqueda' : 'No hay categorías registradas'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Nombre</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Descripción</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((cat) => (
                    <tr key={cat.id} className="hover:bg-border/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-4 h-4 text-accent" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{cat.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-muted-foreground">{cat.descripcion || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-2 rounded-lg hover:bg-border/60 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((cat) => (
                <div key={cat.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-4.5 h-4.5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{cat.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.descripcion || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-2 rounded-lg hover:bg-border/60 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal: Crear / Editar ──── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); setEditingCategoria(null) }}
                className="p-1.5 rounded-lg hover:bg-border transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Porcelanato"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción opcional..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingCategoria(null) }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-foreground hover:bg-border/60 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {saving ? 'Guardando...' : editingCategoria ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar eliminación ──── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">¿Eliminar categoría?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Se eliminará <span className="font-semibold text-foreground">{deleteTarget.nombre}</span>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-foreground hover:bg-border/60 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
