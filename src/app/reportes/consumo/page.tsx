'use client'

import { useState, useMemo, Fragment } from 'react'
import { AppShell } from '@/components/app-shell'
import {
  Search, Calendar, ChevronDown, FileSpreadsheet, FileText,
  BarChart3, Package, Building2, Layers,
} from 'lucide-react'

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
  material_tipo: string
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

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const ITEMS_PORCELANATO: ItemConsumo[] = [
  { id: 'porc-01', aplicacion: 'MUROS', item_code: '6130', codigo: 'YKL6000-B', medida: '60X30', m2_por_caja: 1.44, espacio_de_uso: 'COCINA - LAVANDERÍA' },
  { id: 'porc-02', aplicacion: 'PISO', item_code: '6102', codigo: 'YPJ086S (Y96)', medida: '60X60', m2_por_caja: 1.44, espacio_de_uso: 'COCINA - LAVANDERÍA' },
  { id: 'porc-03', aplicacion: 'MUROS', item_code: '6125', codigo: 'YC6A112B', medida: '30X60', m2_por_caja: 1.44, espacio_de_uso: 'BAÑO COMPARTIDO' },
  { id: 'porc-04', aplicacion: 'PISO', item_code: '6064', codigo: 'YDY061 60X60', medida: '60X60', m2_por_caja: 1.44, espacio_de_uso: 'BAÑO VISITAS' },
  { id: 'porc-05', aplicacion: 'MURO', item_code: '6042', codigo: 'YMCN1006 (06040)', medida: '30X30', m2_por_caja: 1.98, espacio_de_uso: 'BAÑO COMPARTIDO' },
  { id: 'porc-06', aplicacion: 'PISO', item_code: '6110', codigo: 'K0633525TA', medida: '60x60', m2_por_caja: 1.44, espacio_de_uso: 'BAÑO PRINCIPAL' },
  { id: 'porc-07', aplicacion: 'MURO', item_code: '6111', codigo: 'K0633525TA', medida: '30x60', m2_por_caja: 1.44, espacio_de_uso: 'BAÑO PRINCIPAL' },
  { id: 'porc-08', aplicacion: 'MURO', item_code: '6112', codigo: 'IVORY MOSAIC K3525TNM0', medida: '30X30', m2_por_caja: 0.99, espacio_de_uso: 'BAÑO PRINCIPAL' },
  { id: 'porc-09', aplicacion: 'MURO', item_code: '6109', codigo: 'K3516TNMO (06109) ash avory', medida: '30x30', m2_por_caja: 0.99, espacio_de_uso: 'BAÑO COMPARTIDO' },
  { id: 'porc-10', aplicacion: 'PISO', item_code: '6110b', codigo: 'K0633525TA', medida: '60x60', m2_por_caja: 1.44, espacio_de_uso: 'BAÑO VISITAS' },
]

const DEPARTAMENTOS_ETRUSCO = [
  'rotura', '1A', '1B', '1C', '1D', '1E', '1F', '1G', '1H', '1J', '1K', '1M', '1N',
  '2A', '2B', '2C', '2D', '2E', '2F', '2G', '2H', '2J', '2K', '2M', '2N',
  '3A', '3B', '3C',
]

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateConsumoValues(): Record<string, Record<string, number | null>> {
  const consumo: Record<string, Record<string, number | null>> = {}
  let seed = 42
  DEPARTAMENTOS_ETRUSCO.forEach(dept => {
    consumo[dept] = {}
    ITEMS_PORCELANATO.forEach(item => {
      seed++
      const r = seededRandom(seed)
      if (dept === 'rotura') {
        consumo[dept][item.id] = r > 0.6 ? parseFloat((r * 4).toFixed(2)) : null
      } else {
        consumo[dept][item.id] = r > 0.2 ? parseFloat((5 + r * 30).toFixed(2)) : null
      }
    })
  })
  return consumo
}

const ITEMS_LAMINADO: ItemConsumo[] = [
  { id: 'lam-01', aplicacion: 'PISO', item_code: '7001', codigo: 'YLM2869', medida: '1212x198', m2_por_caja: 2.40, espacio_de_uso: 'DORMITORIO PRINCIPAL' },
  { id: 'lam-02', aplicacion: 'PISO', item_code: '7002', codigo: 'YLM2870', medida: '1212x198', m2_por_caja: 2.40, espacio_de_uso: 'DORMITORIO SECUNDARIO' },
  { id: 'lam-03', aplicacion: 'PISO', item_code: '7003', codigo: 'YLM2871', medida: '1212x198', m2_por_caja: 2.40, espacio_de_uso: 'SALA - COMEDOR' },
]

const DEPARTAMENTOS_LOMAS = ['rotura', '1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '3A', '3B']

function generateConsumoLaminado(): Record<string, Record<string, number | null>> {
  const consumo: Record<string, Record<string, number | null>> = {}
  let seed = 100
  DEPARTAMENTOS_LOMAS.forEach(dept => {
    consumo[dept] = {}
    ITEMS_LAMINADO.forEach(item => {
      seed++
      const r = seededRandom(seed)
      if (dept === 'rotura') {
        consumo[dept][item.id] = r > 0.5 ? parseFloat((r * 3).toFixed(2)) : null
      } else {
        consumo[dept][item.id] = r > 0.15 ? parseFloat((8 + r * 25).toFixed(2)) : null
      }
    })
  })
  return consumo
}

const MOCK_CONSUMOS: ConsumoData[] = [
  {
    id: 'consumo-001',
    material_tipo: 'Porcelanato',
    obra_id: 'obra-001',
    obra_nombre: 'Edificio Etrusco',
    fecha_actualizacion: '2026-01-31',
    items: ITEMS_PORCELANATO,
    departamentos: DEPARTAMENTOS_ETRUSCO,
    consumo: generateConsumoValues(),
  },
  {
    id: 'consumo-002',
    material_tipo: 'Porcelanato',
    obra_id: 'obra-002',
    obra_nombre: 'Complejo Residencial Las Lomas',
    fecha_actualizacion: '2026-02-15',
    items: ITEMS_PORCELANATO.slice(0, 6),
    departamentos: ['rotura', '1A', '1B', '1C', '2A', '2B', '2C', '3A'],
    consumo: (() => {
      const c: Record<string, Record<string, number | null>> = {}
      let seed = 200
      const deptos = ['rotura', '1A', '1B', '1C', '2A', '2B', '2C', '3A']
      deptos.forEach(d => {
        c[d] = {}
        ITEMS_PORCELANATO.slice(0, 6).forEach(it => {
          seed++
          const r = seededRandom(seed)
          c[d][it.id] = r > 0.25 ? parseFloat((5 + r * 28).toFixed(2)) : null
        })
      })
      return c
    })(),
  },
  {
    id: 'consumo-003',
    material_tipo: 'Piso Laminado',
    obra_id: 'obra-002',
    obra_nombre: 'Complejo Residencial Las Lomas',
    fecha_actualizacion: '2026-02-20',
    items: ITEMS_LAMINADO,
    departamentos: DEPARTAMENTOS_LOMAS,
    consumo: generateConsumoLaminado(),
  },
]

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
  lines.push(`CONSUMO DE ${data.material_tipo.toUpperCase()}`)
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
  a.download = `Reporte_Consumo_${data.material_tipo}_${data.obra_nombre.replace(/\s+/g, '_')}_${data.fecha_actualizacion}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── PDF Export ────────────────────────────────────────────────────────────────

function exportToPDF(data: ConsumoData) {
  const today = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  const groups = groupByFloor(data.departamentos)

  const floorRowsHtml = groups.map((group, gIdx) => {
    const pdfColor = group.colorIdx >= 0 ? FLOOR_PDF_COLORS[group.colorIdx % FLOOR_PDF_COLORS.length] : { bg: '#fff8f0', border: '#d97706', text: '#92400e', badge: '#d97706', subtotalBg: '#fef3c7' }

    // Floor header row
    const floorHeader = `<tr>
      <td colspan="${data.items.length + 1}" style="background:${pdfColor.badge}; color:#fff; font-weight:700; font-size:9px; padding:5px 10px; letter-spacing:0.5px; border:1px solid ${pdfColor.border};">
        ${escapeHtml(group.label)} ${group.piso !== 'rotura' ? `(${group.deptos.length} departamentos)` : ''}
      </td>
    </tr>`

    // Data rows
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

    // Subtotal row
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
<title>Reporte Consumo ${escapeHtml(data.material_tipo)} - ${today}</title>
<style>
  @page { size: landscape; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9px; color: #1a1a1a; background: #fff; }

  .header { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 8px 0; border-bottom: 3px solid #4a7c59; margin-bottom: 6px; }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .header-logo { width: 110px; height: auto; }
  .header-title h1 { font-size: 15px; font-weight: 700; color: #2d5a3d; margin-bottom: 1px; }
  .header-title h2 { font-size: 11px; font-weight: 600; color: #4a7c59; }
  .header-right { text-align: right; font-size: 8.5px; color: #666; }
  .header-right p { margin-bottom: 1px; }

  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #c8d6c0; padding: 3px 5px; text-align: center; font-size: 8px; }
  th { background: #4a7c59; color: #fff; font-weight: 600; letter-spacing: 0.3px; }
  .meta-row th.label { background: #2d5a3d; text-align: left; width: 90px; font-size: 8px; }
  .meta-row td { font-weight: 500; font-size: 8px; background: #f5f9f5; }
  .total-row td { background: #2d5a3d; color: #fff; font-weight: 700; font-size: 8.5px; border-color: #2d5a3d; }

  .footer { margin-top: 10px; padding-top: 6px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 7.5px; color: #999; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head><body>

<div class="header">
  <div class="header-left">
    <img src="/araucaria-logo.png" class="header-logo" alt="Araucaria" crossorigin="anonymous" />
    <div class="header-title">
      <h1>Reporte Consumo ${escapeHtml(data.material_tipo)}</h1>
      <h2>${escapeHtml(data.obra_nombre)}</h2>
    </div>
  </div>
  <div class="header-right">
    <p><strong>Fecha del reporte:</strong> ${today}</p>
    <p><strong>Actualización datos:</strong> ${formatDateShort(data.fecha_actualizacion)}</p>
  </div>
</div>

<table>
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

<div class="footer">
  <span>ARAUCARIA CONSTRUCCIONES · Sistema de Gestión de Almacenes</span>
  <span>Reporte Consumo ${escapeHtml(data.material_tipo)} - ${today}</span>
</div>

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
  const [filterMaterial, setFilterMaterial] = useState('todos')
  const [filterObra, setFilterObra] = useState('todas')
  const [fromDate, setFromDate] = useState('2026-01-01')
  const [toDate, setToDate] = useState('2026-03-31')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const materialesTipos = useMemo(() => {
    const set = new Set(MOCK_CONSUMOS.map(c => c.material_tipo))
    return ['todos', ...Array.from(set)]
  }, [])

  const obrasDisponibles = useMemo(() => {
    const set = new Set(MOCK_CONSUMOS.map(c => c.obra_nombre))
    return ['todas', ...Array.from(set)]
  }, [])

  const filteredData = useMemo(() => {
    return MOCK_CONSUMOS.filter(c => {
      const matchMat = filterMaterial === 'todos' || c.material_tipo === filterMaterial
      const matchObra = filterObra === 'todas' || c.obra_nombre === filterObra
      const cDate = new Date(c.fecha_actualizacion)
      return matchMat && matchObra && new Date(fromDate) <= cDate && cDate <= new Date(toDate)
    })
  }, [filterMaterial, filterObra, fromDate, toDate])

  return (
    <AppShell>
      <div className="w-full max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reporte de Consumo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis de consumo de materiales de importación por departamento, obra y material
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-1">
            <Search className="w-4 h-4 text-accent" />
            Filtros
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-1.5 uppercase">Material</label>
              <div className="relative">
                <select
                  value={filterMaterial}
                  onChange={(e) => { setFilterMaterial(e.target.value); setSelectedId(null) }}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none pr-8"
                >
                  {materialesTipos.map(m => (
                    <option key={m} value={m}>{m === 'todos' ? 'Todos los materiales' : m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-1.5 uppercase">Obra</label>
              <div className="relative">
                <select
                  value={filterObra}
                  onChange={(e) => { setFilterObra(e.target.value); setSelectedId(null) }}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none pr-8"
                >
                  {obrasDisponibles.map(o => (
                    <option key={o} value={o}>{o === 'todas' ? 'Todas las obras' : o}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-1.5 uppercase">Desde</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-mono mb-1.5 uppercase">Hasta</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-accent" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Reportes</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{filteredData.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-3.5 h-3.5 text-accent" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Materiales</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-accent">{new Set(filteredData.map(d => d.material_tipo)).size}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Obras</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{new Set(filteredData.map(d => d.obra_nombre)).size}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <p className="text-xs text-muted-foreground font-mono uppercase">Total M²</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-accent">{filteredData.reduce((s, d) => s + getTotalM2(d), 0).toFixed(0)}</p>
          </div>
        </div>

        {/* Report Cards */}
        {filteredData.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No hay reportes de consumo para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredData.map(data => {
              const isSelected = selectedId === data.id
              const totalM2 = getTotalM2(data)
              const floorGroups = groupByFloor(data.departamentos)
              const floorCount = floorGroups.filter(g => g.piso !== 'rotura').length

              return (
                <div key={data.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Summary row */}
                  <button
                    onClick={() => setSelectedId(isSelected ? null : data.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-border/10 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{data.obra_nombre}</span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold border bg-accent/10 text-accent border-accent/30">
                          {data.material_tipo}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {data.items.length} items
                        <span className="mx-1.5">·</span>
                        {floorCount} pisos · {data.departamentos.filter(d => d !== 'rotura').length} deptos
                        <span className="mx-1.5">·</span>
                        {totalM2.toFixed(2)} M² total
                        <span className="mx-1.5">·</span>
                        Act: {formatDateLong(data.fecha_actualizacion)}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isSelected ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Detail Table */}
                  {isSelected && (
                    <div className="border-t border-border">
                      {/* Export bar */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-border/5 border-b border-border">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">{data.obra_nombre}</span>
                          <span className="mx-1.5">—</span>
                          Consumo de {data.material_tipo}
                          <span className="mx-1.5">—</span>
                          Actualización: {formatDateShort(data.fecha_actualizacion)}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => exportToExcel(data)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-700 text-white rounded-lg text-xs font-medium hover:bg-green-800 transition-colors">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Excel</span>
                          </button>
                          <button onClick={() => exportToPDF(data)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800 transition-colors">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                        </div>
                      </div>

                      {/* Spreadsheet-style table */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{ minWidth: `${90 + data.items.length * 95}px` }}>
                          {/* META HEADER — Aplicación / ITEM / Código / Medida / m2 / Espacio */}
                          <thead>
                            {/* Aplicación */}
                            <tr>
                              <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-2 text-left border border-[#2d5a3d] min-w-[90px]">
                                Aplicación
                              </th>
                              {data.items.map(item => (
                                <th key={`a-${item.id}`} className="bg-[#1b3a26] text-accent text-[11px] font-bold px-2 py-2 text-center border border-[#2d5a3d] whitespace-nowrap min-w-[90px]">
                                  {item.aplicacion}
                                </th>
                              ))}
                            </tr>
                            {/* ITEM */}
                            <tr>
                              <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-1.5 text-left border border-[#2d5a3d]">
                                ITEM
                              </th>
                              {data.items.map(item => (
                                <td key={`i-${item.id}`} className="bg-[#223d2e] text-center text-[11px] font-bold text-white px-2 py-1.5 border border-[#2d5a3d]">
                                  {item.item_code}
                                </td>
                              ))}
                            </tr>
                            {/* Código */}
                            <tr>
                              <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-1.5 text-left border border-[#2d5a3d]">
                                Código
                              </th>
                              {data.items.map(item => (
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
                              {data.items.map(item => (
                                <td key={`m-${item.id}`} className="bg-[#223d2e] text-center text-[10px] text-gray-200 px-2 py-1.5 border border-[#2d5a3d]">
                                  {item.medida}
                                </td>
                              ))}
                            </tr>
                            {/* m² por caja */}
                            <tr>
                              <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-1.5 text-left border border-[#2d5a3d]">
                                m² por caja
                              </th>
                              {data.items.map(item => (
                                <td key={`m2-${item.id}`} className="bg-[#1a2e22] text-center text-[11px] font-bold text-accent px-2 py-1.5 border border-[#2d5a3d]">
                                  {item.m2_por_caja}
                                </td>
                              ))}
                            </tr>
                            {/* Espacio de uso */}
                            <tr>
                              <th className="sticky left-0 z-20 bg-[#1b3a26] text-white text-[11px] font-bold px-3 py-1.5 text-left border border-[#2d5a3d]">
                                Espacio de uso
                              </th>
                              {data.items.map(item => (
                                <td key={`e-${item.id}`} className="bg-[#223d2e] text-center text-[9px] text-gray-300 px-2 py-1.5 border border-[#2d5a3d] whitespace-nowrap uppercase font-medium">
                                  {item.espacio_de_uso}
                                </td>
                              ))}
                            </tr>
                            {/* Departamento / M2 unit row */}
                            <tr>
                              <th className="sticky left-0 z-20 bg-accent text-white text-[11px] font-bold px-3 py-2 text-left border border-accent/60">
                                Departamento
                              </th>
                              {data.items.map(item => (
                                <th key={`u-${item.id}`} className="bg-accent text-white text-[11px] font-bold px-2 py-2 text-center border border-accent/60">
                                  M2
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {floorGroups.map((group) => {
                              const isRotura = group.piso === 'rotura'
                              const fc = isRotura
                                ? { bg: 'bg-amber-900/10', border: 'border-amber-700/30', text: 'text-amber-400', badge: 'bg-amber-800', stickyBg: 'bg-amber-950/90' }
                                : FLOOR_COLORS[group.colorIdx]

                              return (
                                <Fragment key={group.piso}>
                                  {/* Floor separator banner */}
                                  <tr>
                                    <td
                                      colSpan={data.items.length + 1}
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
                                      {data.items.map(item => {
                                        const val = data.consumo[dept]?.[item.id]
                                        const has = val != null
                                        return (
                                          <td key={`${dept}-${item.id}`}
                                            className={`px-2 py-[5px] text-center text-[11px] border border-border/20 font-mono tabular-nums ${has ? 'text-foreground' : 'text-muted-foreground/20'}`}
                                          >
                                            {has ? val.toFixed(2) : '-'}
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  ))}

                                  {/* Floor subtotal */}
                                  {group.deptos.length > 1 && (
                                    <tr className={`${fc.bg} border-t-2 ${fc.border}`}>
                                      <td className={`sticky left-0 z-10 px-3 py-[6px] text-left text-[11px] font-extrabold border border-border/30 ${fc.stickyBg} ${fc.text}`}>
                                        Subtotal {group.label}
                                      </td>
                                      {data.items.map(item => {
                                        const t = getFloorTotal(data, group.deptos, item.id)
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
                              {data.items.map(item => (
                                <td key={`tot-${item.id}`}
                                  className="bg-[#1b3a26] text-accent px-2 py-2.5 text-center text-[12px] font-black border border-[#2d5a3d] font-mono tabular-nums"
                                >
                                  {getItemTotal(data, item.id).toFixed(2)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

