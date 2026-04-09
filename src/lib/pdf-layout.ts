/**
 * Shared PDF header & footer layout for all generated PDFs.
 *
 * Header: Araucaria logo | INFORME TÉCNICO | Date + "Reporte"
 * Footer: Company info line (address, phone, website)
 *
 * Two modes:
 *   - jspdf:  draws directly onto a jsPDF document
 *   - html:   returns CSS + HTML strings for print-based PDFs
 */

import type jsPDF from 'jspdf'

// ── Constants ──────────────────────────────────────────────────────────────────

const COMPANY = 'CONSTRUCTORA COMERCIAL ARAUCARIA S.R.L.'
const FOOTER_LINE =
  'CONSTRUCTORA COMERCIAL ARAUCARIA S.R.L.   ·   Dirección: Parque Fidel Anze Norte entre Av. Gral José Manuel Pando y Av. Melchor Urquidi   ·   Telf.: (591 4) 4 22 10 53   ·   www.constructora-araucaria.com'

const GREEN = { r: 74, g: 124, b: 89 }   // #4a7c59
const DARK = { r: 45, g: 90, b: 61 }     // #2d5a3d

// ── jsPDF helpers ──────────────────────────────────────────────────────────────

/**
 * Load an image from a URL and return it as a base64 data-URL.
 */
export function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Format an ISO date string to "dd/mm/yyyy".
 */
export function formatDatePDF(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export interface PDFHeaderResult {
  /** Y position after the header (where content should start) */
  contentStartY: number
}

/**
 * Draw the standard header on a jsPDF page.
 *
 * Layout (table-like):
 *   ┌────────────────┬──────────────────────┬─────────────┐
 *   │  Araucaria logo│   INFORME TÉCNICO    │   Etrusco   │
 *   ├────────────────┼──────────────────────┼─────────────┤
 *   │  Fecha:XX/XX   │  CONSTRUCTORA…S.R.L. │  Reporte    │
 *   └────────────────┴──────────────────────┴─────────────┘
 */
export async function drawPDFHeader(
  doc: jsPDF,
  options?: { title?: string; date?: string },
): Promise<PDFHeaderResult> {
  const pageW = doc.internal.pageSize.getWidth()
  const ml = 15
  const mr = 15
  const tableW = pageW - ml - mr

  const col1W = tableW * 0.25
  const col2W = tableW * 0.50
  const col3W = tableW * 0.25

  const rowH = 22
  const startY = 12

  // ── Row 1 ──
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.4)

  // Cell borders row 1
  doc.rect(ml, startY, col1W, rowH)
  doc.rect(ml + col1W, startY, col2W, rowH)
  doc.rect(ml + col1W + col2W, startY, col3W, rowH)

  // Logo in col 1
  try {
    const logoBase64 = await loadImageAsBase64('/araucaria-logo.png')
    const logoH = 16
    const logoW = logoH * 2.5
    const logoX = ml + (col1W - logoW) / 2
    const logoY = startY + (rowH - logoH) / 2
    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoW, logoH)
  } catch {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(GREEN.r, GREEN.g, GREEN.b)
    doc.text('ARAUCARIA', ml + col1W / 2, startY + rowH / 2 + 1, { align: 'center' })
  }

  // "INFORME TÉCNICO" in col 2
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text(options?.title || 'INFORME TÉCNICO', ml + col1W + col2W / 2, startY + rowH / 2 + 2, {
    align: 'center',
  })

  // Col 3 – blank for now (could hold secondary logo)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text('Reporte', ml + col1W + col2W + col3W / 2, startY + rowH / 2 + 2, { align: 'center' })

  // ── Row 2 ──
  const row2Y = startY + rowH
  const row2H = 12

  doc.rect(ml, row2Y, col1W, row2H)
  doc.rect(ml + col1W, row2Y, col2W, row2H)
  doc.rect(ml + col1W + col2W, row2Y, col3W, row2H)

  // Date in col 1
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  const dateStr = `Fecha: ${options?.date || formatDatePDF()}`
  doc.text(dateStr, ml + col1W / 2, row2Y + row2H / 2 + 1, { align: 'center' })

  // Company name in col 2
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(COMPANY, ml + col1W + col2W / 2, row2Y + row2H / 2 + 1, { align: 'center' })

  // "Reporte" label in col 3
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Reporte', ml + col1W + col2W + col3W / 2, row2Y + row2H / 2 + 1, { align: 'center' })

  return { contentStartY: row2Y + row2H + 8 }
}

/**
 * Draw the standard footer on a jsPDF page.
 */
export function drawPDFFooter(doc: jsPDF): void {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const ml = 15
  const mr = 15
  const footerY = pageH - 14

  // Separator line
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(ml, footerY, pageW - mr, footerY)

  // Footer text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(130, 130, 130)
  doc.text(FOOTER_LINE, pageW / 2, footerY + 4, { align: 'center' })

  // Page number
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  const currentPage = doc.getCurrentPageInfo().pageNumber
  doc.setFontSize(6)
  doc.text(`Página ${currentPage} de ${totalPages}`, pageW - mr, footerY + 4, { align: 'right' })
}

/**
 * Draw header + footer on every page of the document.
 * Call this AFTER all content has been added.
 */
export function applyPDFFooterToAllPages(doc: jsPDF): void {
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawPDFFooter(doc)
  }
}

// ── HTML-based PDF helpers (for window.print() approach) ───────────────────────

/**
 * Returns the CSS needed for the standard header & footer in print PDFs.
 */
export function getHTMLPDFStyles(): string {
  return `
    .araucaria-header { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .araucaria-header td { border: 1px solid #b4b4b4; padding: 6px 10px; vertical-align: middle; }
    .araucaria-header .logo-cell { width: 25%; text-align: center; }
    .araucaria-header .logo-cell img { max-height: 50px; width: auto; }
    .araucaria-header .title-cell { width: 50%; text-align: center; font-size: 16px; font-weight: 700; color: #333; }
    .araucaria-header .badge-cell { width: 25%; text-align: center; font-size: 10px; color: #888; }
    .araucaria-header .date-cell { font-size: 9px; color: #444; text-align: center; }
    .araucaria-header .company-cell { font-size: 9px; font-weight: 700; color: #333; text-align: center; }
    .araucaria-header .report-cell { font-size: 9px; color: #666; text-align: center; }

    .araucaria-footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 6px 12mm; border-top: 1px solid #b4b4b4; font-size: 6.5px; color: #999; text-align: center; font-family: 'Segoe UI', Arial, sans-serif; background: #fff; }

    @media print {
      body { margin: 0; padding: 0; }
      .araucaria-footer { position: fixed; bottom: 0; }
      body { padding-bottom: 30px; }
    }
  `
}

/**
 * Returns the HTML for the standard header table.
 */
export function getHTMLPDFHeader(options?: { title?: string; date?: string }): string {
  const dateStr = options?.date || formatDatePDF()
  const title = options?.title || 'INFORME TÉCNICO'

  return `<table class="araucaria-header">
  <tr>
    <td class="logo-cell" rowspan="1"><img src="/araucaria-logo.png" class="header-logo" alt="Araucaria" crossorigin="anonymous" /></td>
    <td class="title-cell"><strong>${title}</strong></td>
    <td class="badge-cell">Reporte</td>
  </tr>
  <tr>
    <td class="date-cell">Fecha: ${dateStr}</td>
    <td class="company-cell">${COMPANY}</td>
    <td class="report-cell">Reporte</td>
  </tr>
</table>`
}

/**
 * Returns the HTML for the standard footer.
 */
export function getHTMLPDFFooter(): string {
  return `<div class="araucaria-footer">${FOOTER_LINE}</div>`
}
