// Core domain entities for the Araucaria Almacenes system

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
  ubicacion: string
  fecha_inicio: string
  fecha_fin?: string
  responsable: string
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

export interface Almacen {
  id: string
  nombre: string
  tipo: string
  responsable: string
  estado: 'ACTIVO' | 'INACTIVO'
  items_count: number
  obra?: string
  border_color?: 'teal' | 'amber'
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
  letra: string
  sector_id: string
}

export interface Piso {
  id: string
  numero: string
  nombre: string
  departamentos: Departamento[]
}

export interface ObraSectorizacion {
  id: string
  obraId: string
  nombre_obra: string
  sectores: Sector[]
  pisos: Piso[]
  estado: 'en_construccion' | 'completada'
  created_at: string
  updated_at: string
}
