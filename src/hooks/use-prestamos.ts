'use client'

import { useState, useEffect, useCallback } from 'react'
import { prestamosService } from '@/services'
import { HttpError } from '@/services'
import type { Prestamo } from '@/types'
import type { GetPrestamosParams, CreatePrestamoDto } from '@/services/endpoints/prestamos.service'

interface UsePrestamosState {
  prestamos: Prestamo[]
  isLoading: boolean
  error: string | null
}

export function usePrestamos(params?: GetPrestamosParams) {
  const [state, setState] = useState<UsePrestamosState>({
    prestamos: [],
    isLoading: true,
    error: null,
  })

  const fetchPrestamos = useCallback(async () => {
    setState((prev: UsePrestamosState) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await prestamosService.getAll(params)
      setState({ prestamos: response.data, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Error al cargar los préstamos'
      setState((prev: UsePrestamosState) => ({ ...prev, isLoading: false, error: message }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchPrestamos()
  }, [fetchPrestamos])

  const createPrestamo = useCallback(async (dto: CreatePrestamoDto): Promise<boolean> => {
    try {
      await prestamosService.create(dto)
      await fetchPrestamos()
      return true
    } catch {
      return false
    }
  }, [fetchPrestamos])

  const markReturned = useCallback(async (id: string): Promise<boolean> => {
    try {
      await prestamosService.markReturned(id)
      await fetchPrestamos()
      return true
    } catch {
      return false
    }
  }, [fetchPrestamos])

  return {
    prestamos: state.prestamos,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchPrestamos,
    createPrestamo,
    markReturned,
  }
}
