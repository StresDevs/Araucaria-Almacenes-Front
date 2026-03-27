'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Plus, ScanLine, Loader2, CheckCircle2, AlertCircle, ZoomIn } from 'lucide-react'

// ─── OCR Engine ───────────────────────────────────────────────────────────────
// Strategy 1: Chrome's native TextDetector (Shape Detection API)
//   — built into Chrome/Android, uses Google Lens engine, zero cost, very accurate
// Strategy 2: Tesseract.js with canvas preprocessing as fallback

declare global {
  interface Window {
    TextDetector?: new () => { detect: (img: HTMLCanvasElement) => Promise<{ rawValue: string }[]> }
  }
}

function hasNativeTextDetector(): boolean {
  return typeof window !== 'undefined' && 'TextDetector' in window
}

async function ocrWithTextDetector(canvas: HTMLCanvasElement): Promise<string> {
  const detector = new window.TextDetector!()
  const results = await detector.detect(canvas)
  return results.map((r) => r.rawValue).join('\n')
}

// Tesseract CDN loader
let tesseractReady = false
async function loadTesseract(): Promise<void> {
  if (tesseractReady) return
  await new Promise<void>((resolve, reject) => {
    if (document.getElementById('tsjs')) { tesseractReady = true; resolve(); return }
    const s = document.createElement('script')
    s.id = 'tsjs'
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
    s.onload = () => { tesseractReady = true; resolve() }
    s.onerror = () => reject(new Error('Tesseract load failed'))
    document.head.appendChild(s)
  })
}

// Preprocess canvas: grayscale + contrast + threshold → cleaner text for OCR
function preprocessCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const dst = document.createElement('canvas')
  dst.width = src.width * 2
  dst.height = src.height * 2
  const ctx = dst.getContext('2d')!
  // Scale up 2× for better OCR resolution
  ctx.drawImage(src, 0, 0, dst.width, dst.height)
  const img = ctx.getImageData(0, 0, dst.width, dst.height)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    // Grayscale (luminance)
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    // Contrast stretch + threshold
    const enhanced = gray > 128 ? Math.min(255, gray * 1.4) : Math.max(0, gray * 0.6)
    d[i] = d[i + 1] = d[i + 2] = enhanced
  }
  ctx.putImageData(img, 0, 0)
  return dst
}

type TesseractWindow = typeof window & {
  Tesseract: {
    recognize: (
      img: HTMLCanvasElement,
      lang: string,
      opts: { logger?: (m: unknown) => void }
    ) => Promise<{ data: { text: string } }>
  }
}

async function ocrWithTesseract(canvas: HTMLCanvasElement): Promise<string> {
  await loadTesseract()
  const T = (window as TesseractWindow).Tesseract
  const processed = preprocessCanvas(canvas)
  const { data } = await T.recognize(processed, 'eng', {
    logger: () => {},
  })
  return data.text
}

async function runOCR(canvas: HTMLCanvasElement): Promise<string> {
  if (hasNativeTextDetector()) {
    const text = await ocrWithTextDetector(canvas)
    if (text.trim()) return text
    // If native returned empty, fall through to Tesseract
  }
  return ocrWithTesseract(canvas)
}

// ─── Parse OCR output into form fields ────────────────────────────────────────
function parseOCRText(raw: string, setForm: React.Dispatch<React.SetStateAction<AddItemForm>>) {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const updates: Partial<AddItemForm> = {}

  for (const line of lines) {
    // SKU/Code: starts with letters then alphanumeric chars, short
    if (!updates.codigo && /^[A-Z]{1,4}[-_]?[A-Z0-9\-()\s]{2,30}$/i.test(line) && line.length < 40) {
      updates.codigo = line
    }
    // Unit of measure
    if (!updates.und && /^(pza|pzas|caja|cajas|m2|ml|kg|lt|rollo|u|un|unid)$/i.test(line)) {
      updates.und = line.toLowerCase()
    }
    // Stock number: 1-4 digit standalone
    if (!updates.stockTotal && /^\d{1,4}$/.test(line)) {
      updates.stockTotal = line
    }
    // Rendimiento: number with unit suffix
    if (!updates.rendimiento && /^\d+([.,]\d+)?\s*(m2|ml|kg|pzas)$/i.test(line)) {
      updates.rendimiento = line
    }
    // Description: medium-length text, not a code pattern
    if (
      !updates.descripcion &&
      line.length > 6 && line.length < 100 &&
      !/^[A-Z]{2,4}[-_][A-Z0-9]/.test(line)
    ) {
      updates.descripcion = line
    }
    // Category hints
    if (/casco|chaleco|guante|bota|epp|seguridad/i.test(line)) updates.categoria = 'Seguridad'
    if (/herramienta|taladro|sierra|andamio|equipo/i.test(line)) updates.categoria = 'Equipo y Herramientas'
  }

  if (Object.keys(updates).length > 0) {
    setForm((prev) => ({ ...prev, ...updates }))
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Categoria = 'Construcción' | 'Seguridad' | 'Equipo y Herramientas'

interface AddItemForm {
  codigo: string
  descripcion: string
  und: string
  rendimiento: string
  categoria: Categoria
  stockTotal: string
}

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: AddItemForm) => void
  inventoryType: 'nueva' | 'antigua'
}

const EMPTY_FORM: AddItemForm = {
  codigo: '',
  descripcion: '',
  und: '',
  rendimiento: '',
  categoria: 'Construcción',
  stockTotal: '',
}

// ─── Image helper ─────────────────────────────────────────────────────────────
export function getItemImage(descripcion: string, codigo: string): string {
  const d = (descripcion + ' ' + codigo).toLowerCase()
  if (d.includes('porcelanato') || d.includes('mosaico') || d.includes('cristal')) return '/items/porcelanato.jpg'
  if (d.includes('puerta') || d.includes('door') || d.includes('flush')) return '/items/puerta.jpg'
  if (d.includes('piso') || d.includes('laminado') || d.includes('laminate') || d.includes('underlayment')) return '/items/piso-laminado.jpg'
  if (d.includes('extractor') || d.includes('encimera') || d.includes('horno') || d.includes('microonda')) return '/items/electrodomestico.jpg'
  return '/items/material-general.jpg'
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AddItemModal({ isOpen, onClose, onAdd, inventoryType }: AddItemModalProps) {
  const [form, setForm] = useState<AddItemForm>(EMPTY_FORM)
  const [scanning, setScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [scanMessage, setScanMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
  }, [])

  const startCamera = useCallback(async () => {
    setScanStatus('idle')
    setScanMessage('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      setScanning(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      setScanStatus('error')
      setScanMessage('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
    }
  }, [])

  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    setScanStatus('processing')
    setScanMessage(
      hasNativeTextDetector()
        ? 'Reconociendo texto...'
        : 'Cargando motor OCR...'
    )

    try {
      const text = await runOCR(canvas)
      if (!text.trim()) {
        setScanStatus('error')
        setScanMessage('No se detectó texto. Acerca la etiqueta y asegúrate de tener buena iluminación.')
        return
      }
      parseOCRText(text, setForm)
      stopCamera()
      setScanStatus('success')
      setScanMessage('Campos completados automáticamente. Revisa y ajusta si es necesario.')
    } catch (err) {
      setScanStatus('error')
      setScanMessage('Error al procesar la imagen. Intenta de nuevo.')
    }
  }, [stopCamera])

  const handleClose = () => {
    stopCamera()
    setForm(EMPTY_FORM)
    setScanStatus('idle')
    setScanMessage('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.codigo || !form.descripcion) return
    onAdd(form)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Agregar Ítem</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inventario {inventoryType === 'nueva' ? 'Importación Nueva' : 'Importación Antigua'}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-border transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Camera OCR — mobile only */}
        {isMobile && (
          <div className="px-5 pt-4 shrink-0 space-y-2">
            {!scanning ? (
              <button
                type="button"
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border-2 border-dashed border-accent/50 rounded-xl text-accent font-medium text-sm hover:border-accent hover:bg-accent/5 transition-all"
              >
                <ScanLine className="w-4 h-4" />
                Auto-llenar escaneando etiqueta
              </button>
            ) : (
              <div className="rounded-xl overflow-hidden border border-border bg-black relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video object-cover"
                />
                {/* Scan guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[80%] h-[55%] border-2 border-accent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                </div>
                <div className="absolute top-2 left-0 right-0 flex justify-center">
                  <p className="text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                    Encuadra la etiqueta dentro del recuadro
                  </p>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={captureAndRecognize}
                    disabled={scanStatus === 'processing'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent text-background rounded-full font-semibold text-sm shadow-lg disabled:opacity-60 transition-opacity"
                  >
                    {scanStatus === 'processing'
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                      : <><ZoomIn className="w-4 h-4" /> Capturar</>
                    }
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-background/80 backdrop-blur text-foreground rounded-full text-sm shadow"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {scanStatus === 'success' && (
              <div className="flex items-start gap-2 text-green-400 text-xs font-medium bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{scanMessage}</span>
              </div>
            )}
            {scanStatus === 'error' && (
              <div className="flex items-start gap-2 text-red-400 text-xs font-medium bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{scanMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Código *</label>
              <input
                value={form.codigo}
                onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                placeholder="Ej. YPJ086S-A"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descripción *</label>
              <input
                value={form.descripcion}
                onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Ej. porcelanato 60x60"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Unidad</label>
              <input
                value={form.und}
                onChange={(e) => setForm((p) => ({ ...p, und: e.target.value }))}
                placeholder="pza, caja, m2..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Stock Total</label>
              <input
                type="number"
                min="0"
                value={form.stockTotal}
                onChange={(e) => setForm((p) => ({ ...p, stockTotal: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Rendimiento</label>
              <input
                value={form.rendimiento}
                onChange={(e) => setForm((p) => ({ ...p, rendimiento: e.target.value }))}
                placeholder="Ej. 1.44 m2"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value as Categoria }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="Construcción">Construcción</option>
                <option value="Seguridad">Seguridad</option>
                <option value="Equipo y Herramientas">Equipo y Herramientas</option>
              </select>
            </div>
          </div>

          {/* Live image preview */}
          {(form.codigo || form.descripcion) && (
            <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
              <img
                src={getItemImage(form.descripcion, form.codigo)}
                alt="preview del ítem"
                className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-mono text-muted-foreground truncate">{form.codigo || '—'}</p>
                <p className="text-sm font-medium text-foreground truncate">{form.descripcion || '—'}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!form.codigo || !form.descripcion}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-background rounded-xl font-semibold text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar al Inventario
          </button>
        </form>
      </div>
    </div>
  )
}
