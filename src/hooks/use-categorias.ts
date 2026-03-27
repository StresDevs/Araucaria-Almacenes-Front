'use client'

import { useState, useEffect, useCallback } from 'react'
import { categoriasService, HttpError } from '@/services'
import type { CategoriaItem } from '@/types'

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await categoriasService.getAll()
      setCategorias(res.data)
    } catch (err) {
      console.error('Error al cargar categorías', err instanceof HttpError ? err.message : err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { categorias, isLoading, refetch: fetch }
}
