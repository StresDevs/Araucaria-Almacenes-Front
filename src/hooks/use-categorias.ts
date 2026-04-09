'use client'

import { useState, useEffect, useCallback } from 'react'
import { categoriasService, HttpError } from '@/services'
import type { CreateCategoriaDto, UpdateCategoriaDto } from '@/services'
import type { CategoriaItem } from '@/types'

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await categoriasService.getAll()
      setCategorias(res.data)
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al cargar categorías'
      setError(msg)
      console.error('Error al cargar categorías', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createCategoria = useCallback(async (dto: CreateCategoriaDto): Promise<boolean> => {
    try {
      await categoriasService.create(dto)
      await fetch()
      return true
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al crear categoría'
      setError(msg)
      return false
    }
  }, [fetch])

  const updateCategoria = useCallback(async (id: string, dto: UpdateCategoriaDto): Promise<boolean> => {
    try {
      await categoriasService.update(id, dto)
      await fetch()
      return true
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al actualizar categoría'
      setError(msg)
      return false
    }
  }, [fetch])

  const deleteCategoria = useCallback(async (id: string): Promise<boolean> => {
    try {
      await categoriasService.delete(id)
      await fetch()
      return true
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : 'Error al eliminar categoría'
      setError(msg)
      return false
    }
  }, [fetch])

  return { categorias, isLoading, error, refetch: fetch, createCategoria, updateCategoria, deleteCategoria }
}
