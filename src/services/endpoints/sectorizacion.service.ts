import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { ObraSectorizacion, SectorizacionArchivo } from '@/types/entities'

export interface CreateSectorizacionDto {
  obraId: string
  sectores: Array<{ nombre: string; color: string; numero: number }>
  pisos: Array<{
    numero: number
    nombre: string
    orden?: number
    departamentos: Array<{ letra: string; nombre?: string; sectorNumero: number }>
  }>
}

export interface UpdateSectorizacionDto {
  sectores?: Array<{ nombre: string; color: string; numero: number }>
  pisos?: Array<{
    numero: number
    nombre: string
    orden?: number
    departamentos: Array<{ letra: string; nombre?: string; sectorNumero: number }>
  }>
}

export interface AddArchivoDto {
  nombreOriginal: string
  nombreArchivo: string
  url: string
  mimetype: string
  tamanio: number
}

interface ListResponse {
  success: boolean
  data: ObraSectorizacion[]
}

export const sectorizacionService = {
  getAll(): Promise<ListResponse> {
    return apiClient.get('/sectorizacion')
  },

  getDesactivadas(): Promise<ListResponse> {
    return apiClient.get('/sectorizacion/desactivadas')
  },

  getById(id: string): Promise<ApiResponse<ObraSectorizacion>> {
    return apiClient.get(`/sectorizacion/${id}`)
  },

  create(dto: CreateSectorizacionDto): Promise<ApiResponse<ObraSectorizacion>> {
    return apiClient.post('/sectorizacion', dto)
  },

  update(id: string, dto: UpdateSectorizacionDto): Promise<ApiResponse<ObraSectorizacion>> {
    return apiClient.patch(`/sectorizacion/${id}`, dto)
  },

  toggleActive(id: string): Promise<ApiResponse<{ id: string; estado: string }>> {
    return apiClient.patch(`/sectorizacion/${id}/toggle-active`, {})
  },

  addArchivo(id: string, dto: AddArchivoDto): Promise<ApiResponse<SectorizacionArchivo>> {
    return apiClient.post(`/sectorizacion/${id}/archivos`, dto)
  },

  removeArchivo(archivoId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/sectorizacion/archivos/${archivoId}`)
  },
}
