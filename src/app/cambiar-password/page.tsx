'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/providers/auth-provider'
import { authService } from '@/services'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

export default function CambiarPasswordPage() {
  const { user, login, logout } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordsMatch = newPassword === confirmPassword
  const isValid = newPassword.length >= 8 && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setError('')
    setLoading(true)

    try {
      const response = await authService.changePassword({ newPassword })
      login(response.data.token, response.data.user)
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative w-48 h-20 sm:w-56 sm:h-24">
              <Image
                src="/araucaria-logo.png"
                alt="Araucaria Construcciones"
                fill
                priority
                sizes="(max-width: 640px) 192px, 224px"
                className="object-contain dark:brightness-0 dark:invert"
              />
            </div>
          </div>

          {/* Icon + Title */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Actualiza tu contraseña</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tu contraseña es temporal. Debes crear una nueva contraseña para acceder al sistema.
            </p>
          </div>

          {/* Info del usuario */}
          {user && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border text-sm">
              <span className="text-muted-foreground">Usuario: </span>
              <span className="font-medium text-foreground">{user.email}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                required
                minLength={8}
                autoComplete="new-password"
                className={`w-full px-3 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm ${
                  confirmPassword && !passwordsMatch
                    ? 'border-destructive'
                    : 'border-border'
                }`}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Password strength indicators */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">La contraseña debe cumplir:</p>
              <div className="flex items-center gap-2 text-xs">
                <span className={`inline-block w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-border'}`} />
                <span className={newPassword.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}>
                  Mínimo 8 caracteres
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`inline-block w-2 h-2 rounded-full ${passwordsMatch && confirmPassword ? 'bg-green-500' : 'bg-border'}`} />
                <span className={passwordsMatch && confirmPassword ? 'text-green-500' : 'text-muted-foreground'}>
                  Las contraseñas coinciden
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
          </form>

          {/* Cerrar sesión */}
          <div className="mt-4 text-center">
            <button
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
