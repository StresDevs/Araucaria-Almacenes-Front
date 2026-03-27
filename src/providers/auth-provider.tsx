'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AuthUser } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  updateUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ['/login']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Hidratar estado desde localStorage al montar
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser
        setToken(storedToken)
        setUser(parsed)
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  // Redirigir según estado de autenticación
  useEffect(() => {
    if (isLoading) return

    const isPublic = PUBLIC_ROUTES.includes(pathname)

    if (!token && !isPublic) {
      router.replace('/login')
      return
    }

    if (token && user) {
      // Si debe cambiar contraseña, redirigir a esa vista
      if (user.debeCambiarPassword && pathname !== '/cambiar-password') {
        router.replace('/cambiar-password')
        return
      }

      // Si ya cambió contraseña y está en login o cambiar-password, ir al dashboard
      if (!user.debeCambiarPassword && (pathname === '/login' || pathname === '/cambiar-password')) {
        router.replace('/')
        return
      }
    }
  }, [token, user, isLoading, pathname, router])

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setToken(null)
    setUser(null)
    router.replace('/login')
  }, [router])

  const updateUser = useCallback((updated: AuthUser) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated))
    setUser(updated)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
