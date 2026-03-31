'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { SectorizationWizard } from '@/components/sectorization-wizard'
import type { WizardFile } from '@/components/sectorization-wizard'
import { useSectorizacion } from '@/hooks/use-sectorizacion'
import { useObras } from '@/hooks/use-obras'
import { Plus, Edit2, Eye, Grid3x3, Loader2, Power, PowerOff, RotateCcw } from 'lucide-react'
import type { ObraSectorizacion } from '@/types'

export default function SectorizacionPage() {
  const router = useRouter()
  const { items, desactivadas, isLoading, error, create, update, toggleActive, uploadArchivos, refetch } = useSectorizacion()
  const { obras } = useObras()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ObraSectorizacion | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'activas' | 'desactivadas'>('activas')

  // Obras activas que aún no tienen sectorización
  const obrasDisponibles = obras.filter(
    (o) => o.estado === 'activa' && !items.some((s) => s.obra_id === o.id) && !desactivadas.some((s) => s.obra_id === o.id),
  )

  const uploadFiles = async (sectorizacionId: string, files: WizardFile[]) => {
    if (files.length === 0) return
    const realFiles = files.map((wf) => wf.file)
    await uploadArchivos(sectorizacionId, realFiles)
  }

  const handleCreate = async (obraId: string, data: { sectores: any[]; pisos: any[] }, files: WizardFile[]) => {
    setSubmitting(true)
    const dto = {
      obraId,
      sectores: data.sectores.map((s: any) => ({ nombre: s.nombre, color: s.color, numero: s.numero })),
      pisos: data.pisos.map((p: any, idx: number) => ({
        numero: p.numero,
        nombre: p.nombre,
        orden: idx,
        departamentos: p.departamentos.map((d: any) => ({ letra: d.letra, nombre: d.nombre || '', sectorNumero: d.sector_numero })),
      })),
    }
    const created = await create(dto)
    if (created && files.length > 0) {
      await uploadFiles(created.id, files)
      await refetch()
    }
    setSubmitting(false)
    setWizardOpen(false)
  }

  const handleUpdate = async (data: { sectores: any[]; pisos: any[] }, files: WizardFile[]) => {
    if (!editingItem) return
    setSubmitting(true)
    const dto = {
      sectores: data.sectores.map((s: any) => ({ nombre: s.nombre, color: s.color, numero: s.numero })),
      pisos: data.pisos.map((p: any, idx: number) => ({
        numero: p.numero,
        nombre: p.nombre,
        orden: idx,
        departamentos: p.departamentos.map((d: any) => ({ letra: d.letra, nombre: d.nombre || '', sectorNumero: d.sector_numero })),
      })),
    }
    await update(editingItem.id, dto)
    if (files.length > 0) {
      await uploadFiles(editingItem.id, files)
      await refetch()
    }
    setSubmitting(false)
    setEditingItem(null)
    setWizardOpen(false)
  }

  const handleToggle = async (id: string) => {
    setSubmitting(true)
    await toggleActive(id)
    setSubmitting(false)
  }

  const displayedItems = activeTab === 'activas' ? items : desactivadas

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Sectorización de Obras</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gestiona la distribución de sectores, pisos y departamentos por obra</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Activas</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{items.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Pisos Totales</p>
            <p className="text-2xl sm:text-3xl font-bold text-accent mt-1">
              {items.reduce((acc, s) => acc + s.pisos.length, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Sectores</p>
            <p className="text-2xl sm:text-3xl font-bold text-accent mt-1">
              {items.reduce((acc, s) => acc + s.sectores.length, 0)}
            </p>
          </div>
        </div>

        {/* Tabs + Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('activas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'activas' ? 'bg-accent text-background' : 'bg-border text-foreground hover:bg-border/80'
              }`}
            >
              Activas ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('desactivadas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'desactivadas' ? 'bg-accent text-background' : 'bg-border text-foreground hover:bg-border/80'
              }`}
            >
              Desactivadas ({desactivadas.length})
            </button>
          </div>
          {activeTab === 'activas' && (
            <button
              onClick={() => {
                setEditingItem(null)
                setWizardOpen(true)
              }}
              disabled={obrasDisponibles.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Nueva Sectorización
            </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-4">
          {displayedItems.length === 0 ? (
            <div className="bg-background border border-dashed border-border rounded-lg p-8 text-center">
              <Grid3x3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {activeTab === 'activas' ? 'No hay sectorizaciones activas' : 'No hay sectorizaciones desactivadas'}
              </p>
              {activeTab === 'activas' && (
                <p className="text-xs text-muted-foreground mt-1">Crea la primera sectorización para comenzar</p>
              )}
            </div>
          ) : (
            displayedItems.map((sec) => (
              <div
                key={sec.id}
                className={`bg-card border rounded-lg p-4 sm:p-6 transition-colors ${
                  sec.estado === 'desactivada' ? 'border-border/50 opacity-70' : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">{sec.nombre_obra || 'Sin nombre'}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          sec.estado === 'activa'
                            ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                            : 'bg-red-900/30 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {sec.estado}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs sm:text-sm text-muted-foreground">
                      <span>📍 {sec.sectores.length} Sectores</span>
                      <span>🏢 {sec.pisos.length} Pisos</span>
                      <span>
                        🏠 {sec.pisos.reduce((acc, p) => acc + p.departamentos.length, 0)} Departamentos
                      </span>
                      {sec.archivos.length > 0 && <span>📎 {sec.archivos.length} Archivos</span>}
                    </div>

                    {/* Sector Colors Preview */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-muted-foreground">Sectores:</span>
                      <div className="flex gap-1">
                        {sec.sectores.map((s) => (
                          <div
                            key={s.id}
                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: s.color }}
                            title={s.nombre}
                          >
                            {s.numero}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => router.push(`/sectorizacion/${sec.id}`)}
                      className="flex items-center gap-2 px-3 py-1.5 border border-border rounded text-foreground hover:bg-border transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                    {sec.estado === 'activa' && (
                      <button
                        onClick={() => {
                          setEditingItem(sec)
                          setWizardOpen(true)
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 border border-border rounded text-foreground hover:bg-border transition-colors text-sm font-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleToggle(sec.id)}
                      disabled={submitting}
                      className={`flex items-center gap-2 px-3 py-1.5 border rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                        sec.estado === 'activa'
                          ? 'border-orange-500/30 text-orange-400 hover:bg-orange-900/10'
                          : 'border-green-500/30 text-green-400 hover:bg-green-900/10'
                      }`}
                    >
                      {sec.estado === 'activa' ? (
                        <>
                          <PowerOff className="w-4 h-4" />
                          <span className="hidden sm:inline">Desactivar</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span className="hidden sm:inline">Reactivar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Wizard Modal */}
        {wizardOpen && (
          <SectorizationWizard
            obras={obrasDisponibles}
            editingData={editingItem}
            onSave={(obraId, data, files) => {
              if (editingItem) {
                handleUpdate(data, files)
              } else {
                handleCreate(obraId, data, files)
              }
            }}
            onCancel={() => {
              setWizardOpen(false)
              setEditingItem(null)
            }}
          />
        )}
      </div>
    </AppShell>
  )
}
