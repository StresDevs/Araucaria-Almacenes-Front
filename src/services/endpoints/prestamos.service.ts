import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { PrestamoRegistro, EstadoPrestamo } from '@/types/entities'

export interface CreatePrestamoPayload {
  itemId: string
  cantidad: number
  personaPrestamo: string
  obraId?: string
  seccion?: string
  contratistaId?: string
  notas?: string
}

export interface DevolverPrestamoPayload {
  estado?: 'devuelto' | 'consumido'
  notas?: string
}

export interface GetPrestamosParams {
  estado?: EstadoPrestamo
  obraId?: string
  search?: string
}

export const prestamosService = {
  getAll(params?: GetPrestamosParams): Promise<ApiResponse<PrestamoRegistro[]>> {
    const query = new URLSearchParams()
    if (params?.estado) query.set('estado', params.estado)
    if (params?.obraId) query.set('obraId', params.obraId)
    if (params?.search) query.set('search', params.search)
    const qs = query.toString()
    return apiClient.get(`/prestamos${qs ? `?${qs}` : ''}`)
  },

  getById(id: string): Promise<ApiResponse<PrestamoRegistro>> {
    return apiClient.get(`/prestamos/${id}`)
  },

  getStats(): Promise<ApiResponse<{ prestados: number; devueltos: number; consumidos: number }>> {
    return apiClient.get('/prestamos/stats')
  },

  create(dto: CreatePrestamoPayload): Promise<ApiResponse<PrestamoRegistro>> {
    return apiClient.post('/prestamos', dto)
  },

  devolver(id: string, dto?: DevolverPrestamoPayload): Promise<ApiResponse<PrestamoRegistro>> {
    return apiClient.patch(`/prestamos/${id}/devolver`, dto || {})
  },
}
