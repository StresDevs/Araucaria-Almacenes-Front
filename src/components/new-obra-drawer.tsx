'use client'

import { X } from 'lucide-react'
import { useState } from 'react'

interface NewObraDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: NewObraFormData) => void
  isLoading?: boolean
}

export interface NewObraFormData {
  nombre: string
  ubicacion: string
  responsable?: string
  fecha_inicio: string
}

export function NewObraDrawer({ isOpen, onClose, onSubmit }: NewObraDrawerProps) {
  const [formData, setFormData] = useState<NewObraFormData>({
    nombre: '',
    ubicacion: '',
    responsable: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      nombre: '',
      ubicacion: '',
      responsable: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/50 z-30"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full md:w-96 bg-card border-l border-border shadow-lg transition-transform duration-300 z-40 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Nueva Obra</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-border rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre de Obra
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ingresa el nombre de la obra"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ubicación
            </label>
            <input
              type="text"
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              placeholder="Ingresa la ubicación"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Responsable <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              placeholder="Ingresa el responsable"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={formData.fecha_inicio}
              onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-border transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium"
          >
            Crear Obra
          </button>
        </div>
      </div>
    </>
  )
}
