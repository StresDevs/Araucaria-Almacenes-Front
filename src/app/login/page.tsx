'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useAuth } from '@/providers/auth-provider'
import { authService } from '@/services'
import { Eye, EyeOff, Loader2, Sun, Moon, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authService.login({ email, password })
      login(response.data.token, response.data.user)
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* ── Animated background effects ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Full-screen gradient fade: corners to center */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.12] via-transparent to-accent/[0.08]" />
        <div className="absolute inset-0 bg-gradient-to-tl from-accent/[0.10] via-transparent to-transparent" />

        {/* Large green glow - top right */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-accent/[0.15] blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        {/* Large green glow - bottom left */}
        <div className="absolute -bottom-20 -left-20 w-[420px] h-[420px] rounded-full bg-accent/[0.12] blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        {/* Medium accent blob - center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-accent/[0.06] blur-[80px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
        {/* Extra glow - top left corner */}
        <div className="absolute -top-10 left-[20%] w-64 h-64 rounded-full bg-accent/[0.08] blur-[90px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '3s' }} />

        {/* Floating grid dots pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-dots)" />
        </svg>

        {/* Floating geometric accents */}
        <div className="absolute top-20 left-[15%] w-2.5 h-2.5 rounded-full bg-accent/40 animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[60%] right-[10%] w-2 h-2 rounded-full bg-accent/30 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-[30%] left-[8%] w-1.5 h-1.5 rounded-full bg-accent/35 animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <div className="absolute top-[15%] right-[30%] w-1 h-1 rounded-full bg-accent/25 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
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
        {/* Card */}
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl shadow-accent/[0.03] p-6 sm:p-8 overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

          {/* Subtle inner glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-40 bg-accent/[0.06] rounded-full blur-[50px] pointer-events-none" />

          {/* Logo */}
          <div className="flex justify-center mb-6 relative">
            <div className="relative w-56 h-24 sm:w-64 sm:h-28">
              <Image
                src="/araucaria-logo.png"
                alt="Araucaria Construcciones"
                fill
                priority
                sizes="(max-width: 640px) 224px, 256px"
                className="object-contain dark:brightness-0 dark:invert"
              />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Sistema de Almacenes
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Correo electrónico
              </label>
              <div className={`relative rounded-xl border transition-all duration-300 ${
                focusedField === 'email'
                  ? 'border-accent/60 ring-2 ring-accent/20 shadow-sm shadow-accent/10'
                  : 'border-border hover:border-accent/30'
              }`}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail className={`w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'email' ? 'text-accent' : 'text-muted-foreground'
                  }`} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="usuario@araucaria.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Contraseña
              </label>
              <div className={`relative rounded-xl border transition-all duration-300 ${
                focusedField === 'password'
                  ? 'border-accent/60 ring-2 ring-accent/20 shadow-sm shadow-accent/10'
                  : 'border-border hover:border-accent/30'
              }`}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'password' ? 'text-accent' : 'text-muted-foreground'
                  }`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition-colors duration-200"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-2.5 rounded-xl bg-accent text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 overflow-hidden group"
            >
              {/* Button hover shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

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
