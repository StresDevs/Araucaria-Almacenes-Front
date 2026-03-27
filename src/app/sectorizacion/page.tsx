'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { SectorizationWizard } from '@/components/sectorization-wizard'
import { Plus, Edit2, Trash2, Eye, Grid3x3 } from 'lucide-react'
import { MOCK_SECTORIZATION, MOCK_OBRAS } from '@/lib/constants'
import type { ObraSectorizacion, ObraItem } from '@/types'

export default function SectorizacionPage() {
  const [sectorizations, setSectorizations] = useState<ObraSectorizacion[]>(MOCK_SECTORIZATION)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingObraId, setEditingObraId] = useState<string | null>(null)

  const handleSave = (obraId: string, data: Pick<ObraSectorizacion, 'sectores' | 'pisos'>) => {
    setSectorizations(prev =>
      prev.map(sec =>
        sec.obraId === obraId
          ? { ...sec, ...data, updated_at: new Date().toISOString() }
          : sec
      )
    )
    setWizardOpen(false)
  }

  const handleDelete = (obraId: string) => {
    if (confirm('¿Eliminar esta sectorización?')) {
      setSectorizations(prev => prev.filter(sec => sec.obraId !== obraId))
    }
  }

  const getMissingObras = () => {
    const sectorizedObraIds = sectorizations.map(s => s.obraId)
    return MOCK_OBRAS.filter(o => !sectorizedObraIds.includes(o.id) && o.estado === 'activa')
  }

  const currentEditingData = editingObraId
    ? sectorizations.find(s => s.obraId === editingObraId)
    : null

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Sectorización de Obras</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gestiona la distribución de sectores, pisos y departamentos por obra</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Obras</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{sectorizations.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Pisos Totales</p>
            <p className="text-2xl sm:text-3xl font-bold text-accent mt-1">
              {sectorizations.reduce((acc, s) => acc + s.pisos.length, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Sectores</p>
            <p className="text-2xl sm:text-3xl font-bold text-accent mt-1">
              {sectorizations.reduce((acc, s) => acc + s.sectores.length, 0)}
            </p>
          </div>
        </div>

        {/* Add New Button */}
        <button
          onClick={() => {
            setEditingObraId(null)
            setWizardOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Sectorización
        </button>

        {/* Sectorizations List */}
        <div className="space-y-4">
          {sectorizations.length === 0 ? (
            <div className="bg-background border border-dashed border-border rounded-lg p-8 text-center">
              <Grid3x3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No hay sectorizaciones creadas</p>
              <p className="text-xs text-muted-foreground mt-1">Crea la primera sectorización para comenzar</p>
            </div>
          ) : (
            sectorizations.map(sec => (
              <div
                key={sec.id}
                className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-accent/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">{sec.nombre_obra}</h3>
                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs sm:text-sm text-muted-foreground">
                      <span>📍 {sec.sectores.length} Sectores</span>
                      <span>🏢 {sec.pisos.length} Pisos</span>
                      <span>
                        🏠{' '}
                        {sec.pisos.reduce((acc, p) => acc + p.departamentos.length, 0)} Departamentos
                      </span>
                    </div>

                    {/* Sector Colors Preview */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-muted-foreground">Sectores:</span>
                      <div className="flex gap-1">
                        {sec.sectores.map(s => (
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
                      onClick={() => alert(`Ver sectorización de ${sec.nombre_obra}`)}
                      className="flex items-center gap-2 px-3 py-1.5 border border-border rounded text-foreground hover:bg-border transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingObraId(sec.obraId)
                        setWizardOpen(true)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 border border-border rounded text-foreground hover:bg-border transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(sec.obraId)}
                      className="flex items-center gap-2 px-3 py-1.5 border border-red-500/30 rounded text-red-400 hover:bg-red-900/10 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Eliminar</span>
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
            obraName={
              editingObraId
                ? sectorizations.find(s => s.obraId === editingObraId)?.nombre_obra || 'Nueva Obra'
                : 'Nueva Sectorización'
            }
            initialData={
              currentEditingData
                ? { sectores: currentEditingData.sectores, pisos: currentEditingData.pisos }
                : undefined
            }
            onSave={data => {
              if (editingObraId) {
                handleSave(editingObraId, data)
              } else {
                // For demo, just add a new sectorization
                const newObraId = `o-${Date.now()}`
                setSectorizations([
                  ...sectorizations,
                  {
                    id: `sec-${Date.now()}`,
                    obraId: newObraId,
                    nombre_obra: 'Nueva Obra',
                    estado: 'en_construccion',
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ])
              }
              setWizardOpen(false)
              setEditingObraId(null)
            }}
            onCancel={() => {
              setWizardOpen(false)
              setEditingObraId(null)
            }}
          />
        )}
      </div>
    </AppShell>
  )
}
