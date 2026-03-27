'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/providers/auth-provider'
import { usersService } from '@/services'
import type { UserListItem, CreateUserResponse, UserRole } from '@/types'
import {
  UserPlus,
  X,
  Loader2,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  Eye,
  UserCheck,
  UserX,
  Search,
} from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador',
  supervisor_almacen: 'Supervisor de Almacén',
  lectura: 'Solo Lectura',
}

const ROLE_COLORS: Record<UserRole, string> = {
  administrador: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  supervisor_almacen: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  lectura: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal crear usuario
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Modal resultado (contraseña temporal)
  const [createdUser, setCreatedUser] = useState<CreateUserResponse | null>(null)
  const [copied, setCopied] = useState(false)

  // Formulario
  const [form, setForm] = useState({
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    email: '',
    telefono: '',
    rol: 'lectura' as UserRole,
  })

  const fetchUsers = useCallback(async () => {
    try {
      const res = await usersService.getAll()
      setUsers(res.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    return (
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      ROLE_LABELS[u.rol].toLowerCase().includes(q)
    )
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)

    try {
      const res = await usersService.create({
        nombres: form.nombres,
        primerApellido: form.primerApellido,
        segundoApellido: form.segundoApellido || undefined,
        email: form.email,
        telefono: form.telefono || undefined,
        rol: form.rol,
      })

      setCreatedUser(res.data)
      setShowCreateModal(false)
      setForm({ nombres: '', primerApellido: '', segundoApellido: '', email: '', telefono: '', rol: 'lectura' })
      fetchUsers()
    } catch (err: any) {
      setCreateError(err?.message || 'Error al crear usuario')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (userId: string) => {
    try {
      await usersService.toggleActive(userId)
      fetchUsers()
    } catch {
      // silently fail
    }
  }

  const handleCopyCredentials = () => {
    if (!createdUser) return
    const text = `Correo: ${createdUser.email}\nContraseña: ${createdUser.temporaryPassword}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Solo admin puede ver esta página
  if (currentUser?.rol !== 'administrador') {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">No tienes acceso a esta sección.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administra los usuarios del sistema
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contraseña</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-accent">
                                {u.nombres.charAt(0)}{u.primerApellido.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{u.nombre}</p>
                              {u.telefono && (
                                <p className="text-xs text-muted-foreground">{u.telefono}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[u.rol]}`}>
                            {ROLE_LABELS[u.rol]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.activo ? 'text-green-400' : 'text-red-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-400' : 'bg-red-400'}`} />
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.debeCambiarPassword ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <Shield className="w-3 h-3" />
                              Temporal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-green-400">
                              <ShieldCheck className="w-3 h-3" />
                              Actualizada
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className="p-1.5 rounded-lg hover:bg-border transition-colors"
                            title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {u.activo ? (
                              <UserX className="w-4 h-4 text-red-400" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-green-400" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((u) => (
                <div key={u.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-accent">
                          {u.nombres.charAt(0)}{u.primerApellido.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{u.nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className="p-1.5 rounded-lg hover:bg-border transition-colors shrink-0"
                    >
                      {u.activo ? (
                        <UserX className="w-4 h-4 text-red-400" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-green-400" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[u.rol]}`}>
                      {ROLE_LABELS[u.rol]}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs ${u.activo ? 'text-green-400' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-400' : 'bg-red-400'}`} />
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {u.debeCambiarPassword ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                        <Shield className="w-3 h-3" /> Temporal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400">
                        <ShieldCheck className="w-3 h-3" /> Actualizada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron usuarios</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Crear Usuario ──────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Nuevo Usuario</h2>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError('') }}
                className="p-1.5 rounded-lg hover:bg-border transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Nombres *</label>
                  <input
                    type="text"
                    value={form.nombres}
                    onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                    required
                    placeholder="Ej: Juan Carlos"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Primer Apellido *</label>
                  <input
                    type="text"
                    value={form.primerApellido}
                    onChange={(e) => setForm({ ...form, primerApellido: e.target.value })}
                    required
                    placeholder="Ej: García"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Segundo Apellido</label>
                  <input
                    type="text"
                    value={form.segundoApellido}
                    onChange={(e) => setForm({ ...form, segundoApellido: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="usuario@araucaria.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Rol *</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value as UserRole })}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  >
                    <option value="lectura">Solo Lectura</option>
                    <option value="supervisor_almacen">Supervisor de Almacén</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateError('') }}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-border/60 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Usuario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Contraseña temporal generada ────────────────────── */}
      {createdUser && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-500" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">Usuario creado correctamente</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta es la contraseña temporal del usuario <strong className="text-foreground">{createdUser.nombre}</strong>.
                  El usuario deberá cambiarla en su primer inicio de sesión.
                </p>
              </div>

              {/* Credentials card */}
              <div className="bg-muted/50 border border-border rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Correo:</p>
                    <p className="text-sm font-mono font-medium text-foreground">{createdUser.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contraseña:</p>
                  <p className="text-lg font-mono font-bold text-foreground tracking-wider">{createdUser.temporaryPassword}</p>
                </div>
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopyCredentials}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado al portapapeles
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar credenciales
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground">
                Se copiará en formato listo para enviar por WhatsApp
              </p>

              <button
                onClick={() => { setCreatedUser(null); setCopied(false) }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
