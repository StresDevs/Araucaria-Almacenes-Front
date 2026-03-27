'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  sectorizacionService,
  type CreateSectorizacionDto,
  type UpdateSectorizacionDto,
  type AddArchivoDto,
} from '@/services'
import { HttpError } from '@/services'
import type { ObraSectorizacion, SectorizacionArchivo } from '@/types'

interface UseSectorizacionState {
  items: ObraSectorizacion[]
  desactivadas: ObraSectorizacion[]
  isLoading: boolean
  error: string | null
}

export function useSectorizacion() {
  const [state, setState] = useState<UseSectorizacionState>({
    items: [],
    desactivadas: [],
    isLoading: true,
    error: null,
  })

  const fetchAll = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const [activas, desact] = await Promise.all([
        sectorizacionService.getAll(),
        sectorizacionService.getDesactivadas(),
      ])
      setState({
        items: activas.data,
        desactivadas: desact.data,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      const message =
        err instanceof HttpError
          ? err.message
          : 'Error al cargar las sectorizaciones'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const getById = useCallback(async (id: string): Promise<ObraSectorizacion | null> => {
    try {
      const res = await sectorizacionService.getById(id)
      return res.data
    } catch {
      return null
    }
  }, [])

  const create = useCallback(
    async (dto: CreateSectorizacionDto): Promise<ObraSectorizacion | null> => {
      try {
        const res = await sectorizacionService.create(dto)
        await fetchAll()
        return res.data
      } catch {
        return null
      }
    },
    [fetchAll],
  )

  const update = useCallback(
    async (id: string, dto: UpdateSectorizacionDto): Promise<boolean> => {
      try {
        await sectorizacionService.update(id, dto)
        await fetchAll()
        return true
      } catch {
        return false
      }
    },
    [fetchAll],
  )

  const toggleActive = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await sectorizacionService.toggleActive(id)
        await fetchAll()
        return true
      } catch {
        return false
      }
    },
    [fetchAll],
  )

  const addArchivo = useCallback(
    async (id: string, dto: AddArchivoDto): Promise<SectorizacionArchivo | null> => {
      try {
        const res = await sectorizacionService.addArchivo(id, dto)
        await fetchAll()
        return res.data
      } catch {
        return null
      }
    },
    [fetchAll],
  )

  const removeArchivo = useCallback(
    async (archivoId: string): Promise<boolean> => {
      try {
        await sectorizacionService.removeArchivo(archivoId)
        await fetchAll()
        return true
      } catch {
        return false
      }
    },
    [fetchAll],
  )

  return {
    items: state.items,
    desactivadas: state.desactivadas,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchAll,
    getById,
    create,
    update,
    toggleActive,
    addArchivo,
    removeArchivo,
  }
}
