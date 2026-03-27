'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useAuth } from '@/providers/auth-provider'
import { authService } from '@/services'
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Sun, Moon, CheckCircle2 } from 'lucide-react'

export default function CambiarPasswordPage() {
  const { user, login, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const isValid = hasMinLength && passwordsMatch

  // Password strength
  const strengthScore = [hasMinLength, hasUppercase, hasNumber, passwordsMatch].filter(Boolean).length
  const strengthLabel = strengthScore <= 1 ? 'Débil' : strengthScore <= 2 ? 'Media' : strengthScore <= 3 ? 'Buena' : 'Fuerte'
  const strengthColor = strengthScore <= 1 ? 'bg-destructive' : strengthScore <= 2 ? 'bg-amber-500' : strengthScore <= 3 ? 'bg-accent/70' : 'bg-accent'

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* ── Animated background effects ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Full-screen gradient fade: corners to center */}
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/[0.12] via-transparent to-accent/[0.08]" />
        <div className="absolute inset-0 bg-gradient-to-bl from-accent/[0.10] via-transparent to-transparent" />

        {/* Large green glow - top left */}
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-accent/[0.15] blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />
        {/* Large green glow - bottom right */}
        <div className="absolute -bottom-20 -right-20 w-[420px] h-[420px] rounded-full bg-accent/[0.12] blur-[100px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '3s' }} />
        {/* Medium accent blob - center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-accent/[0.06] blur-[80px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        {/* Extra glow - bottom left */}
        <div className="absolute bottom-[10%] left-[15%] w-64 h-64 rounded-full bg-accent/[0.08] blur-[90px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />

        {/* Grid dots pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-dots-pw" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-dots-pw)" />
        </svg>

        {/* Floating dots */}
        <div className="absolute top-16 right-[20%] w-2.5 h-2.5 rounded-full bg-accent/40 animate-bounce" style={{ animationDuration: '3.5s' }} />
        <div className="absolute top-[55%] left-[12%] w-2 h-2 rounded-full bg-accent/30 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1s' }} />
        <div className="absolute bottom-[25%] right-[8%] w-1.5 h-1.5 rounded-full bg-accent/35 animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '2s' }} />
        <div className="absolute top-[20%] left-[35%] w-1 h-1 rounded-full bg-accent/25 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-card/80 backdrop-blur-sm border border-border hover:bg-accent/10 hover:border-accent/30 transition-all duration-300 group"
        aria-label="Cambiar tema"
      >
        {mounted ? (
          theme === 'dark' ? (
            <Sun className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          )
        ) : (
          <Sun className="w-5 h-5 text-muted-foreground opacity-0" />
        )}
      </button>

      <div className="w-full max-w-md relative z-10">
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl shadow-accent/[0.03] p-6 sm:p-8 overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

          {/* Subtle inner glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-40 bg-accent/[0.06] rounded-full blur-[50px] pointer-events-none" />

          {/* Logo */}
          <div className="flex justify-center mb-4 relative">
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
            <div className="mx-auto w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3 relative">
              <ShieldCheck className="w-7 h-7 text-accent" />
              {/* Pulsing ring around icon */}
              <div className="absolute inset-0 rounded-2xl border border-accent/30 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Actualiza tu contraseña</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Tu contraseña es temporal. Crea una nueva para acceder al sistema.
            </p>
          </div>

          {/* User info chip */}
          {user && (
            <div className="mb-5 p-3 rounded-xl bg-accent/5 border border-accent/15 text-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold text-xs">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Usuario</p>
                <p className="font-medium text-foreground text-sm truncate">{user.email}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1.5">
                Nueva contraseña
              </label>
              <div className={`relative rounded-xl border transition-all duration-300 ${
                focusedField === 'new'
                  ? 'border-accent/60 ring-2 ring-accent/20 shadow-sm shadow-accent/10'
                  : 'border-border hover:border-accent/30'
              }`}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'new' ? 'text-accent' : 'text-muted-foreground'
                  }`} />
                </div>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setFocusedField('new')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition-colors duration-200"
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
              <div className={`relative rounded-xl border transition-all duration-300 ${
                confirmPassword && !passwordsMatch
                  ? 'border-destructive/60 ring-2 ring-destructive/20'
                  : focusedField === 'confirm'
                    ? 'border-accent/60 ring-2 ring-accent/20 shadow-sm shadow-accent/10'
                    : 'border-border hover:border-accent/30'
              }`}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors duration-300 ${
                    confirmPassword && !passwordsMatch
                      ? 'text-destructive'
                      : focusedField === 'confirm' ? 'text-accent' : 'text-muted-foreground'
                  }`} />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Repite la nueva contraseña"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-sm"
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            {/* Password strength bar */}
            {newPassword.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Seguridad de la contraseña</p>
                  <span className={`text-xs font-medium ${
                    strengthScore <= 1 ? 'text-destructive' : strengthScore <= 2 ? 'text-amber-500' : 'text-accent'
                  }`}>{strengthLabel}</span>
                </div>
                <div className="h-1.5 bg-border/50 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-500 ${
                        i <= strengthScore ? strengthColor : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Requirements checklist */}
            <div className="space-y-1.5 bg-border/10 rounded-xl p-3 border border-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Requisitos</p>
              {[
                { met: hasMinLength, label: 'Mínimo 8 caracteres' },
                { met: hasUppercase, label: 'Al menos una mayúscula' },
                { met: hasNumber, label: 'Al menos un número' },
                { met: passwordsMatch, label: 'Las contraseñas coinciden' },
              ].map((req, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                    req.met ? 'bg-accent/15 scale-100' : 'bg-border/50 scale-90'
                  }`}>
                    <CheckCircle2 className={`w-3 h-3 transition-colors duration-300 ${
                      req.met ? 'text-accent' : 'text-muted-foreground/40'
                    }`} />
                  </div>
                  <span className={`transition-colors duration-300 ${req.met ? 'text-accent' : 'text-muted-foreground'}`}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="relative w-full py-2.5 rounded-xl bg-accent text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 overflow-hidden group"
            >
              {/* Button hover shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Actualizar Contraseña
                </>
              )}
            </button>
          </form>

          {/* Cerrar sesión */}
          <div className="mt-5 text-center">
            <button
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-accent transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-accent"
            >
              Cerrar sesión
            </button>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-5">
          Araucaria Construcciones &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
