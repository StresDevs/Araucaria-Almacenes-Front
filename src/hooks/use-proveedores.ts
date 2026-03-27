'use client'

import { useState, useEffect, useCallback } from 'react'
import { proveedoresService, HttpError } from '@/services'
import type { ProveedorItem } from '@/types'

export function useProveedores() {
  const [proveedores, setProveedores] = useState<ProveedorItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await proveedoresService.getAll()
      setProveedores(res.data)
    } catch (err) {
      console.error('Error al cargar proveedores', err instanceof HttpError ? err.message : err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { proveedores, isLoading, refetch: fetch }
}
