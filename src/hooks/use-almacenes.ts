'use client'

import { useState, useEffect, useCallback } from 'react'
import { almacenesService } from '@/services'
import { HttpError } from '@/services'
import type { Almacen, ItemCatalogo } from '@/types'
import type { GetInventarioParams } from '@/services/endpoints/almacenes.service'

interface UseAlmacenesState {
  almacenes: Almacen[]
  isLoading: boolean
  error: string | null
}

export function useAlmacenes() {
  const [state, setState] = useState<UseAlmacenesState>({
    almacenes: [],
    isLoading: true,
    error: null,
  })

  const fetchAlmacenes = useCallback(async () => {
    setState((prev: UseAlmacenesState) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await almacenesService.getAll()
      setState({ almacenes: response.data, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Error al cargar los almacenes'
      setState((prev: UseAlmacenesState) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [])

  useEffect(() => {
    fetchAlmacenes()
  }, [fetchAlmacenes])

  return {
    almacenes: state.almacenes,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchAlmacenes,
  }
}

interface UseInventarioState {
  items: ItemCatalogo[]
  total: number
  isLoading: boolean
  error: string | null
}

export function useInventario(almacenId: string, params?: GetInventarioParams) {
  const [state, setState] = useState<UseInventarioState>({
    items: [],
    total: 0,
    isLoading: true,
    error: null,
  })

  const fetchInventario = useCallback(async () => {
    if (!almacenId) return
    setState((prev: UseInventarioState) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await almacenesService.getInventario(almacenId, params)
      setState({ items: response.data, total: response.total, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Error al cargar el inventario'
      setState((prev: UseInventarioState) => ({ ...prev, isLoading: false, error: message }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [almacenId])

  useEffect(() => {
    fetchInventario()
  }, [fetchInventario])

  return {
    items: state.items,
    total: state.total,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchInventario,
  }
}
