import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { Contratista, OrdenEntrega } from '@/types/entities'

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateSolicitudDto {
  obraId: string
  contratistaId: string
  titulo: string
  descripcion?: string
  sector: string
  piso: string
  departamento?: string
  fechaEntrega?: string
  items: Array<{ itemId: string; cantidad: number }>
}

export interface CreateContratistaDto {
  nombre: string
  empresa?: string
  telefono?: string
  obraId?: string
}

export interface ItemDisponible {
  id: string
  codigo_fab: string
  descripcion: string
  unidad: string
  cantidad: number
  stock_disponible: number
  almacen_id: string
  almacen_nombre: string | null
}

interface SolicitudesListResponse {
  success: boolean
  data: OrdenEntrega[]
  meta: { page: number; pageSize: number; total: number }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const solicitudesService = {
  /** Fetch contractors, optionally filtered by obra */
  getContratistas(obraId?: string): Promise<ApiResponse<Contratista[]>> {
    const qs = obraId ? `?obraId=${obraId}` : ''
    return apiClient.get(`/contratistas${qs}`)
  },

  /** Create a new contractor */
  createContratista(dto: CreateContratistaDto): Promise<ApiResponse<Contratista>> {
    return apiClient.post('/contratistas', dto)
  },

  /** Fetch available items with stock info */
  getItemsDisponibles(params?: { almacenId?: string; obraId?: string }): Promise<ApiResponse<ItemDisponible[]>> {
    const searchParams = new URLSearchParams()
    if (params?.almacenId) searchParams.set('almacenId', params.almacenId)
    if (params?.obraId) searchParams.set('obraId', params.obraId)
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return apiClient.get(`/solicitudes/items-disponibles${qs}`)
  },

  /** Create a new material delivery order */
  create(dto: CreateSolicitudDto): Promise<ApiResponse<OrdenEntrega>> {
    return apiClient.post('/solicitudes', dto)
  },

  /** Fetch order history with pagination and filters */
  getAll(params?: {
    page?: number
    pageSize?: number
    obraId?: string
    fechaDesde?: string
    fechaHasta?: string
  }): Promise<SolicitudesListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
    if (params?.obraId) searchParams.set('obraId', params.obraId)
    if (params?.fechaDesde) searchParams.set('fechaDesde', params.fechaDesde)
    if (params?.fechaHasta) searchParams.set('fechaHasta', params.fechaHasta)
    const qs = searchParams.toString()
    return apiClient.get(`/solicitudes${qs ? `?${qs}` : ''}`)
  },

  /** Fetch a single order by id */
  getById(id: string): Promise<ApiResponse<OrdenEntrega>> {
    return apiClient.get(`/solicitudes/${id}`)
  },
}

