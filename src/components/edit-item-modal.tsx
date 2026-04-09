'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Loader2, Save, Camera, ImageIcon, ShieldAlert, Send } from 'lucide-react'
import type { ItemInventario, CategoriaItem, ProveedorItem, UserRole } from '@/types'
import type { UpdateItemDto } from '@/services/endpoints/inventario.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? ''

interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, dto: UpdateItemDto) => Promise<boolean>
  onUploadFoto?: (id: string, file: File) => Promise<boolean>
  onSubmitForApproval?: (itemId: string, justificacion: string, cambios: UpdateItemDto) => Promise<boolean>
  item: ItemInventario | null
  categorias?: CategoriaItem[]
  proveedores?: ProveedorItem[]
  userRole?: UserRole
}

const UNIDADES = [
  'pza', 'caja', 'm²', 'm', 'ml', 'kg', 'lt', 'rollo', 'bolsa',
  'unidad', 'placa', 'tubo', 'par', 'juego', 'galón', 'balde',
  'plancha', 'metro', 'global', 'set', 'sobre', 'saco', 'barra',
]

export function EditItemModal({ isOpen, onClose, onSave, onUploadFoto, onSubmitForApproval, item, categorias = [], proveedores = [], userRole }: EditItemModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAdmin = userRole === 'administrador'
  const needsApproval = !isAdmin && !!onSubmitForApproval
  const [form, setForm] = useState({
    itemNumero: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    unidad: '',
    rendimiento: '',
    aplicacion: '',
    medida: '',
    piezasPorCaja: '',
    espacioDeUso: '',
    categoriaId: '',
    proveedorId: '',
    precioUnitarioBob: '',
    precioUnitarioUsd: '',
  })
  const [justificacion, setJustificacion] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (item && isOpen) {
      setForm({
        itemNumero: item.item_numero ?? '',
        codigo: item.codigo ?? '',
        nombre: item.nombre ?? '',
        descripcion: item.descripcion ?? '',
        unidad: item.unidad ?? '',
        rendimiento: item.rendimiento ?? '',
        aplicacion: item.aplicacion ?? '',
        medida: item.medida ?? '',
        piezasPorCaja: item.piezas_por_caja != null ? String(item.piezas_por_caja) : '',
        espacioDeUso: item.espacio_de_uso ?? '',
        categoriaId: item.categoria_id ?? '',
        proveedorId: item.proveedor_id ?? '',
        precioUnitarioBob: item.precio_unitario_bob != null ? String(item.precio_unitario_bob) : '',
        precioUnitarioUsd: item.precio_unitario_usd != null ? String(item.precio_unitario_usd) : '',
      })
      setPreviewUrl(null)
      setJustificacion('')
    }
  }, [item, isOpen])

  if (!isOpen || !item) return null

  const currentImage = previewUrl || (item.foto_url ? `${API_BASE}/${item.foto_url}` : null)
  const editCatName = categorias.find((c) => c.id === form.categoriaId)?.nombre ?? ''
  const isPorcelanato = editCatName.toLowerCase() === 'porcelanato'

  const calculatedRendimiento = (() => {
    if (!isPorcelanato || !form.medida || !form.piezasPorCaja) return ''
    const match = form.medida.match(/^(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)$/)
    if (!match) return ''
    const w = parseFloat(match[1]) / 100
    const h = parseFloat(match[2]) / 100
    const piezas = parseInt(form.piezasPorCaja, 10)
    if (isNaN(w) || isNaN(h) || isNaN(piezas) || piezas <= 0) return ''
    return (w * h * piezas).toFixed(2) + ' m²'
  })()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadFoto) return
    // Show preview immediately
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    await onUploadFoto(item.id, file)
    setUploading(false)
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const dto: UpdateItemDto = {}
    if (form.itemNumero.trim() !== (item.item_numero ?? '')) dto.itemNumero = form.itemNumero.trim()
    if (form.codigo.trim() !== (item.codigo ?? '')) dto.codigo = form.codigo.trim()
    if (form.nombre.trim() !== (item.nombre ?? '')) dto.nombre = form.nombre.trim()
    if (form.descripcion.trim() !== (item.descripcion ?? '')) dto.descripcion = form.descripcion.trim()
    if (form.unidad !== (item.unidad ?? '')) dto.unidad = form.unidad
    // Rendimiento: auto-calc for porcelanato, manual otherwise
    const rendVal = isPorcelanato ? (calculatedRendimiento || '') : form.rendimiento.trim()
    if (rendVal !== (item.rendimiento ?? '')) dto.rendimiento = rendVal
    if (form.aplicacion.trim() !== (item.aplicacion ?? '')) dto.aplicacion = form.aplicacion.trim()
    if (form.medida.trim() !== (item.medida ?? '')) dto.medida = form.medida.trim()
    const piezas = form.piezasPorCaja ? parseInt(form.piezasPorCaja, 10) : undefined
    if (piezas !== (item.piezas_por_caja ?? undefined)) dto.piezasPorCaja = piezas
    if (form.espacioDeUso.trim() !== (item.espacio_de_uso ?? '')) dto.espacioDeUso = form.espacioDeUso.trim()
    if (form.categoriaId !== (item.categoria_id ?? '')) dto.categoriaId = form.categoriaId || undefined
    if (form.proveedorId !== (item.proveedor_id ?? '')) dto.proveedorId = form.proveedorId || undefined
    const bob = form.precioUnitarioBob ? parseFloat(form.precioUnitarioBob) : undefined
    const usd = form.precioUnitarioUsd ? parseFloat(form.precioUnitarioUsd) : undefined
    if (bob !== (item.precio_unitario_bob ?? undefined)) dto.precioUnitarioBob = bob
    if (usd !== (item.precio_unitario_usd ?? undefined)) dto.precioUnitarioUsd = usd

    if (Object.keys(dto).length === 0) {
      setSaving(false)
      onClose()
      return
    }

    // Non-admin: send for approval
    if (needsApproval) {
      if (!justificacion.trim()) {
        setSaving(false)
        return
      }
      const ok = await onSubmitForApproval!(item.id, justificacion.trim(), dto)
      setSaving(false)
      if (ok) onClose()
      return
    }

    // Admin: direct edit
    const ok = await onSave(item.id, dto)
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-bold text-foreground">Editar Ítem</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Imagen del material</label>
            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20 rounded-lg border border-border bg-background overflow-hidden flex-shrink-0 flex items-center justify-center">
                {currentImage ? (
                  <img src={currentImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !onUploadFoto}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-border/40 transition-colors disabled:opacity-40"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {currentImage ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
                <p className="text-[10px] text-muted-foreground">JPG, PNG o WebP — máx. 5 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Nro. Ítem</label>
              <input
                type="text"
                value={form.itemNumero}
                onChange={(e) => handleChange('itemNumero', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Código</label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => handleChange('codigo', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Unidad</label>
              <select
                value={UNIDADES.includes(form.unidad) ? form.unidad : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') handleChange('unidad', e.target.value)
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
                {!UNIDADES.includes(form.unidad) && form.unidad && (
                  <option value="__custom__">{form.unidad}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Rendimiento</label>
              {isPorcelanato ? (
                <input
                  type="text"
                  value={calculatedRendimiento || '—'}
                  readOnly
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground cursor-not-allowed opacity-70"
                />
              ) : (
                <input
                  type="text"
                  value={form.rendimiento}
                  onChange={(e) => handleChange('rendimiento', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              )}
              {isPorcelanato && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Auto-calculado desde medida × piezas</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Aplicación</label>
              <input
                type="text"
                value={form.aplicacion}
                onChange={(e) => handleChange('aplicacion', e.target.value)}
                placeholder="Ej. MUROS, PISO"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Espacio de Uso</label>
              <input
                type="text"
                value={form.espacioDeUso}
                onChange={(e) => handleChange('espacioDeUso', e.target.value)}
                placeholder="Ej. COCINA"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {isPorcelanato && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Medida</label>
                <input
                  type="text"
                  value={form.medida}
                  onChange={(e) => handleChange('medida', e.target.value)}
                  placeholder="Ej. 60x30"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Piezas por caja</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.piezasPorCaja}
                  onChange={(e) => handleChange('piezasPorCaja', e.target.value)}
                  placeholder="Ej. 8"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Categoría</label>
              <select
                value={form.categoriaId}
                onChange={(e) => handleChange('categoriaId', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Proveedor</label>
              <select
                value={form.proveedorId}
                onChange={(e) => handleChange('proveedorId', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Precio BOB</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precioUnitarioBob}
                onChange={(e) => handleChange('precioUnitarioBob', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Precio USD</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precioUnitarioUsd}
                onChange={(e) => handleChange('precioUnitarioUsd', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Justification field for non-admin */}
          {needsApproval && (
            <div className="bg-amber-900/10 border border-amber-600/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300 font-medium">Los cambios serán enviados para aprobación del administrador</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Justificación <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Explica por qué necesitas editar este material..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{justificacion.length}/1000</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end p-4 border-t border-border sticky bottom-0 bg-card">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-border/40 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (needsApproval && !justificacion.trim())}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              needsApproval
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : needsApproval ? (
              <Send className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {needsApproval ? 'Enviar para Aprobación' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
