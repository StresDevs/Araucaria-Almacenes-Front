import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { CategoriaItem } from '@/types/entities'

export interface CreateCategoriaDto {
  nombre: string
  descripcion?: string
}

export interface UpdateCategoriaDto {
  nombre?: string
  descripcion?: string
}

export const categoriasService = {
  getAll(): Promise<ApiResponse<CategoriaItem[]>> {
    return apiClient.get('/categorias')
  },

  getById(id: string): Promise<ApiResponse<CategoriaItem>> {
    return apiClient.get(`/categorias/${id}`)
  },

  create(dto: CreateCategoriaDto): Promise<ApiResponse<CategoriaItem>> {
    return apiClient.post('/categorias', dto)
  },

  update(id: string, dto: UpdateCategoriaDto): Promise<ApiResponse<CategoriaItem>> {
    return apiClient.patch(`/categorias/${id}`, dto)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/categorias/${id}`)
  },
}
