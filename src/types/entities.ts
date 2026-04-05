// Core domain entities for the Araucaria Almacenes system

// ─── Auth & Usuarios ─────────────────────────────────────────────────────────

export type UserRole = 'administrador' | 'supervisor_almacen' | 'lectura'

export interface AuthUser {
  id: string
  nombre: string
  email: string
  rol: UserRole
  debeCambiarPassword: boolean
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface UserListItem {
  id: string
  nombre: string
  nombres: string
  primerApellido: string
  segundoApellido: string | null
  email: string
  telefono: string | null
  rol: UserRole
  activo: boolean
  debeCambiarPassword: boolean
  createdAt: string
}

export interface CreateUserResponse {
  id: string
  nombre: string
  email: string
  rol: UserRole
  temporaryPassword: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface MetricCard {
  id: string
  title: string
  value: string | number
  icon: string
  trend?: number
}

export interface ActivityLog {
  id: string
  tipo: string
  descripcion: string
  fecha: string
  usuario: string
  obra?: string
}

// ─── Obras ────────────────────────────────────────────────────────────────────

export interface ObraItem {
  id: string
  nombre: string
  estado: 'activa' | 'finalizada'
  ubicacion: string | null
  fecha_inicio: string
  fecha_fin?: string | null
  responsable: string | null
  items_total: number
}

// ─── Inventario ───────────────────────────────────────────────────────────────

export type ItemOrigen = 'importacion_nueva' | 'importacion_antigua' | 'compra_nacional'

export interface ItemUbicacion {
  almacen_id: string
  almacen_nombre: string | null
  cantidad: number
}

export interface ItemInventario {
  id: string
  tipo_origen: ItemOrigen
  categoria_id: string | null
  categoria_nombre: string | null
  item_numero: string | null
  codigo: string
  nombre: string | null
  descripcion: string | null
  unidad: string
  rendimiento: string | null
  proveedor_id: string | null
  proveedor_nombre: string | null
  precio_unitario_bob: number | null
  precio_unitario_usd: number | null
  foto_url: string | null
  stock_total: number
  stock_minimo: number
  activo: boolean
  ubicaciones: ItemUbicacion[]
  created_at: string
  updated_at: string
}

export interface CategoriaItem {
  id: string
  nombre: string
  descripcion: string | null
  created_at?: string
}

export interface ProveedorItem {
  id: string
  nombre: string
  telefono: string | null
  created_at?: string
}

// Legacy types kept for backwards compatibility
export interface InventoryItem {
  id: string
  nombre: string
  categoria: string
  cantidad: number
  ubicacion: string
  estado: 'disponible' | 'en_uso' | 'critico'
}

export interface ItemCatalogo {
  id: string
  codigo_fab: string
  item_contab: string | null
  descripcion: string
  unidad: string
  cantidad: number
  saldo?: number
  rendimiento?: string
  tipo: 'Imp. Nueva' | 'Imp. Antigua'
  almacenes_count: number
  almacen_nombre?: string
}

export interface CartItem {
  id: string
  codigo_fab: string
  descripcion: string
  cantidad: number
  unidad: string
  stock_disponible: number
  tipo: 'Materiales' | 'Herramientas' | 'Indumentaria'
}

// ─── Almacenes ────────────────────────────────────────────────────────────────

export type AlmacenTipo = 'fijo' | 'obra'
export type AlmacenEstado = 'activo' | 'inactivo'

export interface Almacen {
  id: string
  nombre: string
  tipo_almacen: AlmacenTipo
  direccion: string | null
  estado: AlmacenEstado
  items_count: number
  obra_id: string | null
  obra_nombre: string | null
}

// ─── Préstamos / Control de Almacén ───────────────────────────────────────────

export type EstadoPrestamo = 'prestado' | 'devuelto' | 'consumido'

export interface PrestamoRegistro {
  id: string
  item_id: string
  item_codigo: string
  item_nombre: string
  item_descripcion: string
  item_categoria: string
  cantidad: number
  unidad: string
  obra_id: string | null
  obra_nombre: string | null
  seccion: string | null
  persona_prestamo: string
  contratista_id: string | null
  contratista_nombre: string | null
  contratista_empresa: string | null
  estado: EstadoPrestamo
  hora_prestamo: string
  hora_devolucion: string | null
  fecha_devolucion: string | null
  notas: string | null
  registrado_por: string
  created_at: string
  updated_at: string
}

// Keep legacy type for backward compat
export interface Prestamo {
  id: string
  item: string
  obra: string
  fecha_inicio: string
  fecha_vencimiento: string
  estado: 'pendiente' | 'activo' | 'retrasado'
  responsable: string
}

export interface PrestamoIndumentaria {
  id: string
  contratista: string
  empresa: string
  codigo_item: string
  descripcion: string
  cantidad_prestada: number
  fecha_prestamo: string
  almacen: string
  obra: string
  estado: 'activo' | 'vencido' | 'parcial'
  dias_activo: number
}

// ─── Contratistas ─────────────────────────────────────────────────────────────

export interface Contratista {
  id: string
  nombre: string
  empresa: string
  telefono?: string
  obra: string
  estado: 'activo' | 'inactivo'
  fecha_registro: string
}

// ─── Órdenes de Entrega de Material ──────────────────────────────────────────

export interface OrdenEntregaItem {
  id: string
  codigo_fab: string
  descripcion: string
  cantidad: number
  unidad: string
  imagen_url?: string
  categoria: 'Materiales' | 'Herramientas' | 'Indumentaria'
}

export interface OrdenEntrega {
  id: string
  numero_orden: string
  obra_id: string
  obra_nombre: string
  contratista_id: string
  contratista_nombre: string
  contratista_telefono?: string
  tipo_trabajo: string
  titulo: string
  descripcion?: string
  sector: string
  piso: string
  departamento: string
  duracion_dias: number
  items: OrdenEntregaItem[]
  total_items: number
  total_unidades: number
  estado?: string
  fecha_entrega?: string
  creado_por: string
  created_at: string
}

// ─── Movimientos ──────────────────────────────────────────────────────────────

export type TipoMovimiento =
  | 'solicitud_contratista'
  | 'distribucion'
  | 'devolucion_normal'
  | 'devolucion_dano'
  | 'defecto_fabrica'
  | 'traspaso_cierre'

export interface Movimiento {
  id: string
  fecha: string
  tipo: TipoMovimiento
  codigo_item: string
  descripcion_item: string
  almacen_origen: string
  almacen_destino: string
  cantidad: number
  contratista?: string
  motivo?: string
  registrado_por: string
}

export interface DanoDefecto {
  id: string
  tipo: 'dano_contratista' | 'defecto_fabrica'
  codigo_item: string
  descripcion: string
  cantidad: number
  descripcion_problema: string
  fecha_reporte: string
  registrado_por: string
  requiere_reposicion: boolean
  cantidad_reposicion?: number
}

export interface RegistroControlAlmacen {
  id: string
  fecha: string
  item: string
  unidad: string
  ingreso: number | null
  salida: number | null
  saldo: number
  seccion: string
  obra: string
  persona_prestamo: string
  hora_prestamo: string
  hora_devolucion: string | null
  estado: 'prestado' | 'devuelto' | 'pendiente'
}

// ─── Sectorización ────────────────────────────────────────────────────────────

export interface Sector {
  id: string
  nombre: string
  color: string
  numero: number
}

export interface Departamento {
  id: string
  letra: string
  nombre: string
  sector_numero: number
}

export interface Piso {
  id: string
  numero: number
  nombre: string
  departamentos: Departamento[]
}

export interface SectorizacionArchivo {
  id: string
  nombre_original: string
  nombre_archivo: string
  url: string
  mimetype: string
  tamanio: number
  created_at: string
}

export interface ObraSectorizacion {
  id: string
  obra_id: string
  nombre_obra: string | null
  sectores: Sector[]
  pisos: Piso[]
  archivos: SectorizacionArchivo[]
  estado: 'activa' | 'desactivada'
  created_at: string
  updated_at: string
}

// ─── Solicitudes de Aprobación ────────────────────────────────────────────────

export type TipoSolicitudAprobacion =
  | 'baja_producto'
  | 'edicion_stock'
  | 'edicion_inventario'
  | 'transferencia_atrasada'
  | 'entrega_retroactiva'

export type EstadoAprobacion = 'pendiente' | 'aprobada' | 'rechazada'

export interface SolicitudAprobacion {
  id: string
  tipo: TipoSolicitudAprobacion
  titulo: string
  descripcion: string
  solicitante: string
  fecha_solicitud: string
  estado: EstadoAprobacion
  revisado_por?: string
  fecha_revision?: string
  notas_revision?: string
  // Data for baja
  item_codigo?: string
  item_descripcion?: string
  item_cantidad?: number
  motivo_baja?: string
  evidencia_url?: string
  // Data for stock edit
  campo_editado?: string
  valor_anterior?: string
  valor_nuevo?: string
  // Data for inventory edit
  item_id?: string
  justificacion?: string
  cambios_propuestos?: { campo: string; anterior: string; nuevo: string }[]
  update_dto?: Record<string, unknown>
  // Data for transfer
  almacen_origen?: string
  almacen_destino?: string
  fecha_transferencia?: string
  fecha_registro?: string
  items_transferencia?: { codigo: string; descripcion: string; cantidad: number; unidad: string }[]
  // Data for entrega retroactiva
  solicitud_ref_id?: string
  entrega_obra?: string
  entrega_contratista?: string
  entrega_titulo?: string
  entrega_fecha?: string
  entrega_items?: { codigo: string; descripcion: string; cantidad: number; unidad: string }[]
  entrega_total_items?: number
  entrega_total_unidades?: number
}

// ─── Bajas ────────────────────────────────────────────────────────────────────

export type MotivoBaja = 'daño' | 'vencimiento' | 'robo' | 'perdida' | 'obsoleto' | 'defecto_fabrica' | 'otro'

export interface SolicitudBaja {
  id: string
  item_id: string
  item_codigo: string
  item_descripcion: string
  item_categoria: string
  cantidad: number
  motivo: MotivoBaja
  descripcion_motivo: string
  evidencia_url?: string
  evidencia_nombre?: string
  estado: EstadoAprobacion
  solicitante: string
  fecha_solicitud: string
  revisado_por?: string
  fecha_revision?: string
  notas_revision?: string
}
