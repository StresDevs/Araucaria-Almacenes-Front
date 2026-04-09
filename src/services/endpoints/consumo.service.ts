import { apiClient } from '@/services/api/client'
import type { ApiResponse } from '@/types/api'

export interface ConsumoRecord {
  id: string
  obra_id: string
  item_id: string
  departamento_id: string
  cantidad: number
}

export interface ConsumoValueDto {
  itemId: string
  departamentoId: string
  cantidad: number
}

export interface SaveConsumoDto {
  obraId: string
  valores: ConsumoValueDto[]
}

export const consumoService = {
  getByObra(obraId: string): Promise<ApiResponse<ConsumoRecord[]>> {
    return apiClient.get(`/consumo?obraId=${obraId}`)
  },

  save(dto: SaveConsumoDto): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch('/consumo', dto)
  },
}
