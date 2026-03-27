'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { ChevronLeft } from 'lucide-react'
import { MOCK_SECTORIZATION } from '@/lib/constants'
import type { ObraSectorizacion, Piso, Sector, Departamento } from '@/types'

export default function SectorizacionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const obraId = params.obraId as string

  const sectorization = MOCK_SECTORIZATION.find(s => s.obraId === obraId)

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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">{sectorization.nombre_obra}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Detalles de sectorización y distribución de departamentos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
                  {piso.departamentos.map((dept: Departamento, idx: number) => {
                    const sector = sectorization.sectores.find((s: Sector) => s.id === dept.sector_id)
                    return (
                      <div
                        key={idx}
                        className="aspect-square flex items-center justify-center rounded-lg border-2 font-bold text-sm"
                        style={{
                          backgroundColor: sector ? `${sector.color}30` : '#999999',
                          borderColor: sector?.color || '#999999',
                          color: sector?.color || '#999999',
                        }}
                        title={sector?.nombre}
                      >
                        {dept.letra}
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
                      const deptCount = piso.departamentos.filter(d => d.sector_id === sector.id).length
                      const depts = piso.departamentos
                        .filter(d => d.sector_id === sector.id)
                        .map(d => d.letra)
                        .join(', ')
                      
                      if (deptCount === 0) return null
                      
                      return (
                        <div key={sector.id} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: sector.color }}
                          ></div>
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
                    (acc: number, p: Piso) => acc + p.departamentos.filter((d: Departamento) => d.sector_id === sector.id).length,
                    0
                  )
                  const pisosCon = new Set(
                    sectorization.pisos
                      .filter((p: Piso) => p.departamentos.some((d: Departamento) => d.sector_id === sector.id))
                      .map((p: Piso) => p.nombre)
                  )
                  
                  return (
                    <tr key={sector.id} className="border-b border-border hover:bg-background/50">
                      <td className="px-3 py-3 font-medium text-foreground flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: sector.color }}
                        ></div>
                        {sector.nombre}
                      </td>
                      <td className="px-3 py-3 text-center font-bold" style={{ color: sector.color }}>
                        {totalDepts}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">
                        {Array.from(pisosCon).join(', ')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
