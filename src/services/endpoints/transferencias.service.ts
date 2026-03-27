import { apiClient } from '@/services/api/client'
import type { ApiPaginatedResponse, ApiResponse, DateRangeParams } from '@/types/api'
import type { Movimiento } from '@/types/entities'

export interface CreateTransferenciaDto {
  almacenOrigenId: string
  almacenDestinoId: string
  items: Array<{ itemId: string; cantidad: number }>
  observaciones?: string
  evidenciaUrl?: string
}

export interface GetMovimientosParams extends DateRangeParams {
  almacenId?: string
  tipo?: Movimiento['tipo']
  contratistaId?: string
  page?: number
  pageSize?: number
}

export const transferenciasService = {
  getHistorial(params?: GetMovimientosParams): Promise<ApiPaginatedResponse<Movimiento>> {
    const query = new URLSearchParams()
    if (params?.almacenId) query.set('almacenId', params.almacenId)
    if (params?.tipo) query.set('tipo', params.tipo)
    if (params?.contratistaId) query.set('contratistaId', params.contratistaId)
    if (params?.fechaDesde) query.set('fechaDesde', params.fechaDesde)
    if (params?.fechaHasta) query.set('fechaHasta', params.fechaHasta)
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    const qs = query.toString()
    return apiClient.get(`/transferencias/historial${qs ? `?${qs}` : ''}`)
  },

  create(dto: CreateTransferenciaDto): Promise<ApiResponse<{ transferenciaId: string }>> {
    return apiClient.post('/transferencias', dto)
  },
}
