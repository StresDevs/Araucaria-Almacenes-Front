'use client'

import { useState, useEffect, useCallback } from 'react'
import { inventarioService } from '@/services'
import { HttpError } from '@/services'
import type { ItemInventario, ItemOrigen } from '@/types'
import type { CreateItemDto, UpdateItemDto } from '@/services/endpoints/inventario.service'

interface UseInventarioState {
  items: ItemInventario[]
  isLoading: boolean
  error: string | null
}

export function useInventario(tipoOrigen?: ItemOrigen) {
  const [state, setState] = useState<UseInventarioState>({
    items: [],
    isLoading: true,
    error: null,
  })

  const fetchItems = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await inventarioService.getAll(tipoOrigen)
      setState({ items: response.data, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Error al cargar el inventario'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [tipoOrigen])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const createItem = useCallback(async (dto: CreateItemDto): Promise<boolean> => {
    try {
      await inventarioService.create(dto)
      await fetchItems()
      return true
    } catch {
      return false
    }
  }, [fetchItems])

  const updateItem = useCallback(async (id: string, dto: UpdateItemDto): Promise<boolean> => {
    try {
      await inventarioService.update(id, dto)
      await fetchItems()
      return true
    } catch {
      return false
    }
  }, [fetchItems])

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      await inventarioService.delete(id)
      await fetchItems()
      return true
    } catch {
      return false
    }
  }, [fetchItems])

  const uploadFoto = useCallback(async (id: string, file: File): Promise<boolean> => {
    try {
      await inventarioService.uploadFoto(id, file)
      await fetchItems()
      return true
    } catch {
      return false
    }
  }, [fetchItems])

  const setAlmacenStock = useCallback(async (
    itemId: string,
    almacenId: string,
    cantidad: number,
  ): Promise<boolean> => {
    try {
      await inventarioService.setAlmacenStock(itemId, { almacenId, cantidad })
      await fetchItems()
      return true
    } catch {
      return false
    }
  }, [fetchItems])

  return {
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
    uploadFoto,
    setAlmacenStock,
  }
}
