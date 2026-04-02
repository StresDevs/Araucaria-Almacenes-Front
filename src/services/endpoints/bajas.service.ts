import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { SolicitudBaja } from '@/types/entities'

export interface CreateBajaPayload {
  itemId: string
  cantidad: number
  motivo: string
  descripcionMotivo: string
  evidencia?: File
}

export const bajasService = {
  /** Create a new baja request (with optional evidence photo) */
  create(payload: CreateBajaPayload): Promise<ApiResponse<SolicitudBaja>> {
    const formData = new FormData()
    formData.append('itemId', payload.itemId)
    formData.append('cantidad', String(payload.cantidad))
    formData.append('motivo', payload.motivo)
    formData.append('descripcionMotivo', payload.descripcionMotivo)
    if (payload.evidencia) {
      formData.append('evidencia', payload.evidencia)
    }
    return apiClient.post('/bajas', formData)
  },

  /** Get all bajas, optionally filtered by estado */
  getAll(estado?: string): Promise<ApiResponse<SolicitudBaja[]>> {
    const qs = estado ? `?estado=${estado}` : ''
    return apiClient.get(`/bajas${qs}`)
  },

  /** Get a single baja */
  getById(id: string): Promise<ApiResponse<SolicitudBaja>> {
    return apiClient.get(`/bajas/${id}`)
  },
}
