import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { ProveedorItem } from '@/types/entities'

export interface CreateProveedorDto {
  nombre: string
  telefono?: string
}

export interface UpdateProveedorDto {
  nombre?: string
  telefono?: string
}

export const proveedoresService = {
  getAll(): Promise<ApiResponse<ProveedorItem[]>> {
    return apiClient.get('/proveedores')
  },

  getById(id: string): Promise<ApiResponse<ProveedorItem>> {
    return apiClient.get(`/proveedores/${id}`)
  },

  create(dto: CreateProveedorDto): Promise<ApiResponse<ProveedorItem>> {
    return apiClient.post('/proveedores', dto)
  },

  update(id: string, dto: UpdateProveedorDto): Promise<ApiResponse<ProveedorItem>> {
    return apiClient.patch(`/proveedores/${id}`, dto)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/proveedores/${id}`)
  },
}
