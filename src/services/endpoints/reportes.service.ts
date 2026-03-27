import { apiClient } from '@/services/api/client'
import type { ApiPaginatedResponse, DateRangeParams } from '@/types/api'
import type { Movimiento } from '@/types/entities'

export interface GetReportesParams extends DateRangeParams {
  almacenId?: string
  contratistaId?: string
  tipo?: Movimiento['tipo']
  page?: number
  pageSize?: number
}

export const reportesService = {
  getMovimientos(params?: GetReportesParams): Promise<ApiPaginatedResponse<Movimiento>> {
    const query = new URLSearchParams()
    if (params?.almacenId) query.set('almacenId', params.almacenId)
    if (params?.contratistaId) query.set('contratistaId', params.contratistaId)
    if (params?.tipo) query.set('tipo', params.tipo)
    if (params?.fechaDesde) query.set('fechaDesde', params.fechaDesde)
    if (params?.fechaHasta) query.set('fechaHasta', params.fechaHasta)
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    const qs = query.toString()
    return apiClient.get(`/reportes/movimientos${qs ? `?${qs}` : ''}`)
  },

  exportMovimientos(params?: GetReportesParams): Promise<Blob> {
    const query = new URLSearchParams()
    if (params?.almacenId) query.set('almacenId', params.almacenId)
    if (params?.fechaDesde) query.set('fechaDesde', params.fechaDesde)
    if (params?.fechaHasta) query.set('fechaHasta', params.fechaHasta)
    const qs = query.toString()
    return apiClient.get(`/reportes/movimientos/export${qs ? `?${qs}` : ''}`)
  },
}
