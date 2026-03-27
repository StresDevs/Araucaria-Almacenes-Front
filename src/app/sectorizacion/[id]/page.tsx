'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { ChevronLeft, Loader2, FileText, Download, Trash2, Upload } from 'lucide-react'
import { useSectorizacion } from '@/hooks/use-sectorizacion'
import type { ObraSectorizacion, Piso, Sector, Departamento, SectorizacionArchivo } from '@/types'

export default function SectorizacionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { getById, addArchivo, removeArchivo } = useSectorizacion()
  const [sectorization, setSectorization] = useState<ObraSectorizacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getById(id)
      setSectorization(data)
      setLoading(false)
    }
    load()
  }, [id, getById])

  const handleAddArchivo = async () => {
    if (!sectorization) return
    // Simulate file selection – In a real implementation you'd use a file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setUploading(true)
      // For now we create a mock URL since we don't have file upload backend
      const dto = {
        nombreOriginal: file.name,
        nombreArchivo: `${Date.now()}_${file.name}`,
        url: `/uploads/${Date.now()}_${file.name}`,
        mimetype: file.type || 'application/pdf',
        tamanio: file.size,
      }
      const result = await addArchivo(sectorization.id, dto)
      if (result) {
        setSectorization((prev) =>
          prev ? { ...prev, archivos: [...prev.archivos, result] } : prev,
        )
      }
      setUploading(false)
    }
    input.click()
  }

  const handleRemoveArchivo = async (archivoId: string) => {
    if (!confirm('¿Eliminar este archivo?')) return
    const ok = await removeArchivo(archivoId)
    if (ok) {
      setSectorization((prev) =>
        prev ? { ...prev, archivos: prev.archivos.filter((a) => a.id !== archivoId) } : prev,
      )
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    )
  }

  if (!sectorization) {
    return (
      <AppShell>
        <div className="w-full max-w-6xl mx-auto">
          <Link href="/sectorizacion" className="flex items-center gap-2 text-accent hover:underline mb-6">
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>
          <div className="bg-background border border-dashed border-border rounded-lg p-8 text-center">
            <p className="text-foreground font-medium">Sectorización no encontrada</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/sectorizacion" className="flex items-center gap-2 text-accent hover:underline mb-4 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">
              {sectorization.nombre_obra || 'Sin nombre'}
            </h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                sectorization.estado === 'activa'
                  ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                  : 'bg-red-900/30 text-red-400 border border-red-500/30'
              }`}
            >
              {sectorization.estado}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Detalles de sectorización y distribución de departamentos
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Sectores</p>
            <p className="text-3xl sm:text-4xl font-bold text-foreground mt-2">{sectorization.sectores.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Pisos</p>
            <p className="text-3xl sm:text-4xl font-bold text-accent mt-2">{sectorization.pisos.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Departamentos</p>
            <p className="text-3xl sm:text-4xl font-bold text-accent mt-2">
              {sectorization.pisos.reduce((acc: number, p: Piso) => acc + p.departamentos.length, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase">Archivos</p>
            <p className="text-3xl sm:text-4xl font-bold text-accent mt-2">{sectorization.archivos.length}</p>
          </div>
        </div>

        {/* Sectores Legend */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Sectores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sectorization.sectores.map((sector: Sector) => (
              <div key={sector.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: sector.color }}></div>
                <div>
                  <p className="font-bold text-foreground text-sm">{sector.nombre}</p>
                  <p className="text-xs text-muted-foreground">Sector {sector.numero}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pisos y Departamentos */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Distribución por Piso</h2>

          {sectorization.pisos.map((piso: Piso) => (
            <div key={piso.id} className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">{piso.nombre}</h3>

              {piso.departamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay departamentos asignados</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {piso.departamentos.map((dept: Departamento) => {
                    const sector = sectorization.sectores.find((s: Sector) => s.numero === dept.sector_numero)
                    return (
                      <div
                        key={dept.id}
                        className="flex flex-col items-center justify-center rounded-lg border-2 p-2 min-h-[4rem]"
                        style={{
                          backgroundColor: sector ? `${sector.color}30` : '#999999',
                          borderColor: sector?.color || '#999999',
                          color: sector?.color || '#999999',
                        }}
                        title={dept.nombre || dept.letra}
                      >
                        <span className="font-bold text-sm">{dept.letra}</span>
                        {dept.nombre && dept.nombre !== dept.letra && (
                          <span className="text-[10px] leading-tight text-center opacity-80 mt-0.5 truncate w-full">
                            {dept.nombre}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Sector Summary for this floor */}
              {piso.departamentos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase">Resumen por sector:</p>
                  <div className="space-y-1">
                    {sectorization.sectores.map((sector: Sector) => {
                      const deptCount = piso.departamentos.filter((d) => d.sector_numero === sector.numero).length
                      const depts = piso.departamentos
                        .filter((d) => d.sector_numero === sector.numero)
                        .map((d) => d.nombre ? `${d.letra} (${d.nombre})` : d.letra)
                        .join(', ')

                      if (deptCount === 0) return null

                      return (
                        <div key={sector.id} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: sector.color }}></div>
                          <span className="text-foreground font-medium">{sector.nombre}:</span>
                          <span className="text-muted-foreground">{depts}</span>
                          <span className="text-xs text-muted-foreground ml-auto">({deptCount})</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Statistics Table */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Estadísticas Generales</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Sector</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Total Departamentos</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Pisos con Departamentos</th>
                </tr>
              </thead>
              <tbody>
                {sectorization.sectores.map((sector: Sector) => {
                  const totalDepts = sectorization.pisos.reduce(
                    (acc: number, p: Piso) => acc + p.departamentos.filter((d: Departamento) => d.sector_numero === sector.numero).length,
                    0,
                  )
                  const pisosCon = new Set(
                    sectorization.pisos
                      .filter((p: Piso) => p.departamentos.some((d: Departamento) => d.sector_numero === sector.numero))
                      .map((p: Piso) => p.nombre),
                  )

                  return (
                    <tr key={sector.id} className="border-b border-border hover:bg-background/50">
                      <td className="px-3 py-3 font-medium text-foreground flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: sector.color }}></div>
                        {sector.nombre}
                      </td>
                      <td className="px-3 py-3 text-center font-bold" style={{ color: sector.color }}>
                        {totalDepts}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">{Array.from(pisosCon).join(', ')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Archivos / PDFs */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Archivos de Respaldo</h2>
            {sectorization.estado === 'activa' && (
              <button
                onClick={handleAddArchivo}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-1.5 bg-accent text-background rounded hover:bg-accent/90 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Subir PDF
              </button>
            )}
          </div>

          {sectorization.archivos.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-6 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No hay archivos adjuntos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sectorization.archivos.map((archivo: SectorizacionArchivo) => (
                <div
                  key={archivo.id}
                  className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg"
                >
                  <FileText className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{archivo.nombre_original}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(archivo.tamanio)} · {new Date(archivo.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={archivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-border rounded transition-colors"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4 text-accent" />
                    </a>
                    {sectorization.estado === 'activa' && (
                      <button
                        onClick={() => handleRemoveArchivo(archivo.id)}
                        className="p-2 hover:bg-red-900/20 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-background border border-border rounded-lg p-4 text-xs text-muted-foreground">
          <p>Creado: {new Date(sectorization.created_at).toLocaleDateString('es-ES')}</p>
          <p>Actualizado: {new Date(sectorization.updated_at).toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </AppShell>
  )
}
