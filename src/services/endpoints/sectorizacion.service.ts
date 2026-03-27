import { apiClient } from '@/services/api/client'
import type { ApiPaginatedResponse, ApiResponse } from '@/types/api'
import type { ObraSectorizacion } from '@/types/entities'

export interface CreateSectorizacionDto {
  obraId: string
  sectores: Array<{ nombre: string; color: string; numero: number }>
  pisos: Array<{
    numero: string
    nombre: string
    departamentos: Array<{ letra: string; sector_id: string }>
  }>
}

export const sectorizacionService = {
  getAll(): Promise<ApiPaginatedResponse<ObraSectorizacion>> {
    return apiClient.get('/sectorizacion')
  },

  getByObraId(obraId: string): Promise<ApiResponse<ObraSectorizacion>> {
    return apiClient.get(`/sectorizacion/${obraId}`)
  },

  create(dto: CreateSectorizacionDto): Promise<ApiResponse<ObraSectorizacion>> {
    return apiClient.post('/sectorizacion', dto)
  },

  update(id: string, dto: Partial<CreateSectorizacionDto>): Promise<ApiResponse<ObraSectorizacion>> {
    return apiClient.put(`/sectorizacion/${id}`, dto)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/sectorizacion/${id}`)
  },
}
