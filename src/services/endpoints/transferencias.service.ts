import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'

export interface TransferenciaItemDto {
  almacenDestinoId: string
  itemId: string
  cantidad: number
}

export interface CreateTransferenciaDto {
  almacenOrigenId: string
  items: TransferenciaItemDto[]
  observaciones?: string
}

export interface TransferenciaItemResponse {
  id: string
  almacen_destino_id: string
  almacen_destino_nombre: string | null
  item_id: string
  item_codigo: string | null
  item_nombre: string | null
  item_descripcion: string | null
  cantidad: number
}

export interface TransferenciaResponse {
  id: string
  almacen_origen_id: string
  almacen_origen_nombre: string | null
  observaciones: string | null
  evidencia_url: string | null
  estado: string
  created_by: string | null
  items: TransferenciaItemResponse[]
  created_at: string
  updated_at: string
}

export interface GetTransferenciasParams {
  page?: number
  pageSize?: number
}

export const transferenciasService = {
  getAll(params?: GetTransferenciasParams): Promise<ApiResponse<TransferenciaResponse[]> & { meta?: { page: number; pageSize: number; total: number } }> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    const qs = query.toString()
    return apiClient.get(`/transferencias${qs ? `?${qs}` : ''}`)
  },

  getById(id: string): Promise<ApiResponse<TransferenciaResponse>> {
    return apiClient.get(`/transferencias/${id}`)
  },

  create(dto: CreateTransferenciaDto): Promise<ApiResponse<TransferenciaResponse>> {
    return apiClient.post('/transferencias', dto)
  },

  uploadEvidencia(id: string, file: File): Promise<ApiResponse<{ evidencia_url: string }>> {
    const formData = new FormData()
    formData.append('evidencia', file)
    return apiClient.post(`/transferencias/${id}/evidencia`, formData)
  },
}
