import { apiClient } from '@/services/api/client'
import type { ApiPaginatedResponse, ApiResponse } from '@/types/api'
import type { ObraItem } from '@/types/entities'

export interface CreateObraDto {
  nombre: string
  ubicacion: string
  responsable: string
  fecha_inicio: string
}

export interface CloseObraDto {
  obraId: string
  fecha_fin: string
  observaciones?: string
}

export const obrasService = {
  getAll(): Promise<ApiPaginatedResponse<ObraItem>> {
    return apiClient.get('/obras')
  },

  getById(id: string): Promise<ApiResponse<ObraItem>> {
    return apiClient.get(`/obras/${id}`)
  },

  create(dto: CreateObraDto): Promise<ApiResponse<ObraItem>> {
    return apiClient.post('/obras', dto)
  },

  close(dto: CloseObraDto): Promise<ApiResponse<ObraItem>> {
    return apiClient.patch(`/obras/${dto.obraId}/close`, dto)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/obras/${id}`)
  },
}
