'use client'

import { useState, useEffect, useCallback } from 'react'
import { almacenesService } from '@/services'
import { HttpError } from '@/services'
import type { Almacen } from '@/types'
import type { CreateAlmacenDto, UpdateAlmacenDto } from '@/services/endpoints/almacenes.service'

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

  const createAlmacen = useCallback(async (dto: CreateAlmacenDto): Promise<boolean> => {
    try {
      await almacenesService.create(dto)
      await fetchAlmacenes()
      return true
    } catch {
      return false
    }
  }, [fetchAlmacenes])

  const updateAlmacen = useCallback(async (id: string, dto: UpdateAlmacenDto): Promise<boolean> => {
    try {
      await almacenesService.update(id, dto)
      await fetchAlmacenes()
      return true
    } catch {
      return false
    }
  }, [fetchAlmacenes])

  const toggleActive = useCallback(async (id: string): Promise<boolean> => {
    try {
      await almacenesService.toggleActive(id)
      await fetchAlmacenes()
      return true
    } catch {
      return false
    }
  }, [fetchAlmacenes])

  const deleteAlmacen = useCallback(async (id: string): Promise<boolean> => {
    try {
      await almacenesService.delete(id)
      await fetchAlmacenes()
      return true
    } catch {
      return false
    }
  }, [fetchAlmacenes])

  return {
    almacenes: state.almacenes,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchAlmacenes,
    createAlmacen,
    updateAlmacen,
    toggleActive,
    deleteAlmacen,
  }
}
