import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { Almacen, AlmacenTipo } from '@/types/entities'

export interface CreateAlmacenDto {
  nombre: string
  tipoAlmacen: AlmacenTipo
  direccion?: string
  obraId?: string
}

export interface UpdateAlmacenDto {
  nombre?: string
  direccion?: string
  obraId?: string
}

export interface GetInventarioParams {
  almacenId?: string
  tipo?: string
  search?: string
  page?: number
  pageSize?: number
}

export const almacenesService = {
  getAll(obraId?: string): Promise<ApiResponse<Almacen[]>> {
    const qs = obraId ? `?obraId=${obraId}` : ''
    return apiClient.get(`/almacenes${qs}`)
  },

  getById(id: string): Promise<ApiResponse<Almacen>> {
    return apiClient.get(`/almacenes/${id}`)
  },

  create(dto: CreateAlmacenDto): Promise<ApiResponse<Almacen>> {
    return apiClient.post('/almacenes', dto)
  },

  update(id: string, dto: UpdateAlmacenDto): Promise<ApiResponse<Almacen>> {
    return apiClient.patch(`/almacenes/${id}`, dto)
  },

  toggleActive(id: string): Promise<ApiResponse<{ id: string; estado: string }>> {
    return apiClient.patch(`/almacenes/${id}/toggle-active`)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/almacenes/${id}`)
  },
}
