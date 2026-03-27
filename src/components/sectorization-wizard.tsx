'use client'

import React, { useState, useRef } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Upload, FileText, Trash2 } from 'lucide-react'
import type { ObraSectorizacion, ObraItem, Sector, Piso, Departamento } from '@/types'

export interface WizardFile {
  file: File
  id: string
}

interface SectorizationWizardProps {
  obras: ObraItem[]
  editingData: ObraSectorizacion | null
  onSave: (obraId: string, data: { sectores: Sector[]; pisos: Piso[] }, files: WizardFile[]) => void
  onCancel: () => void
}

const SECTOR_COLORS = ['#9333ea', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6']
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T']

export function SectorizationWizard({
  obras,
  editingData,
  onSave,
  onCancel,
}: SectorizationWizardProps) {
  const isEditing = !!editingData

  const [step, setStep] = useState<'obra' | 'sectores' | 'pisos' | 'departamentos' | 'asignacion' | 'archivos'>(
    isEditing ? 'sectores' : 'obra',
  )
  const [selectedObraId, setSelectedObraId] = useState<string>(editingData?.obra_id || '')
  const [sectores, setSectores] = useState<Sector[]>(
    editingData?.sectores || [{ id: 'tmp-s1', nombre: 'Sector 1', color: SECTOR_COLORS[0], numero: 1 }],
  )
  const [pisos, setPisos] = useState<Piso[]>(
    editingData?.pisos || [{ id: 'tmp-p1', numero: 0, nombre: 'PB', departamentos: [] }],
  )
  const [expandedPiso, setExpandedPiso] = useState<string | null>(pisos[0]?.id || null)
  const [selectedPiso, setSelectedPiso] = useState<string>(pisos[0]?.id || '')
  const [pdfFiles, setPdfFiles] = useState<WizardFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedObraName = isEditing
    ? editingData.nombre_obra || 'Obra'
    : obras.find((o) => o.id === selectedObraId)?.nombre || ''

  const addSector = () => {
    const newNumber = sectores.length > 0 ? Math.max(...sectores.map((s) => s.numero)) + 1 : 1
    setSectores([
      ...sectores,
      {
        id: `tmp-s${Date.now()}`,
        nombre: `Sector ${newNumber}`,
        color: SECTOR_COLORS[(newNumber - 1) % SECTOR_COLORS.length],
        numero: newNumber,
      },
    ])
  }

  const removeSector = (id: string) => {
    if (sectores.length > 1) {
      setSectores(sectores.filter((s) => s.id !== id))
    }
  }

  const updateSectorName = (id: string, nombre: string) => {
    setSectores(sectores.map((s) => (s.id === id ? { ...s, nombre } : s)))
  }

  const updateSectorColor = (id: string, color: string) => {
    setSectores(sectores.map((s) => (s.id === id ? { ...s, color } : s)))
  }

  const addPiso = () => {
    const maxNumero = pisos.length > 0 ? Math.max(...pisos.map((p) => p.numero)) : -1
    const newNumero = maxNumero + 1
    const newId = `tmp-p${Date.now()}`
    const newPiso: Piso = {
      id: newId,
      numero: newNumero,
      nombre: `P${newNumero}`,
      departamentos: [],
    }
    setPisos([...pisos, newPiso])
    setSelectedPiso(newId)
  }

  const removePiso = (id: string) => {
    if (pisos.length > 1) {
      setPisos(pisos.filter((p) => p.id !== id))
      if (selectedPiso === id) {
        setSelectedPiso(pisos.filter((p) => p.id !== id)[0]?.id || '')
      }
    }
  }

  const updatePisoName = (id: string, nombre: string) => {
    setPisos(pisos.map((p) => (p.id === id ? { ...p, nombre } : p)))
  }

  const addDepartmentToSelectedPiso = () => {
    const piso = pisos.find((p) => p.id === selectedPiso)
    if (piso && piso.departamentos.length < LETTERS.length) {
      const newLetter = LETTERS[piso.departamentos.length]
      setPisos(
        pisos.map((p) =>
          p.id === selectedPiso
            ? {
                ...p,
                departamentos: [
                  ...p.departamentos,
                  { id: `tmp-d${Date.now()}`, letra: newLetter, nombre: `Depto ${newLetter}`, sector_numero: sectores[0]?.numero || 1 },
                ],
              }
            : p,
        ),
      )
    }
  }

  const updateDepartmentName = (pisoId: string, departmentIndex: number, nombre: string) => {
    setPisos(
      pisos.map((p) =>
        p.id === pisoId
          ? {
              ...p,
              departamentos: p.departamentos.map((d, idx) =>
                idx === departmentIndex ? { ...d, nombre } : d,
              ),
            }
          : p,
      ),
    )
  }

  const updateDepartmentLetra = (pisoId: string, departmentIndex: number, letra: string) => {
    setPisos(
      pisos.map((p) =>
        p.id === pisoId
          ? {
              ...p,
              departamentos: p.departamentos.map((d, idx) =>
                idx === departmentIndex ? { ...d, letra } : d,
              ),
            }
          : p,
      ),
    )
  }

  const updateDepartmentSector = (pisoId: string, departmentIndex: number, sectorNumero: number) => {
    setPisos(
      pisos.map((p) =>
        p.id === pisoId
          ? {
              ...p,
              departamentos: p.departamentos.map((d, idx) =>
                idx === departmentIndex ? { ...d, sector_numero: sectorNumero } : d,
              ),
            }
          : p,
      ),
    )
  }

  const removeDepartment = (pisoId: string, departmentIndex: number) => {
    setPisos(
      pisos.map((p) =>
        p.id === pisoId
          ? {
              ...p,
              departamentos: p.departamentos.filter((_, idx) => idx !== departmentIndex),
            }
          : p,
      ),
    )
  }

  const handleSave = () => {
    const obraId = isEditing ? editingData!.obra_id : selectedObraId
    onSave(obraId, { sectores, pisos }, pdfFiles)
  }

  const canProceedFromObra = selectedObraId !== ''
  const steps = isEditing
    ? (['sectores', 'pisos', 'departamentos', 'asignacion', 'archivos'] as const)
    : (['obra', 'sectores', 'pisos', 'departamentos', 'asignacion', 'archivos'] as const)

  const stepLabels: Record<string, string> = {
    obra: 'Obra',
    sectores: 'Sectores',
    pisos: 'Pisos',
    departamentos: 'Deptos',
    asignacion: 'Asignación',
    archivos: 'Archivos',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {isEditing ? `Editar: ${selectedObraName}` : 'Nueva Sectorización'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isEditing ? 'Modifica sectores, pisos y departamentos' : 'Configura sectores, pisos y departamentos'}
            </p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-border rounded transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Step Indicators */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {steps.map((s, idx) => (
              <button
                key={s}
                onClick={() => setStep(s as any)}
                disabled={s === 'obra' ? false : !canProceedFromObra && !isEditing}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-40 ${
                  step === s ? 'bg-accent text-background' : 'bg-border text-foreground hover:bg-border/80'
                }`}
              >
                {idx + 1}. {stepLabels[s]}
              </button>
            ))}
          </div>

          {/* Step 0: Select Obra */}
          {step === 'obra' && !isEditing && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Seleccionar Obra</h3>
              <p className="text-sm text-muted-foreground">Elige la obra a la que se le asignará la sectorización</p>
              {obras.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    No hay obras activas disponibles para sectorizar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {obras.map((obra) => (
                    <button
                      key={obra.id}
                      onClick={() => setSelectedObraId(obra.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedObraId === obra.id
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-background hover:border-border/80'
                      }`}
                    >
                      <p className="font-bold text-foreground text-sm">{obra.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {obra.ubicacion || 'Sin ubicación'} · {obra.responsable || 'Sin responsable'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Sectores */}
          {step === 'sectores' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Definir Sectores</h3>
              <div className="space-y-3">
                {sectores.map((sector) => (
                  <div key={sector.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                    <input
                      type="color"
                      value={sector.color}
                      onChange={(e) => updateSectorColor(sector.id, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                      title="Cambiar color"
                    />
                    <input
                      type="text"
                      value={sector.nombre}
                      onChange={(e) => updateSectorName(sector.id, e.target.value)}
                      className="flex-1 bg-transparent text-foreground text-sm focus:outline-none border-b border-transparent hover:border-border focus:border-accent"
                    />
                    <span className="text-xs text-muted-foreground font-mono">#{sector.numero}</span>
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
                {pisos.map((piso) => (
                  <div key={piso.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                    <div className="text-sm font-mono font-bold text-accent min-w-[2rem]">#{piso.numero}</div>
                    <input
                      type="text"
                      value={piso.nombre}
                      onChange={(e) => updatePisoName(piso.id, e.target.value)}
                      placeholder="ej: P1, PB, Terraza"
                      className="flex-1 bg-transparent text-foreground text-sm focus:outline-none border-b border-transparent hover:border-border focus:border-accent"
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
              <h3 className="text-lg font-bold text-foreground">Agregar Departamentos por Piso</h3>

              {/* Piso Selector */}
              <div className="flex gap-2 flex-wrap">
                {pisos.map((piso) => (
                  <button
                    key={piso.id}
                    onClick={() => setSelectedPiso(piso.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedPiso === piso.id
                        ? 'bg-accent text-background'
                        : 'bg-border text-foreground hover:bg-border/80'
                    }`}
                  >
                    {piso.nombre} ({pisos.find((p) => p.id === piso.id)?.departamentos.length || 0})
                  </button>
                ))}
              </div>

              {/* Departamentos del Piso Seleccionado */}
              <div className="space-y-2">
                {pisos
                  .find((p) => p.id === selectedPiso)
                  ?.departamentos.map((dept, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-background border border-border rounded">
                      <input
                        type="text"
                        value={dept.letra}
                        onChange={(e) => updateDepartmentLetra(selectedPiso, idx, e.target.value.toUpperCase())}
                        maxLength={10}
                        className="w-12 px-2 py-1 bg-accent/20 rounded font-bold text-accent text-sm text-center focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <input
                        type="text"
                        value={dept.nombre}
                        onChange={(e) => updateDepartmentName(selectedPiso, idx, e.target.value)}
                        placeholder="ej: Depto A, Recepción, Terraza"
                        className="flex-1 bg-transparent text-foreground text-sm focus:outline-none border-b border-transparent hover:border-border focus:border-accent"
                      />
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

              {pisos.map((piso) => (
                <div key={piso.id} className="border border-border rounded-lg p-4">
                  <button
                    onClick={() => setExpandedPiso(expandedPiso === piso.id ? null : piso.id)}
                    className="w-full flex items-center justify-between p-2 hover:bg-background rounded transition-colors"
                  >
                    <h4 className="font-bold text-foreground text-sm">
                      {piso.nombre}{' '}
                      <span className="text-muted-foreground font-normal">({piso.departamentos.length} deptos)</span>
                    </h4>
                    {expandedPiso === piso.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {expandedPiso === piso.id && (
                    <div className="mt-3 space-y-2">
                      {piso.departamentos.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          No hay departamentos. Agréga algunos en el paso anterior.
                        </p>
                      ) : (
                        piso.departamentos.map((dept, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-background border border-border rounded">
                            <input
                              type="text"
                              value={dept.letra}
                              onChange={(e) => updateDepartmentLetra(piso.id, idx, e.target.value.toUpperCase())}
                              maxLength={10}
                              className="w-12 px-2 py-1 bg-accent/20 rounded font-bold text-accent text-sm text-center focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                            <select
                              value={dept.sector_numero}
                              onChange={(e) => updateDepartmentSector(piso.id, idx, Number(e.target.value))}
                              className="flex-1 px-2 py-1.5 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                            >
                              {sectores.map((sector) => (
                                <option key={sector.numero} value={sector.numero}>
                                  {sector.nombre}
                                </option>
                              ))}
                            </select>
                            <div
                              className="w-4 h-4 rounded border border-border"
                              style={{
                                backgroundColor: sectores.find((s) => s.numero === dept.sector_numero)?.color,
                              }}
                            ></div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 'archivos' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Archivos PDF</h3>
              <p className="text-sm text-muted-foreground">
                Adjunta planos u otros documentos PDF a esta sectorización (opcional)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files
                  if (!files) return
                  const newFiles: WizardFile[] = Array.from(files).map((f) => ({
                    file: f,
                    id: crypto.randomUUID(),
                  }))
                  setPdfFiles((prev) => [...prev, ...newFiles])
                  e.target.value = ''
                }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-accent hover:text-accent transition-colors"
              >
                <Upload className="w-5 h-5" />
                Seleccionar archivos PDF
              </button>

              {pdfFiles.length > 0 && (
                <div className="space-y-2">
                  {pdfFiles.map((pf, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg"
                    >
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{pf.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(pf.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => setPdfFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 sm:p-6 flex gap-3 z-10">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-border transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isEditing && !canProceedFromObra}
            className="flex-1 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Actualizar' : 'Crear Sectorización'}
          </button>
        </div>
      </div>
    </div>
  )
}
