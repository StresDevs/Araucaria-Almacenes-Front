// Datos mock del sistema ARAUCARIA ALMACENES

export interface MetricCard {
  id: string
  title: string
  value: string | number
  icon: string
  trend?: number
}

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

export interface InventoryItem {
  id: string
  nombre: string
  categoria: string
  cantidad: number
  ubicacion: string
  estado: 'disponible' | 'en_uso' | 'critico'
}

export interface ActivityLog {
  id: string
  tipo: string
  descripcion: string
  fecha: string
  usuario: string
  obra?: string
}

export interface Prestamo {
  id: string
  item: string
  obra: string
  fecha_inicio: string
  fecha_vencimiento: string
  estado: 'pendiente' | 'activo' | 'retrasado'
  responsable: string
}

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

export const MOCK_METRICS: MetricCard[] = [
  { id: '1', title: 'Items Totales', value: '2,847', icon: 'box', trend: 12 },
  { id: '2', title: 'Almacenes', value: '8', icon: 'warehouse', trend: 0 },
  { id: '3', title: 'Obras Activas', value: '12', icon: 'hard-hat', trend: -2 },
  { id: '4', title: 'Préstamos Activos', value: '156', icon: 'link-2', trend: 8 },
  { id: '5', title: 'Movimientos', value: '324', icon: 'arrow-right', trend: 35 },
  { id: '6', title: 'Stock Crítico', value: '14', icon: 'alert-circle', trend: -3 },
]

export const MOCK_OBRAS: ObraItem[] = [
  {
    id: 'obra-001',
    nombre: 'Torre Ejecutiva Centro',
    estado: 'activa',
    ubicacion: 'Centro, Avenida Principal 500',
    fecha_inicio: '2024-01-15',
    responsable: 'Juan García',
    items_total: 342,
  },
  {
    id: 'obra-002',
    nombre: 'Complejo Residencial Las Lomas',
    estado: 'activa',
    ubicacion: 'Las Lomas, Calle Eucalipto 200',
    fecha_inicio: '2024-02-01',
    responsable: 'María Rodríguez',
    items_total: 521,
  },
  {
    id: 'obra-003',
    nombre: 'Centro Comercial Mall Occidente',
    estado: 'activa',
    ubicacion: 'Zona Occidente, Carretera Oeste km 5',
    fecha_inicio: '2024-01-20',
    responsable: 'Carlos López',
    items_total: 428,
  },
  {
    id: 'obra-004',
    nombre: 'Edificio Administrativo Municipal',
    estado: 'finalizada',
    ubicacion: 'Centro Cívico, Calle Libertad 100',
    fecha_inicio: '2023-06-10',
    fecha_fin: '2023-12-15',
    responsable: 'Pedro Martínez',
    items_total: 287,
  },
  {
    id: 'obra-005',
    nombre: 'Puente Vehicular Norte',
    estado: 'activa',
    ubicacion: 'Zona Norte, Acceso Metropolitano',
    fecha_inicio: '2023-11-05',
    responsable: 'Roberto Sánchez',
    items_total: 612,
  },
]

export const MOCK_ACTIVITY: ActivityLog[] = [
  {
    id: '1',
    tipo: 'entrada',
    descripcion: 'Recepción de 50 sacos de cemento',
    fecha: '2024-03-13 14:30',
    usuario: 'Juan García',
    obra: 'Torre Ejecutiva Centro',
  },
  {
    id: '2',
    tipo: 'salida',
    descripcion: 'Despacho de andamios para obra',
    fecha: '2024-03-13 12:15',
    usuario: 'María Rodríguez',
    obra: 'Complejo Residencial Las Lomas',
  },
  {
    id: '3',
    tipo: 'devolucion',
    descripcion: 'Retorno de herramientas de excavación',
    fecha: '2024-03-12 16:45',
    usuario: 'Carlos López',
    obra: 'Centro Comercial Mall Occidente',
  },
  {
    id: '4',
    tipo: 'entrada',
    descripcion: 'Compra de acero corrugado grado 60',
    fecha: '2024-03-12 09:20',
    usuario: 'Sistema',
    obra: undefined,
  },
  {
    id: '5',
    tipo: 'salida',
    descripcion: 'Despacho de tuberías PVC',
    fecha: '2024-03-11 15:30',
    usuario: 'Pedro Martínez',
    obra: 'Puente Vehicular Norte',
  },
]

export const MOCK_PRESTAMOS: Prestamo[] = [
  {
    id: 'p-001',
    item: 'Retroexcavadora CAT 320',
    obra: 'Centro Comercial Mall Occidente',
    fecha_inicio: '2024-03-01',
    fecha_vencimiento: '2024-03-20',
    estado: 'activo',
    responsable: 'Carlos López',
  },
  {
    id: 'p-002',
    item: 'Grúa Torre 60 toneladas',
    obra: 'Torre Ejecutiva Centro',
    fecha_inicio: '2024-02-15',
    fecha_vencimiento: '2024-03-15',
    estado: 'activo',
    responsable: 'Juan García',
  },
  {
    id: 'p-003',
    item: 'Compresora Industrial',
    obra: 'Complejo Residencial Las Lomas',
    fecha_inicio: '2024-03-05',
    fecha_vencimiento: '2024-03-18',
    estado: 'activo',
    responsable: 'María Rodríguez',
  },
  {
    id: 'p-004',
    item: 'Soldadora Lincoln Electric',
    obra: 'Puente Vehicular Norte',
    fecha_inicio: '2024-02-20',
    fecha_vencimiento: '2024-03-05',
    estado: 'retrasado',
    responsable: 'Roberto Sánchez',
  },
  {
    id: 'p-005',
    item: 'Andamios metálicos (50 unidades)',
    obra: 'Torre Ejecutiva Centro',
    fecha_inicio: '2024-03-10',
    fecha_vencimiento: '2024-03-25',
    estado: 'pendiente',
    responsable: 'Juan García',
  },
]

export const INVENTORY_CATEGORIES = [
  'Herramientas',
  'Maquinaria Pesada',
  'Materiales',
  'Equipo Protección',
  'Andamios',
  'Transporte',
]

export const WAREHOUSE_LOCATIONS = [
  'Almacén Central',
  'Zona Norte',
  'Zona Sur',
  'Zona Este',
  'Zona Oeste',
  'Bodega Secundaria A',
  'Bodega Secundaria B',
  'Bodega Secundaria C',
]

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

export const MOCK_ALMACENES_EXTERNOS: Almacen[] = [
  {
    id: 'alm-ext-001',
    nombre: 'Almacén Anaya',
    tipo: 'Importaciones',
    responsable: 'Ing. Rodríguez',
    estado: 'ACTIVO',
    items_count: 234,
    border_color: 'teal',
  },
  {
    id: 'alm-ext-002',
    nombre: 'Almacén Las Islas',
    tipo: 'Importaciones',
    responsable: 'Ing. Méndez',
    estado: 'ACTIVO',
    items_count: 187,
    border_color: 'teal',
  },
  {
    id: 'alm-ext-003',
    nombre: 'Almacén Panamericana',
    tipo: 'Maquinaria y equipo',
    responsable: 'Ing. Torres',
    estado: 'ACTIVO',
    items_count: 89,
    border_color: 'teal',
  },
]

export const MOCK_ALMACENES_OBRA: Almacen[] = [
  {
    id: 'alm-obra-001',
    nombre: 'Compras Menores',
    tipo: 'Insumos, herramientas, materiales',
    responsable: 'Ing. García',
    estado: 'ACTIVO',
    items_count: 156,
    obra: 'Torre Anaya',
    border_color: 'amber',
  },
  {
    id: 'alm-obra-002',
    nombre: 'Compras Mayores',
    tipo: 'Insumos, materiales',
    responsable: 'Ing. García',
    estado: 'ACTIVO',
    items_count: 89,
    obra: 'Torre Anaya',
    border_color: 'amber',
  },
  {
    id: 'alm-obra-003',
    nombre: 'Sótano',
    tipo: 'Importaciones',
    responsable: 'Ing. García',
    estado: 'ACTIVO',
    items_count: 42,
    obra: 'Torre Anaya',
    border_color: 'amber',
  },
  {
    id: 'alm-obra-004',
    nombre: 'Compras Menores',
    tipo: 'Insumos, herramientas, materiales',
    responsable: 'Ing. López',
    estado: 'ACTIVO',
    items_count: 201,
    obra: 'Edif. Panamericana Norte',
    border_color: 'amber',
  },
  {
    id: 'alm-obra-005',
    nombre: 'Compras Mayores',
    tipo: 'Insumos, materiales',
    responsable: 'Ing. López',
    estado: 'ACTIVO',
    items_count: 134,
    obra: 'Edif. Panamericana Norte',
    border_color: 'amber',
  },
  {
    id: 'alm-obra-006',
    nombre: 'Sótano',
    tipo: 'Importaciones',
    responsable: 'Ing. López',
    estado: 'ACTIVO',
    items_count: 67,
    obra: 'Edif. Panamericana Norte',
    border_color: 'amber',
  },
]

export const MOCK_ITEMS_CATALOGO: ItemCatalogo[] = [
  {
    id: 'item-001',
    codigo_fab: 'SKF-6205-2RS',
    item_contab: 'IMP-2024-001',
    descripcion: 'Rodamiento de bolas profundo SKF 6205-2RS',
    unidad: 'Pieza',
    cantidad: 142,
    saldo: 8,
    rendimiento: '—',
    tipo: 'Imp. Nueva',
    almacenes_count: 3,
  },
  {
    id: 'item-002',
    codigo_fab: 'CEMENTO-GR-50KG',
    item_contab: 'MAT-2024-002',
    descripcion: 'Cemento gris Portland tipo I bolsa 50kg',
    unidad: 'Bolsa',
    cantidad: 2340,
    saldo: 1200,
    rendimiento: '1 bolsa/6m²',
    tipo: 'Imp. Nueva',
    almacenes_count: 5,
  },
  {
    id: 'item-003',
    codigo_fab: 'ACERO-CORR-60-8MM',
    item_contab: null,
    descripcion: 'Acero corrugado grado 60 diámetro 8mm',
    unidad: 'Kilogramo',
    cantidad: 4560,
    saldo: 2100,
    rendimiento: '—',
    tipo: 'Imp. Antigua',
    almacenes_count: 4,
  },
  {
    id: 'item-004',
    codigo_fab: 'HILTI-TE-30',
    item_contab: 'HER-2024-004',
    descripcion: 'Taladro perforador Hilti TE 30 rotomartillo',
    unidad: 'Pieza',
    cantidad: 12,
    saldo: 3,
    rendimiento: '—',
    tipo: 'Imp. Nueva',
    almacenes_count: 2,
  },
  {
    id: 'item-005',
    codigo_fab: 'TUBING-PVC-2INCH',
    item_contab: 'MAT-2024-005',
    descripcion: 'Tubería PVC schedula 40 diámetro 2 pulgadas',
    unidad: 'Metro',
    cantidad: 1200,
    saldo: 450,
    rendimiento: '—',
    tipo: 'Imp. Nueva',
    almacenes_count: 3,
  },
  {
    id: 'item-006',
    codigo_fab: 'ANDAMIO-METAL-STD',
    item_contab: null,
    descripcion: 'Andamio metálico estándar 2.0m x 1.2m',
    unidad: 'Pieza',
    cantidad: 234,
    saldo: 89,
    rendimiento: '—',
    tipo: 'Imp. Antigua',
    almacenes_count: 6,
  },
  {
    id: 'item-007',
    codigo_fab: 'SOLDADURA-AWS-E7018',
    item_contab: 'INS-2024-007',
    descripcion: 'Electrodo de soldadura AWS A5.1 E7018 diámetro 3/32"',
    unidad: 'Caja',
    cantidad: 456,
    saldo: 120,
    rendimiento: '—',
    tipo: 'Imp. Nueva',
    almacenes_count: 2,
  },
  {
    id: 'item-008',
    codigo_fab: 'PINTURA-LATEX-GAL',
    item_contab: 'MAT-2024-008',
    descripcion: 'Pintura látex blanca galón 3.78L',
    unidad: 'Galón',
    cantidad: 567,
    saldo: 234,
    rendimiento: '1 galón/15m²',
    tipo: 'Imp. Nueva',
    almacenes_count: 4,
  },
]

export const UNIDADES = [
  'Pieza',
  'Caja',
  'Bolsa',
  'Metro',
  'Metro²',
  'Litro',
  'Kilogramo',
  'Juego',
  'Par',
  'Rollo',
  'Galón',
]

// Contractor and material movement interfaces
export interface Contratista {
  id: string
  nombre: string
  empresa: string
  obra: string
  estado: 'activo' | 'inactivo'
  fecha_registro: string
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

export interface Movimiento {
  id: string
  fecha: string
  tipo: 'solicitud_contratista' | 'distribucion' | 'devolucion_normal' | 'devolucion_dano' | 'defecto_fabrica' | 'traspaso_cierre'
  codigo_item: string
  descripcion_item: string
  almacen_origen: string
  almacen_destino: string
  cantidad: number
  contratista?: string
  motivo?: string
  registrado_por: string
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

// Mock Contractors
export const MOCK_CONTRATISTAS: Contratista[] = [
  {
    id: 'c-001',
    nombre: 'José García López',
    empresa: 'Constructora García S.A.',
    obra: 'Torre Ejecutiva Centro',
    estado: 'activo',
    fecha_registro: '2024-01-15',
  },
  {
    id: 'c-002',
    nombre: 'Carlos Mendoza Ruiz',
    empresa: 'Obras y Servicios Mendoza',
    obra: 'Complejo Residencial Las Lomas',
    estado: 'activo',
    fecha_registro: '2024-02-01',
  },
  {
    id: 'c-003',
    nombre: 'Fernando Rodríguez Silva',
    empresa: 'Constructora Rápido',
    obra: 'Centro Comercial Mall Occidente',
    estado: 'activo',
    fecha_registro: '2024-01-20',
  },
  {
    id: 'c-004',
    nombre: 'David Sánchez Toro',
    empresa: 'Edificaciones Sánchez',
    obra: 'Puente Vehicular Norte',
    estado: 'activo',
    fecha_registro: '2023-11-05',
  },
  {
    id: 'c-005',
    nombre: 'Roberto Flores García',
    empresa: 'Obras Permanentes Flores',
    obra: 'Torre Ejecutiva Centro',
    estado: 'activo',
    fecha_registro: '2024-02-10',
  },
]

// Mock movements for auditing
export const MOCK_MOVIMIENTOS: Movimiento[] = [
  {
    id: 'mov-001',
    fecha: '2024-03-13 14:30',
    tipo: 'solicitud_contratista',
    codigo_item: 'SKF-6205-2RS',
    descripcion_item: 'Rodamiento de bolas profundo SKF 6205-2RS',
    almacen_origen: 'Almacén Central',
    almacen_destino: 'Torre Ejecutiva Centro - Compras Menores',
    cantidad: 5,
    contratista: 'José García López',
    registrado_por: 'Ing. Juan García',
  },
  {
    id: 'mov-002',
    fecha: '2024-03-13 12:15',
    tipo: 'distribucion',
    codigo_item: 'CEMENTO-GR-50KG',
    descripcion_item: 'Cemento gris Portland tipo I bolsa 50kg',
    almacen_origen: 'Almacén Anaya',
    almacen_destino: 'Torre Ejecutiva Centro - Compras Mayores',
    cantidad: 100,
    motivo: 'Reabastecimiento regular',
    registrado_por: 'Ing. Juan García',
  },
  {
    id: 'mov-003',
    fecha: '2024-03-12 16:45',
    tipo: 'devolucion_normal',
    codigo_item: 'ANDAMIO-METAL-STD',
    descripcion_item: 'Andamio metálico estándar 2.0m x 1.2m',
    almacen_origen: 'Torre Ejecutiva Centro - Compras Menores',
    almacen_destino: 'Almacén Central',
    cantidad: 8,
    contratista: 'Carlos Mendoza Ruiz',
    registrado_por: 'Ing. Juan García',
  },
  {
    id: 'mov-004',
    fecha: '2024-03-12 09:20',
    tipo: 'defecto_fabrica',
    codigo_item: 'SOLDADURA-AWS-E7018',
    descripcion_item: 'Electrodo de soldadura AWS A5.1 E7018 diámetro 3/32"',
    almacen_origen: 'Almacén Central',
    almacen_destino: 'Rechazo',
    cantidad: 10,
    motivo: 'Cajas defectuosas en llegada - cobres oxidados',
    registrado_por: 'Ing. Juan García',
  },
  {
    id: 'mov-005',
    fecha: '2024-03-11 15:30',
    tipo: 'solicitud_contratista',
    codigo_item: 'PINTURA-LATEX-GAL',
    descripcion_item: 'Pintura látex blanca galón 3.78L',
    almacen_origen: 'Almacén Central',
    almacen_destino: 'Centro Comercial Mall Occidente - Compras Menores',
    cantidad: 12,
    contratista: 'Fernando Rodríguez Silva',
    registrado_por: 'Ing. Carlos López',
  },
  {
    id: 'mov-006',
    fecha: '2024-03-11 10:00',
    tipo: 'devolucion_dano',
    codigo_item: 'HILTI-TE-30',
    descripcion_item: 'Taladro perforador Hilti TE 30 rotomartillo',
    almacen_origen: 'Centro Comercial Mall Occidente - Compras Menores',
    almacen_destino: 'Almacén Central',
    cantidad: 1,
    motivo: 'Pantalla LCD dañada por caída - se autorizó reposición',
    registrado_por: 'Ing. Carlos López',
  },
  {
    id: 'mov-007',
    fecha: '2024-03-10 14:00',
    tipo: 'traspaso_cierre',
    codigo_item: 'ACERO-CORR-60-8MM',
    descripcion_item: 'Acero corrugado grado 60 diámetro 8mm',
    almacen_origen: 'Centro Comercial Mall Occidente - Compras Mayores',
    almacen_destino: 'Almacén Panamericana',
    cantidad: 450,
    motivo: 'Cierre de obra - traspaso de saldos',
    registrado_por: 'Ing. Carlos López',
  },
]

// Registro de Control de Almacén (formato tipo tabla manual)
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

export const MOCK_CONTROL_ALMACEN: RegistroControlAlmacen[] = [
  {
    id: 'reg-001',
    fecha: '13-3-26',
    item: 'Guante largo',
    unidad: 'PAR',
    ingreso: null,
    salida: 1,
    saldo: 24,
    seccion: 'Ravagt',
    obra: 'Torre Anaya',
    persona_prestamo: 'Carlos Méndez',
    hora_prestamo: '08:30',
    hora_devolucion: null,
    estado: 'prestado',
  },
  {
    id: 'reg-002',
    fecha: '13-3-26',
    item: 'Broca 8mm concreto',
    unidad: 'PZA',
    ingreso: null,
    salida: 1,
    saldo: 15,
    seccion: 'Post V.',
    obra: 'P.P',
    persona_prestamo: 'Juan Pérez',
    hora_prestamo: '09:15',
    hora_devolucion: '14:30',
    estado: 'devuelto',
  },
  {
    id: 'reg-003',
    fecha: '13-3-26',
    item: 'Broca 12mm concreto Brocacentro 7',
    unidad: 'PZA',
    ingreso: null,
    salida: 1,
    saldo: 8,
    seccion: 'Post V.',
    obra: 'P.P',
    persona_prestamo: 'P. Daniel',
    hora_prestamo: '10:00',
    hora_devolucion: null,
    estado: 'prestado',
  },
  {
    id: 'reg-004',
    fecha: '13-3-26',
    item: 'Masquin 48m',
    unidad: 'Rollo',
    ingreso: null,
    salida: 3,
    saldo: 12,
    seccion: 'Pintura',
    obra: 'Torre Anaya',
    persona_prestamo: 'Roberto Silva',
    hora_prestamo: '11:20',
    hora_devolucion: null,
    estado: 'pendiente',
  },
  {
    id: 'reg-005',
    fecha: '13-3-26',
    item: 'Suspens. goma Clavo 1cu',
    unidad: 'PAR',
    ingreso: null,
    salida: 1,
    saldo: 6,
    seccion: 'Sscuf',
    obra: 'Edif. Norte',
    persona_prestamo: 'Miguel Torres',
    hora_prestamo: '12:45',
    hora_devolucion: '16:00',
    estado: 'devuelto',
  },
  {
    id: 'reg-006',
    fecha: '12-3-26',
    item: 'Casco seguridad amarillo',
    unidad: 'PZA',
    ingreso: 10,
    salida: null,
    saldo: 35,
    seccion: 'EPP',
    obra: 'General',
    persona_prestamo: 'Almacén',
    hora_prestamo: '08:00',
    hora_devolucion: null,
    estado: 'pendiente',
  },
  {
    id: 'reg-007',
    fecha: '12-3-26',
    item: 'Chaleco reflectivo',
    unidad: 'PZA',
    ingreso: null,
    salida: 2,
    saldo: 18,
    seccion: 'EPP',
    obra: 'Torre Anaya',
    persona_prestamo: 'Fernando López',
    hora_prestamo: '09:30',
    hora_devolucion: null,
    estado: 'prestado',
  },
  {
    id: 'reg-008',
    fecha: '12-3-26',
    item: 'Llave stillson 18"',
    unidad: 'PZA',
    ingreso: null,
    salida: 1,
    saldo: 4,
    seccion: 'Plomería',
    obra: 'P.P',
    persona_prestamo: 'Andrés Ruiz',
    hora_prestamo: '13:00',
    hora_devolucion: '17:30',
    estado: 'devuelto',
  },
  {
    id: 'reg-009',
    fecha: '11-3-26',
    item: 'Nivel laser',
    unidad: 'PZA',
    ingreso: null,
    salida: 1,
    saldo: 2,
    seccion: 'Topografía',
    obra: 'Edif. Norte',
    persona_prestamo: 'Pedro Sánchez',
    hora_prestamo: '07:45',
    hora_devolucion: null,
    estado: 'prestado',
  },
  {
    id: 'reg-010',
    fecha: '11-3-26',
    item: 'Extensión eléctrica 50m',
    unidad: 'PZA',
    ingreso: null,
    salida: 2,
    saldo: 5,
    seccion: 'Eléctrico',
    obra: 'Torre Anaya',
    persona_prestamo: 'Luis García',
    hora_prestamo: '10:15',
    hora_devolucion: null,
    estado: 'prestado',
  },
]

// Mock indumentaria loans
export const MOCK_PRESTAMOS_INDUMENTARIA: PrestamoIndumentaria[] = [
  {
    id: 'pi-001',
    contratista: 'José García López',
    empresa: 'Constructora García S.A.',
    codigo_item: 'CASCO-SEGURIDAD-AMARILLO',
    descripcion: 'Casco de seguridad clase C color amarillo',
    cantidad_prestada: 5,
    fecha_prestamo: '2024-02-20',
    almacen: 'Torre Ejecutiva Centro - Compras Menores',
    obra: 'Torre Ejecutiva Centro',
    estado: 'activo',
    dias_activo: 22,
  },
  {
    id: 'pi-002',
    contratista: 'Carlos Mendoza Ruiz',
    empresa: 'Obras y Servicios Mendoza',
    codigo_item: 'CHALECO-REFLECTIVO-NARANJA',
    descripcion: 'Chaleco reflectivo de seguridad naranja fluorescente',
    cantidad_prestada: 3,
    fecha_prestamo: '2024-03-05',
    almacen: 'Complejo Residencial Las Lomas - Compras Menores',
    obra: 'Complejo Residencial Las Lomas',
    estado: 'activo',
    dias_activo: 8,
  },
  {
    id: 'pi-003',
    contratista: 'Fernando Rodríguez Silva',
    empresa: 'Constructora Rápido',
    codigo_item: 'GUANTES-LATEX-NARANJA',
    descripcion: 'Guantes de látex naranja talla L - caja de 100',
    cantidad_prestada: 2,
    fecha_prestamo: '2024-02-10',
    almacen: 'Centro Comercial Mall Occidente - Compras Menores',
    obra: 'Centro Comercial Mall Occidente',
    estado: 'vencido',
    dias_activo: 32,
  },
  {
    id: 'pi-004',
    contratista: 'David Sánchez Toro',
    empresa: 'Edificaciones Sánchez',
    codigo_item: 'ARNES-SEGURIDAD-COMPLETO',
    descripcion: 'Arnés de seguridad tipo completo con anclajes',
    cantidad_prestada: 4,
    fecha_prestamo: '2024-02-28',
    almacen: 'Puente Vehicular Norte - Compras Mayores',
    obra: 'Puente Vehicular Norte',
    estado: 'parcial',
    dias_activo: 14,
  },
]

// Sectorización de Obras
export const MOCK_SECTORIZATION: ObraSectorizacion[] = [
  {
    id: 'sec-001',
    obraId: 'o-001',
    nombre_obra: 'ETRUSCO',
    estado: 'en_construccion',
    sectores: [
      { id: 's1', nombre: 'Sector 1', color: '#9333ea', numero: 1 },
      { id: 's2', nombre: 'Sector 2', color: '#22c55e', numero: 2 },
      { id: 's3', nombre: 'Sector 3', color: '#ef4444', numero: 3 },
    ],
    pisos: [
      {
        id: 'p-pb',
        numero: '0',
        nombre: 'PB',
        departamentos: [
          { letra: 'C', sector_id: 's3' },
          { letra: 'D', sector_id: 's3' },
          { letra: 'E', sector_id: 's3' },
          { letra: 'F', sector_id: 's3' },
        ],
      },
      {
        id: 'p-p1',
        numero: '1',
        nombre: 'P1',
        departamentos: [
          { letra: 'A', sector_id: 's1' },
          { letra: 'B', sector_id: 's1' },
          { letra: 'C', sector_id: 's1' },
          { letra: 'D', sector_id: 's1' },
          { letra: 'E', sector_id: 's1' },
          { letra: 'F', sector_id: 's1' },
        ],
      },
      {
        id: 'p-p2',
        numero: '2',
        nombre: 'P2',
        departamentos: [
          { letra: 'T', sector_id: 's1' },
          { letra: 'S', sector_id: 's1' },
          { letra: 'G', sector_id: 's1' },
          { letra: 'H', sector_id: 's1' },
          { letra: 'M', sector_id: 's1' },
          { letra: 'N', sector_id: 's1' },
          { letra: 'D', sector_id: 's2' },
          { letra: 'E', sector_id: 's2' },
          { letra: 'O', sector_id: 's2' },
          { letra: 'P', sector_id: 's2' },
          { letra: 'K', sector_id: 's2' },
          { letra: 'A', sector_id: 's3' },
          { letra: 'B', sector_id: 's3' },
          { letra: 'C', sector_id: 's3' },
        ],
      },
    ],
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
]
