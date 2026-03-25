'use client'

import React, { useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Sector, Piso, Departamento } from '@/lib/constants'

interface SectorizationWizardProps {
  obraName: string
  initialData?: {
    sectores: Sector[]
    pisos: Piso[]
  }
  onSave: (data: { sectores: Sector[]; pisos: Piso[] }) => void
  onCancel: () => void
}

const SECTOR_COLORS = ['#9333ea', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6']
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T']

export function SectorizationWizard({
  obraName,
  initialData,
  onSave,
  onCancel,
}: SectorizationWizardProps) {
  const [step, setStep] = useState<'sectores' | 'pisos' | 'departamentos' | 'asignacion'>('sectores')
  const [sectores, setSectores] = useState<Sector[]>(
    initialData?.sectores || [{ id: 's1', nombre: 'Sector 1', color: SECTOR_COLORS[0], numero: 1 }]
  )
  const [pisos, setPisos] = useState<Piso[]>(
    initialData?.pisos || [{ id: 'p1', numero: '1', nombre: 'P1', departamentos: [] }]
  )
  const [expandedPiso, setExpandedPiso] = useState<string | null>(pisos[0]?.id || null)
  const [selectedPiso, setSelectedPiso] = useState<string>(pisos[0]?.id || '')

  const addSector = () => {
    const newId = `s${sectores.length + 1}`
    const newNumber = sectores.length + 1
    setSectores([
      ...sectores,
      {
        id: newId,
        nombre: `Sector ${newNumber}`,
        color: SECTOR_COLORS[sectores.length % SECTOR_COLORS.length],
        numero: newNumber,
      },
    ])
  }

  const removeSector = (id: string) => {
    if (sectores.length > 1) {
      setSectores(sectores.filter(s => s.id !== id))
    }
  }

  const updateSectorName = (id: string, nombre: string) => {
    setSectores(sectores.map(s => (s.id === id ? { ...s, nombre } : s)))
  }

  const addPiso = () => {
    const newNumber = pisos.length + 1
    const newId = `p${newNumber}`
    const newPiso: Piso = {
      id: newId,
      numero: String(newNumber - 1),
      nombre: `P${newNumber - 1}`,
      departamentos: [],
    }
    setPisos([...pisos, newPiso])
    setSelectedPiso(newId)
  }

  const removePiso = (id: string) => {
    if (pisos.length > 1) {
      setPisos(pisos.filter(p => p.id !== id))
      if (selectedPiso === id) {
        setSelectedPiso(pisos[0]?.id || '')
      }
    }
  }

  const updatePisoName = (id: string, nombre: string) => {
    setPisos(pisos.map(p => (p.id === id ? { ...p, nombre } : p)))
  }

  const addDepartmentToSelectedPiso = () => {
    const piso = pisos.find(p => p.id === selectedPiso)
    if (piso && piso.departamentos.length < LETTERS.length) {
      const newLetter = LETTERS[piso.departamentos.length]
      setPisos(
        pisos.map(p =>
          p.id === selectedPiso
            ? {
                ...p,
                departamentos: [
                  ...p.departamentos,
                  { letra: newLetter, sector_id: sectores[0]?.id || '' },
                ],
              }
            : p
        )
      )
    }
  }

  const updateDepartmentSector = (pisoId: string, departmentIndex: number, sectorId: string) => {
    setPisos(
      pisos.map(p =>
        p.id === pisoId
          ? {
              ...p,
              departamentos: p.departamentos.map((d, idx) =>
                idx === departmentIndex ? { ...d, sector_id: sectorId } : d
              ),
            }
          : p
      )
    )
  }

  const removeDepartment = (pisoId: string, departmentIndex: number) => {
    setPisos(
      pisos.map(p =>
        p.id === pisoId
          ? {
              ...p,
              departamentos: p.departamentos.filter((_, idx) => idx !== departmentIndex),
            }
          : p
      )
    )
  }

  const handleSave = () => {
    onSave({ sectores, pisos })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{obraName}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Configura sectores, pisos y departamentos</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-border rounded transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Step Indicators */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['sectores', 'pisos', 'departamentos', 'asignacion'].map((s, idx) => (
              <button
                key={s}
                onClick={() => setStep(s as any)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  step === s
                    ? 'bg-accent text-background'
                    : 'bg-border text-foreground hover:bg-border/80'
                }`}
              >
                {idx + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Step 1: Sectores */}
          {step === 'sectores' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Definir Sectores</h3>
              <div className="space-y-3">
                {sectores.map(sector => (
                  <div key={sector.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: sector.color }}></div>
                    <input
                      type="text"
                      value={sector.nombre}
                      onChange={e => updateSectorName(sector.id, e.target.value)}
                      className="flex-1 bg-transparent text-foreground text-sm focus:outline-none border-b border-transparent hover:border-border"
                    />
                    <button
                      onClick={() => removeSector(sector.id)}
                      disabled={sectores.length === 1}
                      className="p-1 hover:bg-red-900/20 disabled:opacity-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addSector}
                className="w-full px-3 py-2 border border-dashed border-accent text-accent rounded-lg hover:bg-accent/10 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Sector
              </button>
            </div>
          )}

          {/* Step 2: Pisos */}
          {step === 'pisos' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Definir Pisos</h3>
              <div className="space-y-2">
                {pisos.map(piso => (
                  <div key={piso.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                    <div className="text-sm font-mono font-bold text-accent">{piso.nombre}</div>
                    <input
                      type="text"
                      value={piso.nombre}
                      onChange={e => updatePisoName(piso.id, e.target.value)}
                      placeholder="ej: P1, PB, Terraza"
                      className="flex-1 bg-transparent text-foreground text-sm focus:outline-none border-b border-transparent hover:border-border"
                    />
                    <button
                      onClick={() => removePiso(piso.id)}
                      disabled={pisos.length === 1}
                      className="p-1 hover:bg-red-900/20 disabled:opacity-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addPiso}
                className="w-full px-3 py-2 border border-dashed border-accent text-accent rounded-lg hover:bg-accent/10 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Piso
              </button>
            </div>
          )}

          {/* Step 3: Departamentos */}
          {step === 'departamentos' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Asignar Departamentos por Piso</h3>
              
              {/* Piso Selector */}
              <div className="flex gap-2 flex-wrap">
                {pisos.map(piso => (
                  <button
                    key={piso.id}
                    onClick={() => setSelectedPiso(piso.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedPiso === piso.id
                        ? 'bg-accent text-background'
                        : 'bg-border text-foreground hover:bg-border/80'
                    }`}
                  >
                    {piso.nombre}
                  </button>
                ))}
              </div>

              {/* Departamentos del Piso Seleccionado */}
              <div className="space-y-2">
                {pisos
                  .find(p => p.id === selectedPiso)
                  ?.departamentos.map((dept, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-background border border-border rounded">
                      <div className="px-2 py-1 bg-accent/20 rounded font-bold text-accent text-sm min-w-[2.5rem]">
                        {dept.letra}
                      </div>
                      <span className="text-xs text-muted-foreground flex-1">Departamento</span>
                      <button
                        onClick={() => removeDepartment(selectedPiso, idx)}
                        className="p-1 hover:bg-red-900/20 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={addDepartmentToSelectedPiso}
                className="w-full px-3 py-2 border border-dashed border-accent text-accent rounded-lg hover:bg-accent/10 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Departamento
              </button>
            </div>
          )}

          {/* Step 4: Asignación */}
          {step === 'asignacion' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Asignar Departamentos a Sectores</h3>
              <p className="text-sm text-muted-foreground">Selecciona el sector para cada departamento en cada piso</p>
              
              {pisos.map(piso => (
                <div key={piso.id} className="border border-border rounded-lg p-4">
                  <button
                    onClick={() => setExpandedPiso(expandedPiso === piso.id ? null : piso.id)}
                    className="w-full flex items-center justify-between p-2 hover:bg-background rounded transition-colors"
                  >
                    <h4 className="font-bold text-foreground text-sm">{piso.nombre}</h4>
                    {expandedPiso === piso.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {expandedPiso === piso.id && (
                    <div className="mt-3 space-y-2">
                      {piso.departamentos.map((dept, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-background border border-border rounded">
                          <div className="px-2 py-1 bg-accent/20 rounded font-bold text-accent text-sm min-w-[2.5rem]">
                            {dept.letra}
                          </div>
                          <select
                            value={dept.sector_id}
                            onChange={e => updateDepartmentSector(piso.id, idx, e.target.value)}
                            className="flex-1 px-2 py-1.5 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                          >
                            {sectores.map(sector => (
                              <option key={sector.id} value={sector.id}>
                                {sector.nombre}
                              </option>
                            ))}
                          </select>
                          <div
                            className="w-4 h-4 rounded border border-border"
                            style={{
                              backgroundColor: sectores.find(s => s.id === dept.sector_id)?.color,
                            }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 sm:p-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-border transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
