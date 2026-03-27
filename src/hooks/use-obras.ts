'use client'

import { useState, useEffect, useCallback } from 'react'
import { obrasService, type CreateObraDto, type CloseObraDto } from '@/services'
import { HttpError } from '@/services'
import type { ObraItem } from '@/types'

interface UseObrasState {
  obras: ObraItem[]
  isLoading: boolean
  error: string | null
}

export function useObras() {
  const [state, setState] = useState<UseObrasState>({
    obras: [],
    isLoading: true,
    error: null,
  })

  const fetchObras = useCallback(async () => {
    setState((prev: UseObrasState) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await obrasService.getAll()
      setState({ obras: response.data, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Error al cargar las obras'
      setState((prev: UseObrasState) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [])

  useEffect(() => {
    fetchObras()
  }, [fetchObras])

  const createObra = useCallback(async (dto: CreateObraDto): Promise<boolean> => {
    try {
      await obrasService.create(dto)
      await fetchObras()
      return true
    } catch {
      return false
    }
  }, [fetchObras])

  const closeObra = useCallback(async (obraId: string, dto?: CloseObraDto): Promise<boolean> => {
    try {
      await obrasService.close(obraId, dto)
      await fetchObras()
      return true
    } catch {
      return false
    }
  }, [fetchObras])

  const deleteObra = useCallback(async (id: string): Promise<boolean> => {
    try {
      await obrasService.delete(id)
      await fetchObras()
      return true
    } catch {
      return false
    }
  }, [fetchObras])

  return {
    obras: state.obras,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchObras,
    createObra,
    closeObra,
    deleteObra,
  }
}
