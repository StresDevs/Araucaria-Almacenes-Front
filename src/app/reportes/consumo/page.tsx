'use client'

import { useState, useMemo, useEffect, useCallback, useRef, Fragment } from 'react'
import { AppShell } from '@/components/app-shell'
import {
  Search, ChevronDown, FileSpreadsheet, FileText,
  BarChart3, Package, Building2, Layers, Loader2, Save,
} from 'lucide-react'
import { getHTMLPDFStyles, getHTMLPDFHeader, getHTMLPDFFooter, formatDatePDF } from '@/lib/pdf-layout'
import { useObras } from '@/hooks/use-obras'
import { useCategorias } from '@/hooks/use-categorias'
import { useSectorizacion } from '@/hooks/use-sectorizacion'
import { inventarioService, consumoService } from '@/services'
import type { ItemInventario } from '@/types'
import type { ConsumoRecord } from '@/services/endpoints/consumo.service'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ItemConsumo {
  id: string
  aplicacion: string
  item_code: string
  codigo: string
  medida: string
  m2_por_caja: number
  espacio_de_uso: string
}

interface ConsumoData {
  id: string
  categoria: string
  obra_id: string
  obra_nombre: string
  fecha_actualizacion: string
  items: ItemConsumo[]
  departamentos: string[]
  consumo: Record<string, Record<string, number | null>>
}

// Floor grouping helpers
interface FloorGroup {
  piso: string
  label: string
  deptos: string[]
  colorIdx: number
}

const FLOOR_COLORS = [
  { bg: 'bg-amber-900/15', border: 'border-amber-700/30', text: 'text-amber-400', badge: 'bg-amber-600', badgeBorder: 'border-amber-500', stickyBg: 'bg-amber-950/80' },
  { bg: 'bg-sky-900/15', border: 'border-sky-700/30', text: 'text-sky-400', badge: 'bg-sky-600', badgeBorder: 'border-sky-500', stickyBg: 'bg-sky-950/80' },
  { bg: 'bg-violet-900/15', border: 'border-violet-700/30', text: 'text-violet-400', badge: 'bg-violet-600', badgeBorder: 'border-violet-500', stickyBg: 'bg-violet-950/80' },
  { bg: 'bg-emerald-900/15', border: 'border-emerald-700/30', text: 'text-emerald-400', badge: 'bg-emerald-600', badgeBorder: 'border-emerald-500', stickyBg: 'bg-emerald-950/80' },
  { bg: 'bg-rose-900/15', border: 'border-rose-700/30', text: 'text-rose-400', badge: 'bg-rose-600', badgeBorder: 'border-rose-500', stickyBg: 'bg-rose-950/80' },
  { bg: 'bg-orange-900/15', border: 'border-orange-700/30', text: 'text-orange-400', badge: 'bg-orange-600', badgeBorder: 'border-orange-500', stickyBg: 'bg-orange-950/80' },
]

const FLOOR_PDF_COLORS = [
  { bg: '#fef3c7', border: '#d97706', text: '#b45309', badge: '#d97706', subtotalBg: '#fde68a' },
  { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1', badge: '#0284c7', subtotalBg: '#bae6fd' },
  { bg: '#ede9fe', border: '#7c3aed', text: '#6d28d9', badge: '#7c3aed', subtotalBg: '#ddd6fe' },
  { bg: '#d1fae5', border: '#059669', text: '#047857', badge: '#059669', subtotalBg: '#a7f3d0' },
  { bg: '#ffe4e6', border: '#e11d48', text: '#be123c', badge: '#e11d48', subtotalBg: '#fecdd3' },
  { bg: '#ffedd5', border: '#ea580c', text: '#c2410c', badge: '#ea580c', subtotalBg: '#fed7aa' },
]

function groupByFloor(departamentos: string[]): FloorGroup[] {
  const groups: FloorGroup[] = []
  let colorIdx = 0

  // Check for "rotura" first
  if (departamentos.includes('rotura')) {
    groups.push({ piso: 'rotura', label: 'Rotura', deptos: ['rotura'], colorIdx: -1 })
  }

  // Group by floor number prefix
  const floorMap = new Map<string, string[]>()
  departamentos.filter(d => d !== 'rotura').forEach(d => {
    const match = d.match(/^(\d+)/)
    const floor = match ? match[1] : 'otro'
    if (!floorMap.has(floor)) floorMap.set(floor, [])
    floorMap.get(floor)!.push(d)
  })

  floorMap.forEach((deptos, floor) => {
    groups.push({
      piso: floor,
      label: floor === 'otro' ? 'Otros' : `Piso ${floor}`,
      deptos,
      colorIdx: colorIdx % FLOOR_COLORS.length,
    })
    colorIdx++
  })

  return groups
}

// ─── calcM2PorCaja ─────────────────────────────────────────────────────────────

function calcM2PorCaja(item: ItemInventario): number {
  if (item.medida && item.piezas_por_caja) {
    const match = item.medida.match(/^(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)$/)
    if (match) {
      const w = parseFloat(match[1]) / 100
      const h = parseFloat(match[2]) / 100
      return parseFloat((w * h * item.piezas_por_caja).toFixed(2))
    }
  }
  if (item.rendimiento) {
    const num = parseFloat(item.rendimiento)
    if (!isNaN(num)) return num
  }
  return 0
}

function toItemConsumo(item: ItemInventario): ItemConsumo {
  return {
    id: item.id,
    aplicacion: item.aplicacion ?? '',
    item_code: item.item_numero ?? '',
    codigo: item.codigo,
    medida: item.medida ?? '',
    m2_por_caja: calcM2PorCaja(item),
    espacio_de_uso: item.espacio_de_uso ?? '',
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function formatDateShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatDateLong(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getItemTotal(data: ConsumoData, itemId: string) {
  return data.departamentos.reduce((s, d) => s + (data.consumo[d]?.[itemId] || 0), 0)
}
function getFloorTotal(data: ConsumoData, deptos: string[], itemId: string) {
  return deptos.reduce((s, d) => s + (data.consumo[d]?.[itemId] || 0), 0)
}
function getTotalM2(data: ConsumoData) {
  return data.items.reduce((s, it) => s + getItemTotal(data, it.id), 0)
}

// ─── Excel Export ──────────────────────────────────────────────────────────────

function exportToExcel(data: ConsumoData) {
  const lines: string[] = []
  const groups = groupByFloor(data.departamentos)

  lines.push(`${data.obra_nombre}`)
  lines.push(`CONSUMO DE ${data.categoria.toUpperCase()}`)
  lines.push(`FECHA DE ACTUALIZACIÓN: ${formatDateShort(data.fecha_actualizacion)}`)
  lines.push('')

  const headerApp = ['Aplicación', ...data.items.map(i => i.aplicacion)]
  lines.push(headerApp.join(','))
  const headerItem = ['ITEM', ...data.items.map(i => i.item_code)]
  lines.push(headerItem.join(','))
  const headerCod = ['Código', ...data.items.map(i => `"${i.codigo}"`)]
  lines.push(headerCod.join(','))
  const headerMed = ['Medida', ...data.items.map(i => i.medida)]
  lines.push(headerMed.join(','))
  const headerM2 = ['m2 por caja', ...data.items.map(i => i.m2_por_caja)]
  lines.push(headerM2.join(','))
  const headerEsp = ['Espacio de uso', ...data.items.map(i => `"${i.espacio_de_uso}"`)]
  lines.push(headerEsp.join(','))
  const unitRow = ['Departamento', ...data.items.map(() => 'M2')]
  lines.push(unitRow.join(','))

  groups.forEach(group => {
    // Floor separator
    lines.push('')
    lines.push(`--- ${group.label} ---`)

    group.deptos.forEach(dept => {
      const row = [dept, ...data.items.map(item => {
        const val = data.consumo[dept]?.[item.id]
        return val != null ? val.toFixed(2) : '-'
      })]
      lines.push(row.join(','))
    })

    // Floor subtotal
    if (group.deptos.length > 1) {
      const sub = [`Subtotal ${group.label}`, ...data.items.map(item => {
        const t = getFloorTotal(data, group.deptos, item.id)
        return t.toFixed(2)
      })]
      lines.push(sub.join(','))
    }
  })

  lines.push('')
  const totalsRow = ['TOTAL GENERAL', ...data.items.map(item => getItemTotal(data, item.id).toFixed(2))]
  lines.push(totalsRow.join(','))

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Reporte_Consumo_${data.categoria}_${data.obra_nombre.replace(/\s+/g, '_')}_${data.fecha_actualizacion}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── PDF Export ────────────────────────────────────────────────────────────────

function exportToPDF(data: ConsumoData) {
  const today = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  const groups = groupByFloor(data.departamentos)

  const floorRowsHtml = groups.map((group, gIdx) => {
    const pdfColor = group.colorIdx >= 0 ? FLOOR_PDF_COLORS[group.colorIdx % FLOOR_PDF_COLORS.length] : { bg: '#fff8f0', border: '#d97706', text: '#92400e', badge: '#d97706', subtotalBg: '#fef3c7' }

    const floorHeader = `<tr>
      <td colspan="${data.items.length + 1}" style="background:${pdfColor.badge}; color:#fff; font-weight:700; font-size:9px; padding:5px 10px; letter-spacing:0.5px; border:1px solid ${pdfColor.border};">
        ${escapeHtml(group.label)} ${group.piso !== 'rotura' ? `(${group.deptos.length} departamentos)` : ''}
      </td>
    </tr>`

    const dataRows = group.deptos.map((dept, dIdx) => {
      const isRotura = dept === 'rotura'
      const rowBg = dIdx % 2 === 0 ? pdfColor.bg : '#ffffff'
      return `<tr>
        <td style="background:${rowBg}; font-weight:700; text-align:left; padding:3px 8px; border:1px solid #ddd; color:${isRotura ? pdfColor.text : '#1a1a1a'}; ${isRotura ? 'font-style:italic;' : ''}">${escapeHtml(dept)}</td>
        ${data.items.map(item => {
          const val = data.consumo[dept]?.[item.id]
          return `<td style="background:${rowBg}; text-align:center; padding:3px 5px; border:1px solid #ddd; font-variant-numeric:tabular-nums; color:${val != null ? '#1a1a1a' : '#ccc'};">${val != null ? val.toFixed(2) : '-'}</td>`
        }).join('')}
      </tr>`
    }).join('')

    const subtotalRow = group.deptos.length > 1 ? `<tr>
      <td style="background:${pdfColor.subtotalBg}; font-weight:700; text-align:left; padding:4px 8px; border:1px solid ${pdfColor.border}; color:${pdfColor.text};">Subtotal ${escapeHtml(group.label)}</td>
      ${data.items.map(item => {
        const t = getFloorTotal(data, group.deptos, item.id)
        return `<td style="background:${pdfColor.subtotalBg}; text-align:center; padding:4px 5px; border:1px solid ${pdfColor.border}; font-weight:700; color:${pdfColor.text};">${t.toFixed(2)}</td>`
      }).join('')}
    </tr>` : ''

    return floorHeader + dataRows + subtotalRow
  }).join('')

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Reporte Consumo ${escapeHtml(data.categoria)} - ${today}</title>
<style>
  @page { size: landscape; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9px; color: #1a1a1a; background: #fff; padding-bottom: 30px; }

  ${getHTMLPDFStyles()}

  .subtitle { text-align: center; font-size: 12px; font-weight: 700; color: #2d5a3d; margin: 4px 0 2px 0; }
  .subtitle-obra { text-align: center; font-size: 10px; font-weight: 600; color: #4a7c59; margin-bottom: 6px; }

  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th, .data-table td { border: 1px solid #c8d6c0; padding: 3px 5px; text-align: center; font-size: 8px; }
  .data-table th { background: #4a7c59; color: #fff; font-weight: 600; letter-spacing: 0.3px; }
  .meta-row th.label { background: #2d5a3d; text-align: left; width: 90px; font-size: 8px; }
  .meta-row td { font-weight: 500; font-size: 8px; background: #f5f9f5; }
  .total-row td { background: #2d5a3d; color: #fff; font-weight: 700; font-size: 8.5px; border-color: #2d5a3d; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head><body>

${getHTMLPDFHeader({ title: 'INFORME TÉCNICO', date: formatDatePDF() })}

<div class="subtitle">Reporte Consumo ${escapeHtml(data.categoria)}</div>
<div class="subtitle-obra">${escapeHtml(data.obra_nombre)} · Actualización: ${formatDateShort(data.fecha_actualizacion)}</div>

<table class="data-table">
  <thead>
    <tr><th class="label" style="background:#2d5a3d; text-align:left; width:90px;">Aplicación</th>${data.items.map(i => `<th>${escapeHtml(i.aplicacion)}</th>`).join('')}</tr>
    <tr class="meta-row"><th class="label">ITEM</th>${data.items.map(i => `<td style="font-weight:700;">${escapeHtml(i.item_code)}</td>`).join('')}</tr>
    <tr class="meta-row"><th class="label">Código</th>${data.items.map(i => `<td style="font-family:monospace; font-size:7px;">${escapeHtml(i.codigo)}</td>`).join('')}</tr>
    <tr class="meta-row"><th class="label">Medida</th>${data.items.map(i => `<td>${escapeHtml(i.medida)}</td>`).join('')}</tr>
    <tr class="meta-row"><th class="label">m² por caja</th>${data.items.map(i => `<td style="font-weight:700; color:#2d5a3d;">${i.m2_por_caja}</td>`).join('')}</tr>
    <tr class="meta-row"><th class="label">Espacio de uso</th>${data.items.map(i => `<td style="font-size:7px; text-transform:uppercase;">${escapeHtml(i.espacio_de_uso)}</td>`).join('')}</tr>
    <tr><th style="text-align:left;">Departamento</th>${data.items.map(() => `<th>M2</th>`).join('')}</tr>
  </thead>
  <tbody>
    ${floorRowsHtml}
    <tr class="total-row">
      <td style="text-align:left; font-weight:700;">TOTAL GENERAL</td>
      ${data.items.map(item => `<td>${getItemTotal(data, item.id).toFixed(2)}</td>`).join('')}
    </tr>
  </tbody>
</table>

${getHTMLPDFFooter()}

</body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    const logoImg = win.document.querySelector('.header-logo') as HTMLImageElement
    if (logoImg) {
      logoImg.src = window.location.origin + '/araucaria-logo.png'
      logoImg.onload = () => setTimeout(() => win.print(), 300)
      logoImg.onerror = () => setTimeout(() => win.print(), 300)
    } else {
      setTimeout(() => win.print(), 300)
    }
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ReporteConsumoPage() {
  const { obras } = useObras()
  const { categorias } = useCategorias()
  const { items: sectorizaciones } = useSectorizacion()

  const [selectedObra, setSelectedObra] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [allImportItems, setAllImportItems] = useState<ItemInventario[]>([])
  const [consumoRecords, setConsumoRecords] = useState<ConsumoRecord[]>([])
  const [localValues, setLocalValues] = useState<Record<string, Record<string, string>>>({})
  const [loadingItems, setLoadingItems] = useState(false)
  const [loadingConsumo, setLoadingConsumo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const obrasActivas = useMemo(() => obras.filter(o => o.estado === 'activa'), [obras])

  // Fetch items (both importacion types) once
  useEffect(() => {
    let cancelled = false
    setLoadingItems(true)
    Promise.all([
      inventarioService.getAll('importacion_nueva'),
      inventarioService.getAll('importacion_antigua'),
    ]).then(([resN, resA]) => {
      if (cancelled) return
      setAllImportItems([...(resN.data ?? []), ...(resA.data ?? [])])
      setLoadingItems(false)
    }).catch(() => { if (!cancelled) setLoadingItems(false) })
    return () => { cancelled = true }
  }, [])

  // Fetch consumo records when obra changes
  useEffect(() => {
    if (!selectedObra) { setConsumoRecords([]); return }
    let cancelled = false
    setLoadingConsumo(true)
    consumoService.getByObra(selectedObra).then(res => {
      if (cancelled) return
      setConsumoRecords(res.data ?? [])
      setLoadingConsumo(false)
    }).catch(() => { if (!cancelled) setLoadingConsumo(false) })
    return () => { cancelled = true }
  }, [selectedObra])

  // Current sectorizacion for selected obra
  const currentSect = useMemo(() =>
    sectorizaciones.find(s => s.obra_id === selectedObra) ?? null,
    [sectorizaciones, selectedObra]
  )

  // Build department list from pisos
  const deptEntries = useMemo(() => {
    if (!currentSect) return []
    const result: { label: string; id: string }[] = []
    result.push({ label: 'rotura', id: 'rotura' })
    const sortedPisos = [...currentSect.pisos].sort((a, b) => a.numero - b.numero)
    for (const piso of sortedPisos) {
      const sortedDeptos = [...piso.departamentos].sort((a, b) => a.letra.localeCompare(b.letra))
      for (const dept of sortedDeptos) {
        result.push({ label: `${piso.numero}${dept.letra}`, id: dept.id })
      }
    }
    return result
  }, [currentSect])

  const deptLabels = useMemo(() => deptEntries.map(d => d.label), [deptEntries])
  const labelToId = useMemo(() => {
    const map: Record<string, string> = {}
    deptEntries.forEach(d => { map[d.label] = d.id })
    return map
  }, [deptEntries])
  const idToLabel = useMemo(() => {
    const map: Record<string, string> = {}
    deptEntries.forEach(d => { map[d.id] = d.label })
    return map
  }, [deptEntries])

  // Items filtered by selected category
  const filteredItems = useMemo(() => {
    if (!selectedCategoria) return []
    return allImportItems.filter(i => i.categoria_id === selectedCategoria)
  }, [allImportItems, selectedCategoria])

  const itemsConsumo = useMemo(() => filteredItems.map(toItemConsumo), [filteredItems])

  // Build consumo grid from records + populate local values
  useEffect(() => {
    const local: Record<string, Record<string, string>> = {}
    for (const { label } of deptEntries) {
      local[label] = {}
      for (const item of filteredItems) {
        const deptId = labelToId[label]
        if (deptId === 'rotura') {
          local[label][item.id] = ''
          continue
        }
        const record = consumoRecords.find(r => r.item_id === item.id && r.departamento_id === deptId)
        local[label][item.id] = record ? String(record.cantidad) : ''
      }
    }
    setLocalValues(local)
    setDirty(false)
  }, [consumoRecords, deptEntries, filteredItems, labelToId])

  // Build ConsumoData for export/stats
  const consumoData: ConsumoData | null = useMemo(() => {
    if (!selectedObra || !selectedCategoria || itemsConsumo.length === 0 || deptLabels.length <= 1) return null
    const obraName = obrasActivas.find(o => o.id === selectedObra)?.nombre ?? ''
    const catName = categorias.find(c => c.id === selectedCategoria)?.nombre ?? ''
    const consumo: Record<string, Record<string, number | null>> = {}
    for (const label of deptLabels) {
      consumo[label] = {}
      for (const item of itemsConsumo) {
        const val = parseFloat(localValues[label]?.[item.id] ?? '')
        consumo[label][item.id] = isNaN(val) ? null : val
      }
    }
    return {
      id: `${selectedObra}-${selectedCategoria}`,
      categoria: catName,
      obra_id: selectedObra,
      obra_nombre: obraName,
      fecha_actualizacion: new Date().toISOString().slice(0, 10),
      items: itemsConsumo,
      departamentos: deptLabels,
      consumo,
    }
  }, [selectedObra, selectedCategoria, itemsConsumo, deptLabels, localValues, obrasActivas, categorias])

  const handleCellChange = useCallback((deptLabel: string, itemId: string, value: string) => {
    setLocalValues(prev => ({
      ...prev,
      [deptLabel]: { ...prev[deptLabel], [itemId]: value },
    }))
    setDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!selectedObra || !dirty) return
    setSaving(true)
    const valores: { itemId: string; departamentoId: string; cantidad: number }[] = []
    Object.entries(localValues).forEach(([deptLabel, items]) => {
      const deptId = labelToId[deptLabel]
      if (!deptId || deptId === 'rotura') return
      Object.entries(items).forEach(([itemId, val]) => {
        const num = parseFloat(val)
        if (!isNaN(num) && num >= 0) {
          valores.push({ itemId, departamentoId: deptId, cantidad: num })
        }
      })
    })
    try {
      await consumoService.save({ obraId: selectedObra, valores })
      setDirty(false)
    } catch { /* ignore */ }
    setSaving(false)
  }, [selectedObra, dirty, localValues, labelToId])

  const isLoading = loadingItems || loadingConsumo
  const hasData = consumoData !== null && consumoData.items.length > 0

  return (
    <AppShell>
      <div className="w-full max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reporte de Consumo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consumo de materiales de importación por departamento, obra y categoría
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-1">
            <Search className="w-4 h-4 text-accent" />
            Filtros
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-1.5 uppercase">Obra</label>
              <div className="relative">
                <select
                  value={selectedObra}
                  onChange={(e) => { setSelectedObra(e.target.value); setDirty(false) }}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none pr-8"
                >
                  <option value="">Seleccionar obra</option>
                  {obrasActivas.map(o => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-1.5 uppercase">Categoría</label>
              <div className="relative">
                <select
                  value={selectedCategoria}
                  onChange={(e) => { setSelectedCategoria(e.target.value); setDirty(false) }}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none pr-8"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando datos...</span>
          </div>
        )}

        {/* No selection */}
        {!isLoading && (!selectedObra || !selectedCategoria) && (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Selecciona una obra y una categoría para ver el reporte de consumo</p>
          </div>
        )}

        {/* No items found */}
        {!isLoading && selectedObra && selectedCategoria && !hasData && (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No se encontraron ítems de importación para la categoría seleccionada</p>
            {!currentSect && (
              <p className="text-muted-foreground text-xs mt-2">Esta obra no tiene sectorización configurada</p>
            )}
          </div>
        )}

        {/* Data Table */}
        {!isLoading && hasData && consumoData && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-3.5 h-3.5 text-accent" />
                  <p className="text-xs text-muted-foreground font-mono uppercase">Ítems</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-accent">{consumoData.items.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  <p className="text-xs text-muted-foreground font-mono uppercase">Pisos</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{groupByFloor(consumoData.departamentos).filter(g => g.piso !== 'rotura').length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-accent" />
                  <p className="text-xs text-muted-foreground font-mono uppercase">Deptos</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{consumoData.departamentos.filter(d => d !== 'rotura').length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-accent" />
                  <p className="text-xs text-muted-foreground font-mono uppercase">Total M²</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-accent">{getTotalM2(consumoData).toFixed(0)}</p>
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Export/Save bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-border/5 border-b border-border">
                <div className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{consumoData.obra_nombre}</span>
                  <span className="mx-1.5">—</span>
                  Consumo de {consumoData.categoria}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors disabled:opacity-40"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Guardar</span>
                  </button>
                  <button onClick={() => exportToExcel(consumoData)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-700 text-white rounded-lg text-xs font-medium hover:bg-green-800 transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <button onClick={() => exportToPDF(consumoData)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800 transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
              </div>

              {/* Spreadsheet-style table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: `${90 + consumoData.items.length * 95}px` }}>
                  {/* META HEADER */}
                  <thead>
                    {/* Aplicación */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-2 text-left border border-[#2d5a3d] min-w-[90px]">
                        Aplicación
                      </th>
                      {consumoData.items.map(item => (
                        <th key={`a-${item.id}`} className="bg-[#1b3a26] text-accent text-[11px] font-bold px-2 py-2 text-center border border-[#2d5a3d] whitespace-nowrap min-w-[90px]">
                          {item.aplicacion || '—'}
                        </th>
                      ))}
                    </tr>
                    {/* ITEM */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-1.5 text-left border border-[#2d5a3d]">
                        ITEM
                      </th>
                      {consumoData.items.map(item => (
                        <td key={`i-${item.id}`} className="bg-[#223d2e] text-center text-[11px] font-bold text-white px-2 py-1.5 border border-[#2d5a3d]">
                          {item.item_code || '—'}
                        </td>
                      ))}
                    </tr>
                    {/* Código */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-1.5 text-left border border-[#2d5a3d]">
                        Código
                      </th>
                      {consumoData.items.map(item => (
                        <td key={`c-${item.id}`} className="bg-[#1a2e22] text-center font-mono text-[9px] text-gray-300 px-2 py-1.5 border border-[#2d5a3d] whitespace-nowrap">
                          {item.codigo}
                        </td>
                      ))}
                    </tr>
                    {/* Medida */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-1.5 text-left border border-[#2d5a3d]">
                        Medida
                      </th>
                      {consumoData.items.map(item => (
                        <td key={`m-${item.id}`} className="bg-[#223d2e] text-center text-[10px] text-gray-200 px-2 py-1.5 border border-[#2d5a3d]">
                          {item.medida || '—'}
                        </td>
                      ))}
                    </tr>
                    {/* m² por caja */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-1.5 text-left border border-[#2d5a3d]">
                        m² por caja
                      </th>
                      {consumoData.items.map(item => (
                        <td key={`m2-${item.id}`} className="bg-[#1a2e22] text-center text-[11px] font-bold text-accent px-2 py-1.5 border border-[#2d5a3d]">
                          {item.m2_por_caja || '—'}
                        </td>
                      ))}
                    </tr>
                    {/* Espacio de uso */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-1.5 text-left border border-[#2d5a3d]">
                        Espacio de uso
                      </th>
                      {consumoData.items.map(item => (
                        <td key={`e-${item.id}`} className="bg-[#223d2e] text-center text-[9px] text-gray-300 px-2 py-1.5 border border-[#2d5a3d] whitespace-nowrap uppercase font-medium">
                          {item.espacio_de_uso || '—'}
                        </td>
                      ))}
                    </tr>
                    {/* Departamento / M2 unit row */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-accent text-white text-[11px] font-bold px-3 py-2 text-left border border-accent/60">
                        Departamento
                      </th>
                      {consumoData.items.map(item => (
                        <th key={`u-${item.id}`} className="bg-accent text-white text-[11px] font-bold px-2 py-2 text-center border border-accent/60">
                          M2
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {groupByFloor(consumoData.departamentos).map((group) => {
                      const isRotura = group.piso === 'rotura'
                      const fc = isRotura
                        ? { bg: 'bg-amber-900/10', border: 'border-amber-700/30', text: 'text-amber-400', badge: 'bg-amber-800', stickyBg: 'bg-amber-950/90' }
                        : FLOOR_COLORS[group.colorIdx]

                      return (
                        <Fragment key={group.piso}>
                          {/* Floor separator banner */}
                          <tr>
                            <td
                              colSpan={consumoData.items.length + 1}
                              className={`${fc.badge} text-white text-[11px] font-bold px-3 py-2 text-left border border-border/30`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/20 text-[10px] font-black">
                                  {isRotura ? '⚠' : group.piso}
                                </span>
                                <span>{group.label}</span>
                                {!isRotura && (
                                  <span className="text-white/60 text-[10px] font-normal ml-1">
                                    ({group.deptos.length} departamentos)
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Floor data rows */}
                          {group.deptos.map((dept, dIdx) => (
                            <tr key={dept} className={`${dIdx % 2 === 0 ? fc.bg : 'bg-card'} hover:brightness-125 transition-all`}>
                              <td className={`sticky left-0 z-10 px-3 py-[5px] text-left text-[11px] font-bold border border-border/20 ${dIdx % 2 === 0 ? fc.stickyBg : 'bg-card'} ${isRotura ? 'italic text-amber-400' : 'text-foreground'}`}>
                                {dept}
                              </td>
                              {consumoData.items.map(item => (
                                <td key={`${dept}-${item.id}`} className="px-0.5 py-0.5 border border-border/20">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={localValues[dept]?.[item.id] ?? ''}
                                    onChange={(e) => handleCellChange(dept, item.id, e.target.value)}
                                    className="w-full px-1.5 py-[3px] bg-transparent text-center text-[11px] font-mono tabular-nums text-foreground focus:outline-none focus:bg-accent/10 focus:ring-1 focus:ring-accent rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="-"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}

                          {/* Floor subtotal */}
                          {group.deptos.length > 1 && (
                            <tr className={`${fc.bg} border-t-2 ${fc.border}`}>
                              <td className={`sticky left-0 z-10 px-3 py-[6px] text-left text-[11px] font-extrabold border border-border/30 ${fc.stickyBg} ${fc.text}`}>
                                Subtotal {group.label}
                              </td>
                              {consumoData.items.map(item => {
                                const t = getFloorTotal(consumoData, group.deptos, item.id)
                                return (
                                  <td key={`sub-${group.piso}-${item.id}`}
                                    className={`px-2 py-[6px] text-center text-[11px] font-extrabold border border-border/30 font-mono tabular-nums ${fc.text}`}
                                  >
                                    {t.toFixed(2)}
                                  </td>
                                )
                              })}
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}

                    {/* Grand total */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-[#1b3a26] text-white px-3 py-2.5 text-left text-[12px] font-black border border-[#2d5a3d] tracking-wide">
                        TOTAL GENERAL
                      </td>
                      {consumoData.items.map(item => (
                        <td key={`tot-${item.id}`}
                          className="bg-[#1b3a26] text-accent px-2 py-2.5 text-center text-[12px] font-black border border-[#2d5a3d] font-mono tabular-nums"
                        >
                          {getItemTotal(consumoData, item.id).toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

