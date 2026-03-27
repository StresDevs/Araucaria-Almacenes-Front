import { apiClient } from '@/services/api/client'
import type { ApiPaginatedResponse, ApiResponse, PaginationParams } from '@/types/api'
import type { Prestamo } from '@/types/entities'

export interface CreatePrestamoDto {
  item: string
  obra: string
  fecha_inicio: string
  fecha_vencimiento: string
  responsable: string
}

export interface GetPrestamosParams extends PaginationParams {
  estado?: Prestamo['estado']
  obra?: string
  search?: string
}

export const prestamosService = {
  getAll(params?: GetPrestamosParams): Promise<ApiPaginatedResponse<Prestamo>> {
    const query = new URLSearchParams()
    if (params?.estado) query.set('estado', params.estado)
    if (params?.obra) query.set('obra', params.obra)
    if (params?.search) query.set('search', params.search)
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    const qs = query.toString()
    return apiClient.get(`/prestamos${qs ? `?${qs}` : ''}`)
  },

  create(dto: CreatePrestamoDto): Promise<ApiResponse<Prestamo>> {
    return apiClient.post('/prestamos', dto)
  },

  markReturned(id: string): Promise<ApiResponse<Prestamo>> {
    return apiClient.patch(`/prestamos/${id}/devolver`)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/prestamos/${id}`)
  },
}
