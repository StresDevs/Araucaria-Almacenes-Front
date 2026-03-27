'use client'

import { Warehouse, User, Settings, Moon, Sun, Menu, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'

interface TopBarProps {
  onMenuToggle: () => void
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const { user: currentUser, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-3 md:px-6 shrink-0">
      {/* Left: hamburger (mobile) + warehouse info */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-border rounded-lg transition-colors md:hidden shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Warehouse className="w-4 h-4 text-accent shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground hidden sm:block">Almacén Actual</p>
            <p className="text-sm font-medium text-foreground truncate">Almacén Central</p>
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-border rounded-lg transition-colors"
          title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          className="p-2 hover:bg-border rounded-lg transition-colors hidden sm:flex"
          aria-label="Configuración"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          className="p-2 hover:bg-border rounded-lg transition-colors"
          aria-label="Perfil de usuario"
          title={currentUser?.nombre || 'Usuario'}
        >
          <User className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={logout}
          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors hidden sm:flex"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
