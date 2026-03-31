import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { ObraSectorizacion, SectorizacionArchivo } from '@/types/entities'
import { env } from '@/lib/env'

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

  /** Upload real files via multipart/form-data */
  async uploadArchivos(
    sectorizacionId: string,
    files: File[],
  ): Promise<ApiResponse<SectorizacionArchivo[]>> {
    const formData = new FormData()
    files.forEach((file) => formData.append('archivos', file))

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null

    const res = await fetch(
      `${env.apiUrl}/sectorizacion/${sectorizacionId}/archivos/upload`,
      {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      },
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || 'Error al subir archivos')
    }

    return res.json()
  },

  /** Build the download URL for a given archivo */
  getDownloadUrl(archivoId: string): string {
    return `${env.apiUrl}/sectorizacion/archivos/${archivoId}/download`
  },

  removeArchivo(archivoId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/sectorizacion/archivos/${archivoId}`)
  },
}
