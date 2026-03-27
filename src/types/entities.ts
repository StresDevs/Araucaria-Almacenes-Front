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

// ─── Préstamos ────────────────────────────────────────────────────────────────

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
  obra: string
  estado: 'activo' | 'inactivo'
  fecha_registro: string
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
