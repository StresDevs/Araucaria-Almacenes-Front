import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'
import type { ItemInventario, ItemOrigen } from '@/types/entities'

export interface CreateItemDto {
  tipoOrigen: ItemOrigen
  categoriaId?: string
  itemNumero?: string
  codigo: string
  nombre?: string
  descripcion?: string
  unidad: string
  rendimiento?: string
  proveedorId?: string
  precioUnitarioBob?: number
  precioUnitarioUsd?: number
  stockInicial?: number
  almacenId?: string
}

export interface UpdateItemDto {
  categoriaId?: string
  itemNumero?: string
  codigo?: string
  nombre?: string
  descripcion?: string
  unidad?: string
  rendimiento?: string
  proveedorId?: string
  precioUnitarioBob?: number
  precioUnitarioUsd?: number
}

export interface SetAlmacenStockDto {
  almacenId: string
  cantidad: number
}

export interface CreateEntradaStockDto {
  almacenId: string
  cantidad: number
  descripcion?: string
}

export interface AlmacenItemResponse {
  id: string
  almacen_id: string
  item_id: string
  cantidad: number
  item: ItemInventario | null
}

export const inventarioService = {
  getAll(tipo?: ItemOrigen): Promise<ApiResponse<ItemInventario[]>> {
    const qs = tipo ? `?tipo=${tipo}` : ''
    return apiClient.get(`/inventario${qs}`)
  },

  getByAlmacen(almacenId: string): Promise<ApiResponse<AlmacenItemResponse[]>> {
    return apiClient.get(`/inventario/almacen/${almacenId}`)
  },

  getById(id: string): Promise<ApiResponse<ItemInventario>> {
    return apiClient.get(`/inventario/${id}`)
  },

  create(dto: CreateItemDto): Promise<ApiResponse<ItemInventario>> {
    return apiClient.post('/inventario', dto)
  },

  update(id: string, dto: UpdateItemDto): Promise<ApiResponse<ItemInventario>> {
    return apiClient.patch(`/inventario/${id}`, dto)
  },

  uploadFoto(id: string, file: File): Promise<ApiResponse<{ foto_url: string }>> {
    const formData = new FormData()
    formData.append('foto', file)
    return apiClient.post(`/inventario/${id}/foto`, formData)
  },

  setAlmacenStock(itemId: string, dto: SetAlmacenStockDto): Promise<ApiResponse<ItemInventario>> {
    return apiClient.patch(`/inventario/${itemId}/stock`, dto)
  },

  removeAlmacenStock(itemId: string, almacenId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/inventario/${itemId}/stock/${almacenId}`)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/inventario/${id}`)
  },

  createEntradaStock(itemId: string, dto: CreateEntradaStockDto): Promise<ApiResponse<{ entrada: unknown; item: ItemInventario }>> {
    return apiClient.post(`/inventario/${itemId}/entradas`, dto)
  },

  checkItemNumero(itemNumero: string, excludeId?: string): Promise<ApiResponse<{ exists: boolean }>> {
    const params = new URLSearchParams({ itemNumero })
    if (excludeId) params.append('excludeId', excludeId)
    return apiClient.get(`/inventario/check-item-numero?${params.toString()}`)
  },
}
