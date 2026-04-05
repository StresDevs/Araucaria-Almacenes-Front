import { apiClient } from '../api/client'
import type { SolicitudAprobacion, TipoSolicitudAprobacion, EstadoAprobacion } from '@/types'

export interface CrearEdicionInventarioPayload {
  itemId: string
  justificacion: string
  cambios: {
    categoriaId?: string
    itemNumero?: string
    codigo?: string
    nombre?: string
    descripcion?: string
    unidad?: string
    rendimiento?: string
    proveedorId?: string
    precioUnitarioBob?: number
    precioUnitarioUsd?: number
  }
}

export const aprobacionesService = {
  /** GET /aprobaciones with optional filters */
  getAll(
    tipo?: 'todos' | TipoSolicitudAprobacion,
    estado?: 'todos' | EstadoAprobacion,
  ) {
    const params = new URLSearchParams()
    if (tipo && tipo !== 'todos') params.set('tipo', tipo)
    if (estado && estado !== 'todos') params.set('estado', estado)
    const qs = params.toString()
    return apiClient.get<{ success: boolean; data: SolicitudAprobacion[] }>(
      `/aprobaciones${qs ? `?${qs}` : ''}`,
    )
  },

  /** PATCH /aprobaciones/:id/aprobar */
  aprobar(id: string) {
    return apiClient.patch<{ success: boolean; data: SolicitudAprobacion; message: string }>(
      `/aprobaciones/${id}/aprobar`,
    )
  },

  /** PATCH /aprobaciones/:id/rechazar */
  rechazar(id: string, notasRevision?: string) {
    return apiClient.patch<{ success: boolean; data: SolicitudAprobacion; message: string }>(
      `/aprobaciones/${id}/rechazar`,
      { notasRevision },
    )
  },

  /** POST /aprobaciones/edicion-inventario */
  crearEdicionInventario(payload: CrearEdicionInventarioPayload) {
    return apiClient.post<{ success: boolean; data: SolicitudAprobacion; message: string }>(
      '/aprobaciones/edicion-inventario',
      payload,
    )
  },

  /** PATCH /aprobaciones/:id/reapelar */
  reapelar(id: string) {
    return apiClient.patch<{ success: boolean; data: SolicitudAprobacion; message: string }>(
      `/aprobaciones/${id}/reapelar`,
    )
  },
}
