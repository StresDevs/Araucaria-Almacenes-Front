'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import { X, BarChart3, Hammer, Warehouse, Package, FileText, LogOut, ChevronDown, ArrowLeftRight, Trash2, Grid3x3, Users, ShieldCheck, User, Settings, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/providers/auth-provider'
import { usersService } from '@/services'
import type { UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador',
  supervisor_almacen: 'Supervisor',
  lectura: 'Solo Lectura',
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user: currentUser, logout, updateUser } = useAuth()
  const [inventarioOpen, setInventarioOpen] = useState(false)
  const [transferenciaOpen, setTransferenciaOpen] = useState(false)
  const [reportesOpen, setReportesOpen] = useState(false)

  // Popover / profile / logout
  const [showPopover, setShowPopover] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showEditCredentials, setShowEditCredentials] = useState(false)
  const [credForm, setCredForm] = useState({ email: '', username: '' })
  const [credError, setCredError] = useState('')
  const [credSaving, setCredSaving] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close popover on outside click — uses data attribute + closest()
  // instead of a ref, because sidebarContent renders in both desktop and
  // mobile <aside> elements and a single ref would point to only one.
  useEffect(() => {
    if (!showPopover) return
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest?.('[data-popover-area]')) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPopover])

  // Debounced username availability check
  const checkUsername = useCallback((value: string) => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current)
    if (!value || value.length < 2) {
      setUsernameAvailable(null)
      return
    }
    setCheckingUsername(true)
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await usersService.checkUsername(value)
        setUsernameAvailable(res.data.available)
      } catch { setUsernameAvailable(null) }
      finally { setCheckingUsername(false) }
    }, 400)
  }, [])

  const handleOpenEditCredentials = () => {
    setCredForm({
      email: currentUser?.email || '',
      username: currentUser?.username || '',
    })
    setCredError('')
    setUsernameAvailable(null)
    setShowEditCredentials(true)
  }

  const handleSaveCredentials = async () => {
    setCredError('')
    setCredSaving(true)
    try {
      const payload: { email?: string; username?: string } = {}
      if (credForm.email && credForm.email !== (currentUser?.email || '')) payload.email = credForm.email
      if (credForm.username && credForm.username !== (currentUser?.username || '')) payload.username = credForm.username
      if (!payload.email && !payload.username) { setShowEditCredentials(false); return }
      const res = await usersService.updateMyCredentials(payload)
      updateUser({ ...currentUser!, email: res.data.email, username: res.data.username, usernameEditado: res.data.usernameEditado })
      setShowEditCredentials(false)
    } catch (err: any) {
      setCredError(err?.message || 'Error al actualizar')
    } finally { setCredSaving(false) }
  }

  const canEditUsername = !currentUser?.usernameEditado

  const navigation = [
    { name: 'Panel de Control', href: '/', icon: BarChart3 },
    { name: 'Obras', href: '/obras', icon: Hammer },
    { name: 'Almacenes', href: '/almacenes', icon: Warehouse },
    { name: 'Sectorización', href: '/sectorizacion', icon: Grid3x3 },
  ]

  const operaciones = [
    { name: 'Entrega de Material', href: '/solicitudes', icon: FileText },
    { name: 'Control Almacén', href: '/prestamos', icon: Package },
    { name: 'Registro de Bajas', href: '/bajas', icon: Trash2 },
  ]

  const reportesSubmenu = [
    { name: 'Reportes por obras', href: '/reportes/obras' },
    { name: 'Reportes por Material', href: '/reportes/material' },
    { name: 'Reportes por contratista', href: '/reportes/contratista' },
    { name: 'Reporte de Consumo', href: '/reportes/consumo' },
  ]

  const inventarioSubmenu = [
    { name: 'Importación Nueva', href: '/inventario/importacion-nueva' },
    { name: 'Importación Antigua', href: '/inventario/importacion-antigua' },
    { name: 'Compras Nacionales', href: '/inventario/compras-nacionales' },
    { name: 'Categorías', href: '/categorias' },
  ]

  const transferenciaSubmenu = [
    { name: 'Transferencia de Material', href: '/transferencia' },
    { name: 'Historial de Transferencias', href: '/transferencia/historial' },
  ]

  const NavLink = ({ href, icon: Icon, name }: { href: string; icon: any; name: string }) => {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
          isActive
            ? 'bg-accent text-white font-semibold'
            : 'text-foreground hover:bg-border/60'
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{name}</span>
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-border/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Image
              src="/araucaria1.png"
              alt="Araucaria"
              fill
              priority
              sizes="32px"
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">ARAUCARIA</span>
            <p className="text-xs text-muted-foreground">Gestión de Almacenes</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-border transition-colors md:hidden"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Principal</p>
        {navigation.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        <div className="my-2 border-t border-border" />
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operaciones</p>

        {operaciones.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* Reportes Dropdown */}
        <div>
          <button
            onClick={() => setReportesOpen(!reportesOpen)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              reportesOpen ? 'bg-border/60 text-foreground' : 'text-foreground hover:bg-border/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">Reportes</span>
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform ${reportesOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {reportesOpen && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-accent/40 pl-3">
              {reportesSubmenu.map((submenu) => {
                const isActive = pathname === submenu.href
                return (
                  <Link
                    key={submenu.href}
                    href={submenu.href}
                    onClick={onClose}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-accent text-white font-semibold'
                        : 'text-foreground hover:bg-border/60'
                    }`}
                  >
                    <span className="truncate">{submenu.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Inventario Dropdown */}
        <div>
          <button
            onClick={() => setInventarioOpen(!inventarioOpen)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              inventarioOpen ? 'bg-border/60 text-foreground' : 'text-foreground hover:bg-border/60'
            }`}
          >
            <Package className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">Inventario</span>
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform ${inventarioOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {inventarioOpen && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-accent/40 pl-3">
              {inventarioSubmenu.map((submenu) => {
                const isActive = pathname === submenu.href
                return (
                  <Link
                    key={submenu.href}
                    href={submenu.href}
                    onClick={onClose}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-accent text-white font-semibold'
                        : 'text-foreground hover:bg-border/60'
                    }`}
                  >
                    <span className="truncate">{submenu.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Gestión de Usuarios — solo admin */}
        {currentUser?.rol === 'administrador' && (
          <>
            <div className="my-2 border-t border-border" />
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administración</p>
            <NavLink href="/usuarios" icon={Users} name="Gestión de Usuarios" />
            <NavLink href="/aprobaciones" icon={ShieldCheck} name="Solicitud Aprobaciones" />
          </>
        )}

        {/* Transferencia Dropdown */}
        <div>
          <button
            onClick={() => setTransferenciaOpen(!transferenciaOpen)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              transferenciaOpen ? 'bg-border/60 text-foreground' : 'text-foreground hover:bg-border/60'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">Transferencia</span>
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform ${transferenciaOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {transferenciaOpen && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-accent/40 pl-3">
              {transferenciaSubmenu.map((submenu) => {
                const isActive = pathname === submenu.href
                return (
                  <Link
                    key={submenu.href}
                    href={submenu.href}
                    onClick={onClose}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-accent text-white font-semibold'
                        : 'text-foreground hover:bg-border/60'
                    }`}
                  >
                    <span className="truncate">{submenu.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Info + Profile Popover */}
      <div className="p-3 border-t border-border relative" data-popover-area>
        <button
          onClick={() => setShowPopover(!showPopover)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-border/30 hover:bg-border/50 transition-colors w-full text-left"
        >
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-accent">
              {currentUser?.nombre?.split(' ').slice(0, 2).map(n => n[0]).join('') || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {currentUser?.nombres
                ? `${currentUser.nombres} ${currentUser.primerApellido}`
                : currentUser?.nombre || 'Usuario'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentUser ? ROLE_LABELS[currentUser.rol] : 'Sesión activa'}
            </p>
          </div>
        </button>

        {/* Popover */}
        {showPopover && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <button
              onClick={() => { setShowPopover(false); setShowProfile(true) }}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm text-foreground hover:bg-border/50 transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              Perfil
            </button>
            <div className="border-t border-border" />
            <button
              onClick={() => { setShowPopover(false); setShowLogoutConfirm(true) }}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col h-screen bg-card border-r border-border">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 max-w-[85vw] bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ── Modal: Confirmar cierre de sesión ──── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">¿Cerrar sesión?</h3>
              <p className="text-sm text-muted-foreground mt-1">¿Estás seguro de que quieres cerrar sesión?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-border/60 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { logout(); onClose() }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Perfil de usuario ──── */}
      {showProfile && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Mi Perfil</h2>
              <button onClick={() => { setShowProfile(false); setShowEditCredentials(false) }} className="p-1.5 rounded-lg hover:bg-border transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Name + Role */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-bold text-accent">
                    {currentUser?.nombre?.split(' ').slice(0, 2).map(n => n[0]).join('') || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{currentUser?.nombre}</p>
                  <span className="text-xs text-muted-foreground">{currentUser ? ROLE_LABELS[currentUser.rol] : ''}</span>
                </div>
              </div>

              {/* Credentials section */}
              <div className="space-y-3 bg-muted/30 rounded-xl p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Correo electrónico</p>
                  <p className="text-sm font-medium text-foreground">{currentUser?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nombre de usuario</p>
                  <p className="text-sm font-medium text-foreground">{currentUser?.username || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contraseña</p>
                  <p className="text-sm font-medium text-foreground tracking-widest">••••••••</p>
                </div>

                {!showEditCredentials ? (
                  <button
                    onClick={handleOpenEditCredentials}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-border/60 transition-colors w-full justify-center"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Editar credenciales
                  </button>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-border">
                    {credError && (
                      <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">{credError}</div>
                    )}

                    {/* Email field */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Correo electrónico</label>
                      <input
                        type="email"
                        value={credForm.email}
                        onChange={(e) => setCredForm({ ...credForm, email: e.target.value })}
                        placeholder="email@ejemplo.com"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {/* Username field */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Nombre de usuario</label>
                      {canEditUsername ? (
                        <>
                          {!currentUser?.username && (
                            <div className="flex items-center gap-1.5 mb-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              <p className="text-xs text-amber-500">Solo tienes 1 intento para registrar tu nombre de usuario. Después no podrás editarlo.</p>
                            </div>
                          )}
                          <input
                            type="text"
                            value={credForm.username}
                            onChange={(e) => {
                              const v = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '')
                              setCredForm({ ...credForm, username: v })
                              checkUsername(v)
                            }}
                            placeholder="nombre.usuario"
                            className={`w-full px-3 py-2 rounded-lg border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                              usernameAvailable === false ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : 'border-border'
                            }`}
                          />
                          {usernameAvailable === false && (
                            <p className="text-xs text-red-500 mt-1">Nombre de usuario no disponible, intente con otro diferente</p>
                          )}
                          {usernameAvailable === true && credForm.username.length >= 2 && (
                            <p className="text-xs text-green-500 mt-1">Nombre de usuario disponible</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">{currentUser?.username} <span className="text-xs">(no editable)</span></p>
                      )}
                    </div>

                    {/* Password — read-only */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Contraseña</label>
                      <p className="text-xs text-muted-foreground italic">Solicita al administrador que actualice tu contraseña.</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setShowEditCredentials(false)} className="flex-1 px-3 py-2 rounded-lg border border-border text-sm hover:bg-border/60 transition-colors">Cancelar</button>
                      <button
                        onClick={handleSaveCredentials}
                        disabled={credSaving || usernameAvailable === false}
                        className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {credSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
