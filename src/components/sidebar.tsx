'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { X, BarChart3, Hammer, Warehouse, Package, FileText, LogOut, ChevronDown, ArrowLeftRight, Trash2, Grid3x3, Users, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/providers/auth-provider'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user: currentUser, logout } = useAuth()
  const [inventarioOpen, setInventarioOpen] = useState(false)
  const [transferenciaOpen, setTransferenciaOpen] = useState(false)
  const [reportesOpen, setReportesOpen] = useState(false)

  const navigation = [
    { name: 'Panel de Control', href: '/', icon: BarChart3 },
    { name: 'Obras', href: '/obras', icon: Hammer },
    { name: 'Almacenes', href: '/almacenes', icon: Warehouse },
    { name: 'Sectorización', href: '/sectorizacion', icon: Grid3x3 },
  ]

  const operaciones = [
    { name: 'Entrega de Material', href: '/solicitudes', icon: FileText },
    { name: 'Devoluciones', href: '/devoluciones', icon: LogOut },
    { name: 'Préstamos', href: '/prestamos', icon: Package },
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

      {/* User Info + Logout */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-border/30">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-accent">
              {currentUser?.nombre?.split(' ').slice(0, 2).map(n => n[0]).join('') || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{currentUser?.nombre || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser?.email || 'Sesión activa'}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); onClose() }}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
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
    </>
  )
}
