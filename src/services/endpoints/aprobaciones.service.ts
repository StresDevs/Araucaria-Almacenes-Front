import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { SolicitudAprobacion } from '@/types/entities'

export const aprobacionesService = {
  /** Get all solicitudes for admin review */
  getAll(tipo?: string, estado?: string): Promise<ApiResponse<SolicitudAprobacion[]>> {
    const params = new URLSearchParams()
    if (tipo && tipo !== 'todos') params.append('tipo', tipo)
    if (estado && estado !== 'todos') params.append('estado', estado)
    const qs = params.toString()
    return apiClient.get(`/aprobaciones${qs ? `?${qs}` : ''}`)
  },

  /** Get one by id */
  getById(id: string): Promise<ApiResponse<SolicitudAprobacion>> {
    return apiClient.get(`/aprobaciones/${id}`)
  },

  /** Approve a solicitud */
  aprobar(id: string): Promise<ApiResponse<SolicitudAprobacion>> {
    return apiClient.patch(`/aprobaciones/${id}/aprobar`, {})
  },

  /** Reject a solicitud */
  rechazar(id: string, notasRevision?: string): Promise<ApiResponse<SolicitudAprobacion>> {
    return apiClient.patch(`/aprobaciones/${id}/rechazar`, { notasRevision })
  },
}
