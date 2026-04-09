'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/providers/auth-provider'
import { usersService } from '@/services'
import type { UserListItem, CreateUserResponse, ResetPasswordResponse, UserRole } from '@/types'
import {
  UserPlus,
  X,
  Loader2,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Pencil,
  RotateCcw,
  Mail,
  AlertTriangle,
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

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [sinCorreo, setSinCorreo] = useState(false)

  // Result modal (after create / reset password)
  const [createdUser, setCreatedUser] = useState<CreateUserResponse | null>(null)
  const [resetResult, setResetResult] = useState<ResetPasswordResponse | null>(null)
  const [emailSentMessage, setEmailSentMessage] = useState('')
  const [copied, setCopied] = useState(false)

  // Edit user modal (admin)
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [editForm, setEditForm] = useState({ nombres: '', primerApellido: '', segundoApellido: '', email: '', username: '', telefono: '', rol: 'lectura' as UserRole })
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editUsernameAvailable, setEditUsernameAvailable] = useState<boolean | null>(null)
  const editUsernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
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
        email: sinCorreo ? undefined : form.email,
        sinCorreo: sinCorreo || undefined,
        telefono: form.telefono || undefined,
        rol: form.rol,
      })

      if (res.data.email) {
        setEmailSentMessage(`Usuario creado. La contraseña temporal será enviada al correo personal del usuario (${res.data.email}).`)
        setCreatedUser(null)
      } else {
        setCreatedUser(res.data)
        setEmailSentMessage('')
      }

      setShowCreateModal(false)
      setForm({ nombres: '', primerApellido: '', segundoApellido: '', email: '', telefono: '', rol: 'lectura' })
      setSinCorreo(false)
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

  const handleCopyCredentials = (identifier: string, password: string) => {
    const text = identifier.includes('@')
      ? `Correo: ${identifier}\nContraseña: ${password}`
      : `Usuario: ${identifier}\nContraseña: ${password}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Edit user (admin) ─────────────────────────

  const openEditModal = (u: UserListItem) => {
    setEditingUser(u)
    setEditForm({
      nombres: u.nombres,
      primerApellido: u.primerApellido,
      segundoApellido: u.segundoApellido || '',
      email: u.email || '',
      username: u.username || '',
      telefono: u.telefono || '',
      rol: u.rol,
    })
    setEditError('')
    setEditUsernameAvailable(null)
  }

  const checkEditUsername = useCallback((value: string) => {
    if (editUsernameTimerRef.current) clearTimeout(editUsernameTimerRef.current)
    if (!value || value.length < 2) { setEditUsernameAvailable(null); return }
    editUsernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await usersService.checkUsername(value)
        setEditUsernameAvailable(res.data.available)
      } catch { setEditUsernameAvailable(null) }
    }, 400)
  }, [])

  const handleEditSave = async () => {
    if (!editingUser) return
    setEditError('')
    setEditSaving(true)
    try {
      await usersService.update(editingUser.id, {
        nombres: editForm.nombres,
        primerApellido: editForm.primerApellido,
        segundoApellido: editForm.segundoApellido || undefined,
        email: editForm.email || undefined,
        username: editForm.username || undefined,
        telefono: editForm.telefono || undefined,
        rol: editForm.rol,
      })
      setEditingUser(null)
      fetchUsers()
    } catch (err: any) {
      setEditError(err?.message || 'Error al actualizar')
    } finally { setEditSaving(false) }
  }

  // ── Reset password ────────────────────────────

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await usersService.resetPassword(userId)
      if (res.data.email) {
        setEmailSentMessage(`La contraseña ha sido reseteada. La nueva contraseña temporal será enviada al correo del usuario (${res.data.email}).`)
        setResetResult(null)
      } else {
        setResetResult(res.data)
        setEmailSentMessage('')
      }
      fetchUsers()
    } catch {
      // silently fail
    }
  }

  const credentialDisplay = createdUser || resetResult
  const credentialIdentifier = credentialDisplay
    ? (credentialDisplay.email || credentialDisplay.username || '')
    : ''

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
            placeholder="Buscar por nombre, email, usuario o rol..."
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
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Credenciales</th>
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
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {u.email && <p className="text-foreground text-sm truncate">{u.email}</p>}
                            {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                            {!u.email && !u.username && <p className="text-xs text-muted-foreground">—</p>}
                          </div>
                        </td>
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
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg hover:bg-border transition-colors"
                              title="Editar usuario"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(u.id)}
                              className="p-1.5 rounded-lg hover:bg-border transition-colors"
                              title="Resetear contraseña"
                            >
                              <RotateCcw className="w-4 h-4 text-amber-400" />
                            </button>
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
                          </div>
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
                        <p className="text-xs text-muted-foreground truncate">{u.email || (u.username ? `@${u.username}` : '—')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditModal(u)} className="p-1.5 rounded-lg hover:bg-border transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleResetPassword(u.id)} className="p-1.5 rounded-lg hover:bg-border transition-colors">
                        <RotateCcw className="w-4 h-4 text-amber-400" />
                      </button>
                      <button onClick={() => handleToggleActive(u.id)} className="p-1.5 rounded-lg hover:bg-border transition-colors">
                        {u.activo ? <UserX className="w-4 h-4 text-red-400" /> : <UserCheck className="w-4 h-4 text-green-400" />}
                      </button>
                    </div>
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
                onClick={() => { setShowCreateModal(false); setCreateError(''); setSinCorreo(false) }}
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
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sinCorreo}
                      onChange={(e) => {
                        setSinCorreo(e.target.checked)
                        if (e.target.checked) setForm({ ...form, email: '' })
                      }}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-foreground">No se cuenta con un correo electrónico</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email {!sinCorreo && '*'}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required={!sinCorreo}
                    disabled={sinCorreo}
                    placeholder={sinCorreo ? 'Se generará un nombre de usuario automáticamente' : 'usuario@araucaria.com'}
                    className={`w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm ${sinCorreo ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {sinCorreo && form.nombres && form.primerApellido && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Se generará un nombre de usuario como: <span className="font-mono text-accent">{form.nombres.charAt(0).toLowerCase()}.{form.primerApellido.toLowerCase().replace(/[^a-z]/g, '')}</span>
                    </p>
                  )}
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
                  onClick={() => { setShowCreateModal(false); setCreateError(''); setSinCorreo(false) }}
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

      {/* ── Modal: Credenciales generadas (sin email) ──── */}
      {credentialDisplay && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-500" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {createdUser ? 'Usuario creado correctamente' : 'Contraseña reseteada'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {createdUser
                    ? <>Estas son las credenciales del usuario <strong className="text-foreground">{credentialDisplay.nombre}</strong>. El usuario deberá cambiar la contraseña en su primer inicio de sesión.</>
                    : <>La contraseña de <strong className="text-foreground">{credentialDisplay.nombre}</strong> ha sido reseteada.</>
                  }
                </p>
              </div>

              {/* Credentials card */}
              <div className="bg-muted/50 border border-border rounded-xl p-4 text-left space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {credentialDisplay.email ? 'Correo:' : 'Nombre de usuario:'}
                  </p>
                  <p className="text-sm font-mono font-medium text-foreground">{credentialIdentifier}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contraseña temporal:</p>
                  <p className="text-lg font-mono font-bold text-foreground tracking-wider">{credentialDisplay.temporaryPassword}</p>
                </div>
              </div>

              {/* Copy button */}
              <button
                onClick={() => handleCopyCredentials(credentialIdentifier, credentialDisplay.temporaryPassword)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> Copiado al portapapeles</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar credenciales</>
                )}
              </button>
              <p className="text-xs text-muted-foreground">
                Se copiará en formato listo para enviar por WhatsApp
              </p>

              <button
                onClick={() => { setCreatedUser(null); setResetResult(null); setCopied(false) }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Email confirmation (user with email) ──── */}
      {emailSentMessage && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <Mail className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Operación completada</h2>
                <p className="text-sm text-muted-foreground mt-1">{emailSentMessage}</p>
              </div>
              <button
                onClick={() => setEmailSentMessage('')}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Usuario (admin) ──────────────── */}
      {editingUser && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Editar Usuario</h2>
              <button
                onClick={() => { setEditingUser(null); setEditError('') }}
                className="p-1.5 rounded-lg hover:bg-border transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Nombres</label>
                  <input
                    type="text"
                    value={editForm.nombres}
                    onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Primer Apellido</label>
                  <input
                    type="text"
                    value={editForm.primerApellido}
                    onChange={(e) => setEditForm({ ...editForm, primerApellido: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Segundo Apellido</label>
                  <input
                    type="text"
                    value={editForm.segundoApellido}
                    onChange={(e) => setEditForm({ ...editForm, segundoApellido: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Nombre de Usuario</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '')
                      setEditForm({ ...editForm, username: v })
                      checkEditUsername(v)
                    }}
                    placeholder="nombre.usuario"
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      editUsernameAvailable === false ? 'border-red-500' : editUsernameAvailable === true ? 'border-green-500' : 'border-border'
                    }`}
                  />
                  {editUsernameAvailable === false && (
                    <p className="text-xs text-red-500 mt-1">Nombre de usuario no disponible</p>
                  )}
                  {editUsernameAvailable === true && editForm.username.length >= 2 && (
                    <p className="text-xs text-green-500 mt-1">Nombre de usuario disponible</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    value={editForm.telefono}
                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Rol</label>
                  <select
                    value={editForm.rol}
                    onChange={(e) => setEditForm({ ...editForm, rol: e.target.value as UserRole })}
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
                  onClick={() => { setEditingUser(null); setEditError('') }}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-border/60 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving || editUsernameAvailable === false}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {editSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
