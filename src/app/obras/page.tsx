'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { useObras } from '@/hooks/use-obras'
import type { ObraItem } from '@/types'
import { ObraCard } from '@/components/obra-card'
import { NewObraDrawer, NewObraFormData } from '@/components/new-obra-drawer'
import { CloseObraDrawer } from '@/components/close-obra-drawer'
import { Plus, Loader2 } from 'lucide-react'

export default function ObrasPage() {
  const { obras, isLoading, error, createObra, closeObra } = useObras()
  const [activeTab, setActiveTab] = useState<'active' | 'finalized'>('active')
  const [newObraOpen, setNewObraOpen] = useState(false)
  const [closeObraOpen, setCloseObraOpen] = useState(false)
  const [selectedObraToClose, setSelectedObraToClose] = useState<ObraItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const activeObras = obras.filter((o) => o.estado === 'activa')
  const finalizedObras = obras.filter((o) => o.estado === 'finalizada')
  const displayedObras = activeTab === 'active' ? activeObras : finalizedObras

  const handleNewObra = async (data: NewObraFormData) => {
    setSubmitting(true)
    const success = await createObra({
      nombre: data.nombre,
      ubicacion: data.ubicacion || undefined,
      responsable: data.responsable || undefined,
      fechaInicio: data.fecha_inicio,
    })
    setSubmitting(false)
    if (success) setNewObraOpen(false)
  }

  const handleCloseObra = async () => {
    if (!selectedObraToClose) return
    setSubmitting(true)
    const success = await closeObra(selectedObraToClose.id)
    setSubmitting(false)
    if (success) {
      setCloseObraOpen(false)
      setSelectedObraToClose(null)
    }
  }

  const openCloseDrawer = (obra: ObraItem) => {
    setSelectedObraToClose(obra)
    setCloseObraOpen(true)
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Obras</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gestiona proyectos y obras de construcción</p>
          </div>
          <button
            onClick={() => setNewObraOpen(true)}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Nueva Obra</span>
            <span className="xs:hidden">Nueva</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'active'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Activas ({activeObras.length})
          </button>
          <button
            onClick={() => setActiveTab('finalized')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'finalized'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Finalizadas ({finalizedObras.length})
          </button>
        </div>

        {/* Obras Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        ) : displayedObras.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground">
              {activeTab === 'active' ? 'No hay obras activas aún' : 'No hay obras finalizadas aún'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedObras.map((obra) => (
              <ObraCard
                key={obra.id}
                obra={obra}
                onClose={activeTab === 'active' ? () => openCloseDrawer(obra) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawers */}
      <NewObraDrawer isOpen={newObraOpen} onClose={() => setNewObraOpen(false)} onSubmit={handleNewObra} />
      <CloseObraDrawer
        isOpen={closeObraOpen}
        obraName={selectedObraToClose?.nombre}
        onClose={() => setCloseObraOpen(false)}
        onConfirm={handleCloseObra}
      />
    </AppShell>
  )
}
