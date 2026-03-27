import { apiClient } from '@/services/api/client'
import type { ApiPaginatedResponse, ApiResponse } from '@/types/api'
import type { Almacen, ItemCatalogo } from '@/types/entities'

export interface GetInventarioParams {
  almacenId?: string
  tipo?: string
  search?: string
  page?: number
  pageSize?: number
}

export const almacenesService = {
  getAll(): Promise<ApiPaginatedResponse<Almacen>> {
    return apiClient.get('/almacenes')
  },

  getById(id: string): Promise<ApiResponse<Almacen>> {
    return apiClient.get(`/almacenes/${id}`)
  },

  getInventario(almacenId: string, params?: GetInventarioParams): Promise<ApiPaginatedResponse<ItemCatalogo>> {
    const query = new URLSearchParams()
    if (params?.tipo) query.set('tipo', params.tipo)
    if (params?.search) query.set('search', params.search)
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    const qs = query.toString()
    return apiClient.get(`/almacenes/${almacenId}/inventario${qs ? `?${qs}` : ''}`)
  },
}
