import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { ObraItem } from '@/types/entities'

export interface CreateObraDto {
  nombre: string
  ubicacion?: string
  responsable?: string
  fechaInicio: string
}

export interface UpdateObraDto {
  nombre?: string
  ubicacion?: string
  responsable?: string
  fechaInicio?: string
}

export interface CloseObraDto {
  fechaFin?: string
  observaciones?: string
}

export const obrasService = {
  getAll(): Promise<ApiResponse<ObraItem[]>> {
    return apiClient.get('/obras')
  },

  getById(id: string): Promise<ApiResponse<ObraItem>> {
    return apiClient.get(`/obras/${id}`)
  },

  create(dto: CreateObraDto): Promise<ApiResponse<ObraItem>> {
    return apiClient.post('/obras', dto)
  },

  update(id: string, dto: UpdateObraDto): Promise<ApiResponse<ObraItem>> {
    return apiClient.patch(`/obras/${id}`, dto)
  },

  close(id: string, dto?: CloseObraDto): Promise<ApiResponse<ObraItem>> {
    return apiClient.patch(`/obras/${id}/close`, dto ?? {})
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/obras/${id}`)
  },
}
