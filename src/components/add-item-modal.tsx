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
  }

  if (Object.keys(updates).length > 0) {
    setForm((prev) => ({ ...prev, ...updates }))
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
import type { CategoriaItem, ProveedorItem, ItemOrigen, Almacen } from '@/types'
import type { CreateItemDto } from '@/services/endpoints/inventario.service'
import { inventarioService } from '@/services/endpoints/inventario.service'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (dto: CreateItemDto) => Promise<boolean>
  inventoryType: 'nueva' | 'antigua' | 'nacional'
  categorias?: CategoriaItem[]
  proveedores?: ProveedorItem[]
  almacenes?: Almacen[]
}

const TIPO_ORIGEN_MAP: Record<string, ItemOrigen> = {
  nueva: 'importacion_nueva',
  antigua: 'importacion_antigua',
  nacional: 'compra_nacional',
}

const TIPO_CAMBIO = 6.96

const UNIDADES_PREDEFINIDAS = [
  'pza', 'caja', 'm²', 'm', 'ml', 'kg', 'lt', 'rollo', 'bolsa',
  'unidad', 'placa', 'tubo', 'par', 'juego', 'galón', 'balde',
  'plancha', 'metro', 'global', 'set', 'sobre', 'saco', 'barra',
]

interface AddItemForm {
  codigo: string
  nombre: string
  descripcion: string
  und: string
  rendimiento: string
  categoriaId: string
  proveedorId: string
  precioUnitarioBob: string
  precioUnitarioUsd: string
  itemNumero: string
  almacenId: string
  stockInicial: string
}

const EMPTY_FORM: AddItemForm = {
  codigo: '',
  nombre: '',
  descripcion: '',
  und: '',
  rendimiento: '',
  categoriaId: '',
  proveedorId: '',
  precioUnitarioBob: '',
  precioUnitarioUsd: '',
  itemNumero: '',
  almacenId: '',
  stockInicial: '',
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
export function AddItemModal({ isOpen, onClose, onAdd, inventoryType, categorias = [], proveedores = [], almacenes = [] }: AddItemModalProps) {
  const [form, setForm] = useState<AddItemForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [scanMessage, setScanMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // ─── Ítem n° uniqueness validation ──────────────────────────────────────────
  const [itemNumeroStatus, setItemNumeroStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const itemNumeroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkItemNumeroUniqueness = useCallback((itemNumero: string) => {
    if (itemNumeroTimerRef.current) clearTimeout(itemNumeroTimerRef.current)
    if (!itemNumero.trim()) { setItemNumeroStatus('idle'); return }
    setItemNumeroStatus('checking')
    itemNumeroTimerRef.current = setTimeout(async () => {
      try {
        const res = await inventarioService.checkItemNumero(itemNumero.trim())
        setItemNumeroStatus(res.data.exists ? 'taken' : 'available')
      } catch {
        setItemNumeroStatus('idle')
      }
    }, 500)
  }, [])

  const handleItemNumeroChange = useCallback((value: string) => {
    setForm((p) => ({ ...p, itemNumero: value }))
    checkItemNumeroUniqueness(value)
  }, [checkItemNumeroUniqueness])

  // ─── Pricing state ─────────────────────────────────────────────────────────
  const [showUsd, setShowUsd] = useState(false)
  const [syncConversion, setSyncConversion] = useState(false)

  const handleUsdToggle = useCallback((checked: boolean) => {
    setShowUsd(checked)
    if (!checked) {
      setSyncConversion(false)
      setForm((p) => ({ ...p, precioUnitarioUsd: '' }))
    }
  }, [])

  const handleSyncToggle = useCallback((checked: boolean) => {
    setSyncConversion(checked)
    if (checked) {
      // Recalculate BOB from current USD
      setForm((p) => {
        const usd = parseFloat(p.precioUnitarioUsd)
        if (!isNaN(usd) && usd > 0) {
          return { ...p, precioUnitarioBob: (usd * TIPO_CAMBIO).toFixed(2) }
        }
        return p
      })
    }
  }, [])

  const handleUsdChange = useCallback((value: string) => {
    setForm((p) => {
      const next = { ...p, precioUnitarioUsd: value }
      if (syncConversion) {
        const usd = parseFloat(value)
        next.precioUnitarioBob = (!isNaN(usd) && usd > 0) ? (usd * TIPO_CAMBIO).toFixed(2) : ''
      }
      return next
    })
  }, [syncConversion])

  // ─── Searchable category combobox ──────────────────────────────────────────
  const [catSearch, setCatSearch] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  // ─── Unit combobox state ───────────────────────────────────────────────────
  const [undOpen, setUndOpen] = useState(false)
  const undRef = useRef<HTMLDivElement>(null)

  const filteredUnidades = form.und
    ? UNIDADES_PREDEFINIDAS.filter((u) => u.toLowerCase().includes(form.und.toLowerCase()))
    : UNIDADES_PREDEFINIDAS

  const filteredCategorias = catSearch
    ? categorias.filter((c) => c.nombre.toLowerCase().includes(catSearch.toLowerCase()))
    : categorias

  const selectedCatName = categorias.find((c) => c.id === form.categoriaId)?.nombre ?? ''

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
      if (undRef.current && !undRef.current.contains(e.target as Node)) setUndOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    setSubmitting(false)
    setItemNumeroStatus('idle')
    setShowUsd(false)
    setSyncConversion(false)
    setCatSearch('')
    setCatOpen(false)
    setUndOpen(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.codigo || !form.und || itemNumeroStatus === 'taken' || itemNumeroStatus === 'checking') return
    setSubmitting(true)
    const dto: CreateItemDto = {
      tipoOrigen: TIPO_ORIGEN_MAP[inventoryType],
      codigo: form.codigo,
      unidad: form.und,
      ...(form.nombre && { nombre: form.nombre }),
      ...(form.descripcion && { descripcion: form.descripcion }),
      ...(form.rendimiento && { rendimiento: form.rendimiento }),
      ...(form.categoriaId && { categoriaId: form.categoriaId }),
      ...(form.proveedorId && { proveedorId: form.proveedorId }),
      ...(form.itemNumero && { itemNumero: form.itemNumero }),
      ...(form.precioUnitarioBob && { precioUnitarioBob: parseFloat(form.precioUnitarioBob) }),
      ...(form.precioUnitarioUsd && { precioUnitarioUsd: parseFloat(form.precioUnitarioUsd) }),
      ...(form.stockInicial && form.almacenId && { stockInicial: parseInt(form.stockInicial, 10), almacenId: form.almacenId }),
    }
    const ok = await onAdd(dto)
    setSubmitting(false)
    if (ok) handleClose()
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
              {inventoryType === 'nueva' ? 'Importación Nueva' : inventoryType === 'antigua' ? 'Importación Antigua' : 'Compra Nacional'}
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

            {inventoryType === 'nacional' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej. Guantes de latex"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descripción</label>
              <input
                value={form.descripcion}
                onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Ej. porcelanato 60x60"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div ref={undRef}>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Unidad *</label>
              <div className="relative">
                <input
                  value={form.und}
                  onChange={(e) => { setForm((p) => ({ ...p, und: e.target.value })); setUndOpen(true) }}
                  onFocus={() => setUndOpen(true)}
                  placeholder="pza, caja, m²..."
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                {undOpen && filteredUnidades.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                    {filteredUnidades.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => { setForm((p) => ({ ...p, und: u })); setUndOpen(false) }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors ${
                          form.und === u ? 'bg-accent/10 text-accent font-medium' : 'text-foreground'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {inventoryType === 'nueva' && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ítem n°</label>
                <div className="relative">
                  <input
                    value={form.itemNumero}
                    onChange={(e) => handleItemNumeroChange(e.target.value)}
                    placeholder="Ej. 9013"
                    className={`w-full px-3 py-2 bg-background border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 ${
                      itemNumeroStatus === 'taken'
                        ? 'border-red-500 focus:ring-red-500'
                        : itemNumeroStatus === 'available'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-border focus:ring-accent'
                    }`}
                  />
                  {itemNumeroStatus === 'checking' && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                  )}
                  {itemNumeroStatus === 'available' && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                  {itemNumeroStatus === 'taken' && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  )}
                </div>
                {itemNumeroStatus === 'taken' && (
                  <p className="text-xs text-red-400 mt-1">Este ítem n° ya está registrado.</p>
                )}
              </div>
            )}

            {inventoryType !== 'nacional' && (
              <div className={inventoryType === 'antigua' ? '' : ''}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Rendimiento</label>
                <input
                  value={form.rendimiento}
                  onChange={(e) => setForm((p) => ({ ...p, rendimiento: e.target.value }))}
                  placeholder="Ej. 1.44 m2"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            )}

            <div className="sm:col-span-2" ref={catRef}>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoría</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={selectedCatName || 'Buscar categoría...'}
                  value={catOpen ? catSearch : selectedCatName}
                  onChange={(e) => { setCatSearch(e.target.value); setCatOpen(true) }}
                  onFocus={() => setCatOpen(true)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                {form.categoriaId && (
                  <button
                    type="button"
                    onClick={() => { setForm((p) => ({ ...p, categoriaId: '' })); setCatSearch(''); setCatOpen(false) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-border transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
                {catOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCategorias.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>
                    ) : (
                      filteredCategorias.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setForm((p) => ({ ...p, categoriaId: cat.id })); setCatSearch(''); setCatOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${
                            form.categoriaId === cat.id ? 'bg-accent/10 text-accent font-medium' : 'text-foreground'
                          }`}
                        >
                          {cat.nombre}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {inventoryType === 'nacional' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Proveedor</label>
                <select
                  value={form.proveedorId}
                  onChange={(e) => setForm((p) => ({ ...p, proveedorId: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Stock inicial — solo al crear */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Stock Inicial (opcional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={form.almacenId}
                  onChange={(e) => setForm((p) => ({ ...p, almacenId: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Seleccionar almacén</option>
                  {almacenes.filter((a) => a.estado === 'activo').map((alm) => (
                    <option key={alm.id} value={alm.id}>{alm.nombre}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.stockInicial}
                  onChange={(e) => setForm((p) => ({ ...p, stockInicial: e.target.value }))}
                  placeholder="Cantidad"
                  disabled={!form.almacenId}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Precio BOB</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precioUnitarioBob}
                  onChange={(e) => setForm((p) => ({ ...p, precioUnitarioBob: e.target.value }))}
                  placeholder="0.00"
                  readOnly={syncConversion}
                  className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent ${
                    syncConversion ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                {syncConversion && (
                  <p className="text-xs text-muted-foreground mt-1">Calculado automáticamente: USD × {TIPO_CAMBIO}</p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUsd}
                  onChange={(e) => handleUsdToggle(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-[hsl(var(--accent))]"
                />
                <span className="text-xs font-medium text-muted-foreground">Añadir precio en dólares (USD)</span>
              </label>

              {showUsd && (
                <div className="space-y-2">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Precio USD</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.precioUnitarioUsd}
                        onChange={(e) => handleUsdChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncConversion}
                      onChange={(e) => handleSyncToggle(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-[hsl(var(--accent))]"
                    />
                    <span className="text-xs font-medium text-muted-foreground">Sincronizar conversión a bolivianos (1 USD = {TIPO_CAMBIO} BOB)</span>
                  </label>
                </div>
              )}
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
                <p className="text-sm font-medium text-foreground truncate">{form.nombre || form.descripcion || '—'}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!form.codigo || !form.und || submitting || itemNumeroStatus === 'taken' || itemNumeroStatus === 'checking'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-background rounded-xl font-semibold text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><Plus className="w-4 h-4" /> Agregar al Inventario</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
