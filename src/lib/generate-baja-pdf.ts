import jsPDF from 'jspdf'
import type { SolicitudBaja, MotivoBaja } from '@/types'

const MOTIVO_LABELS: Record<MotivoBaja, string> = {
  daño: 'Daño',
  vencimiento: 'Vencimiento',
  robo: 'Robo',
  perdida: 'Pérdida',
  obsoleto: 'Obsoleto',
  defecto_fabrica: 'Defecto de Fábrica',
  otro: 'Otro',
}

/**
 * Load an image from a URL and return it as a base64 data URL.
 */
function loadImageAsBase64(url: string): Promise<string> {
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

function formatDateTimePDF(iso: string): { fecha: string; hora: string } {
  const d = new Date(iso)
  const fecha = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
  return { fecha, hora }
}

/**
 * Draw a horizontal line across the page.
 */
function drawLine(doc: jsPDF, y: number, marginLeft: number, marginRight: number) {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(marginLeft, y, pageW - marginRight, y)
}

/**
 * Draw a labeled row with label on the left and value on the right.
 */
function drawRow(doc: jsPDF, label: string, value: string, y: number, ml: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(label, ml, y)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  doc.text(value, ml + 55, y)

  return y + 7
}

/**
 * Generate and download a PDF for a baja request.
 */
export async function generateBajaPDF(
  baja: SolicitudBaja,
  solicitanteNombre: string,
  evidenciaPreviewUrl?: string | null,
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageW = doc.internal.pageSize.getWidth() // 210
  const pageH = doc.internal.pageSize.getHeight() // 297
  const ml = 20 // margin left
  const mr = 20 // margin right
  const contentW = pageW - ml - mr

  let y = 15

  // ── Logo ──
  try {
    const logoBase64 = await loadImageAsBase64('/araucaria-logo.png')
    const logoW = 55
    const logoH = 22
    doc.addImage(logoBase64, 'PNG', (pageW - logoW) / 2, y, logoW, logoH)
    y += logoH + 8
  } catch {
    // If logo fails to load, skip it
    y += 5
  }

  // ── Title ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(50, 50, 50)
  doc.text('SOLICITUD DE BAJA DE MATERIAL', pageW / 2, y, { align: 'center' })
  y += 8

  // ── Subtitle ──
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(130, 130, 130)
  doc.text('Araucaria Construcciones — Control de Almacenes', pageW / 2, y, { align: 'center' })
  y += 10

  drawLine(doc, y, ml, mr)
  y += 8

  // ── Date & Time ──
  const { fecha, hora } = formatDateTimePDF(baja.fecha_solicitud)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text('Fecha:', ml, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  doc.text(fecha, ml + 55, y)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(80, 80, 80)
  doc.text('Hora:', pageW / 2 + 5, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  doc.text(hora, pageW / 2 + 25, y)
  y += 7

  y = drawRow(doc, 'Solicitante:', solicitanteNombre, y, ml)
  y += 3

  drawLine(doc, y, ml, mr)
  y += 8

  // ── Section: Material Details ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(70, 130, 60) // green accent
  doc.text('INFORMACIÓN DEL MATERIAL', ml, y)
  y += 8

  y = drawRow(doc, 'Código:', baja.item_codigo, y, ml)
  y = drawRow(doc, 'Descripción:', baja.item_descripcion, y, ml)
  y = drawRow(doc, 'Categoría:', baja.item_categoria, y, ml)
  y = drawRow(doc, 'Cantidad a dar de baja:', String(baja.cantidad), y, ml)
  y += 3

  drawLine(doc, y, ml, mr)
  y += 8

  // ── Section: Motivo de Baja ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(70, 130, 60)
  doc.text('MOTIVO DE BAJA', ml, y)
  y += 8

  y = drawRow(doc, 'Motivo:', MOTIVO_LABELS[baja.motivo] || baja.motivo, y, ml)

  // Description - wrapping text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text('Descripción:', ml, y)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  const descLines = doc.splitTextToSize(baja.descripcion_motivo, contentW - 55)
  doc.text(descLines, ml + 55, y)
  y += descLines.length * 5 + 5
  y += 3

  drawLine(doc, y, ml, mr)
  y += 8

  // ── Section: Evidence Image ──
  if (evidenciaPreviewUrl) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(70, 130, 60)
    doc.text('EVIDENCIA FOTOGRÁFICA', ml, y)
    y += 8

    try {
      const imgBase64 = await loadImageAsBase64(evidenciaPreviewUrl)
      const imgMaxW = contentW * 0.6
      const imgMaxH = 60

      // Load the image to get its dimensions
      const tmpImg = new window.Image()
      tmpImg.src = imgBase64
      await new Promise<void>((resolve) => {
        tmpImg.onload = () => resolve()
      })

      let imgW = tmpImg.naturalWidth
      let imgH = tmpImg.naturalHeight
      const ratio = Math.min(imgMaxW / imgW, imgMaxH / imgH)
      imgW = imgW * ratio
      imgH = imgH * ratio

      // Check if we need a new page
      if (y + imgH + 10 > pageH - 60) {
        doc.addPage()
        y = 20
      }

      // Border around image
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.rect(ml, y, imgW + 4, imgH + 4)
      doc.addImage(imgBase64, 'PNG', ml + 2, y + 2, imgW, imgH)
      y += imgH + 10

      if (baja.evidencia_nombre) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(130, 130, 130)
        doc.text(baja.evidencia_nombre, ml, y)
        y += 6
      }
    } catch {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text('(No se pudo cargar la imagen de evidencia)', ml, y)
      y += 8
    }

    y += 3
    drawLine(doc, y, ml, mr)
    y += 8
  }

  // ── Signature & Seal Section ──
  // Check if we have enough room; if not, go to a new page
  if (y + 60 > pageH - 20) {
    doc.addPage()
    y = 40
  } else {
    // Push signature area towards the bottom of the page
    y = Math.max(y + 15, pageH - 80)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(70, 130, 60)
  doc.text('FIRMA Y SELLO', ml, y)
  y += 15

  // Two columns: Firma del Solicitante | Sello
  const colW = (contentW - 20) / 2

  // Left column — Firma
  const firmaLineY = y + 25
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.4)
  doc.line(ml, firmaLineY, ml + colW, firmaLineY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text('Firma del Solicitante', ml + colW / 2, firmaLineY + 5, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(130, 130, 130)
  doc.text(solicitanteNombre, ml + colW / 2, firmaLineY + 10, { align: 'center' })

  // Right column — Sello
  const selStartX = ml + colW + 20
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([2, 2], 0)
  doc.rect(selStartX, y - 5, colW, 40)
  doc.setLineDashPattern([], 0) // reset dash
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(160, 160, 160)
  doc.text('Sello', selStartX + colW / 2, y + 15, { align: 'center' })

  // ── Footer ──
  const footerY = pageH - 10
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(170, 170, 170)
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-PE')} — Araucaria Construcciones S.A.C.`,
    pageW / 2,
    footerY,
    { align: 'center' },
  )

  // ── Save ──
  const filename = `Baja_${baja.item_codigo}_${fecha.replace(/\s/g, '-')}.pdf`
  doc.save(filename)
}
