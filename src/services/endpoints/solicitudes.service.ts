import { apiClient } from '@/services/api/client'
import type { ApiPaginatedResponse, ApiResponse } from '@/types/api'
import type { Contratista, CartItem } from '@/types/entities'

export interface CreateSolicitudDto {
  obraId: string
  contratistaId: string
  sectorId?: string
  pisoId?: string
  departamento?: string
  items: Array<{ itemId: string; cantidad: number }>
}

export const solicitudesService = {
  getContratistas(obraId?: string): Promise<ApiPaginatedResponse<Contratista>> {
    const qs = obraId ? `?obraId=${obraId}` : ''
    return apiClient.get(`/contratistas${qs}`)
  },

  getItemsDisponibles(almacenId?: string): Promise<ApiPaginatedResponse<CartItem>> {
    const qs = almacenId ? `?almacenId=${almacenId}` : ''
    return apiClient.get(`/items/disponibles${qs}`)
  },

  create(dto: CreateSolicitudDto): Promise<ApiResponse<{ solicitudId: string }>> {
    return apiClient.post('/solicitudes', dto)
  },
}
