'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { TopBar } from '@/components/top-bar'
import Link from 'next/link'
import { Eye, Plus, ArrowRight } from 'lucide-react'
import { MOCK_ALMACENES_EXTERNOS, MOCK_ALMACENES_OBRA } from '@/lib/constants'

export default function AlmacenesPage() {
  const [selectedObra, setSelectedObra] = useState<string>('Todas')

  const obras = ['Torre Anaya', 'Edif. Panamericana Norte', 'Todas']
  
  const obraWarehouseGroups = {
    'Torre Anaya': MOCK_ALMACENES_OBRA.filter(a => a.obra === 'Torre Anaya'),
    'Edif. Panamericana Norte': MOCK_ALMACENES_OBRA.filter(a => a.obra === 'Edif. Panamericana Norte'),
    'Todas': MOCK_ALMACENES_OBRA,
  }

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Almacenes</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gestión de almacenes externos y dentro de obra</p>
        </div>

        {/* SECTION A: Externos (fijos) */}
        <section>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-400 rounded-full"></span>
              Externos (fijos)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_ALMACENES_EXTERNOS.map((almacen) => (
                <div
                  key={almacen.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors"
                  style={{
                    borderLeft: '4px solid rgb(34, 211, 238)',
                  }}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground">{almacen.nombre}</h3>
                    <p className="text-sm text-accent font-medium mt-1">{almacen.tipo}</p>
                  </div>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Responsable:</span>
                      <span className="text-foreground font-medium">{almacen.responsable}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      <span className="px-3 py-1 bg-green-900 text-green-200 rounded text-xs font-medium">
                        {almacen.estado}
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
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-border text-foreground rounded-lg hover:bg-border/80 transition-colors font-medium text-sm">
                      <ArrowRight className="w-4 h-4" />
                      Movimiento
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION B: Dentro de obra */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-400 rounded-full"></span>
              Dentro de obra
            </h2>

            {/* Obra Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {obras.map((obra) => {
                const count = selectedObra === obra 
                  ? obraWarehouseGroups[obra as keyof typeof obraWarehouseGroups].length
                  : 0
                const allCount = selectedObra === 'Todas' 
                  ? MOCK_ALMACENES_OBRA.length
                  : 0

                return (
                  <button
                    key={obra}
                    onClick={() => setSelectedObra(obra)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      selectedObra === obra
                        ? 'bg-accent text-background'
                        : 'bg-border text-foreground hover:bg-border/80'
                    }`}
                  >
                    {obra === 'Todas'
                      ? `${obra} (${MOCK_ALMACENES_OBRA.length})`
                      : `${obra} (${obraWarehouseGroups[obra as keyof typeof obraWarehouseGroups].length})`}
                  </button>
                )
              })}
            </div>

            {/* Warehouse Cards for selected obra */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {obraWarehouseGroups[selectedObra as keyof typeof obraWarehouseGroups].map((almacen) => (
                <div
                  key={almacen.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors"
                  style={{
                    borderLeft: '4px solid rgb(245, 158, 11)',
                  }}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground">{almacen.nombre}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{almacen.obra}</p>
                    <p className="text-sm text-accent font-medium mt-2">{almacen.tipo}</p>
                  </div>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Responsable:</span>
                      <span className="text-foreground font-medium">{almacen.responsable}</span>
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
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-border text-foreground rounded-lg hover:bg-border/80 transition-colors font-medium text-sm">
                      <ArrowRight className="w-4 h-4" />
                      Movimiento
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
      </div>
    </AppShell>
  )
}
