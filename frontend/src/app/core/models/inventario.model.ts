export interface Inventario {
  id: string;
  productoId: string;
  stockActual: number;
  ultimaActualizacion: string;
  createdAt: string;
  updatedAt: string;
}

export type TipoMovimiento = 'entrada' | 'salida';

export type MotivoEntrada = 'Compra' | 'Devolución de cliente' | 'Ajuste de inventario' | 'Otro';
export type MotivoSalida = 'Venta' | 'Uso en servicio de taller' | 'Merma o daño' | 'Ajuste de inventario' | 'Otro';

export interface MovimientoInventario {
  id: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stockAnterior: number;
  stockPosterior: number;
  costoUnitario: number | null;
  motivo: string;
  observaciones: string | null;
  registradoPor: string;
  createdAt: string;
}

export interface RegistrarEntradaDto {
  productoId: string;
  cantidad: number;
  costoUnitario?: number | null;
  proveedor?: string | null;
  motivo: string;
  observaciones?: string | null;
}

export interface RegistrarSalidaDto {
  productoId: string;
  cantidad: number;
  motivo: string;
  observaciones?: string | null;
}

/* Formatos API snake_case */
export interface InventarioApi {
  id: string;
  producto_id: string;
  stock_actual: number;
  ultima_actualizacion: string;
  created_at: string;
  updated_at: string;
}

export interface MovimientoInventarioApi {
  id: string;
  producto_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_posterior: number;
  costo_unitario: number | null;
  motivo: string;
  observaciones: string | null;
  registrado_por: string;
  created_at: string;
}

export function mapInventarioFromApi(api: InventarioApi): Inventario {
  return {
    id: api.id,
    productoId: api.producto_id,
    stockActual: Number(api.stock_actual),
    ultimaActualizacion: api.ultima_actualizacion,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function mapMovimientoFromApi(api: MovimientoInventarioApi): MovimientoInventario {
  return {
    id: api.id,
    productoId: api.producto_id,
    tipo: api.tipo,
    cantidad: Number(api.cantidad),
    stockAnterior: Number(api.stock_anterior),
    stockPosterior: Number(api.stock_posterior),
    costoUnitario: api.costo_unitario !== null ? Number(api.costo_unitario) : null,
    motivo: api.motivo,
    observaciones: api.observaciones,
    registradoPor: api.registrado_por,
    createdAt: api.created_at,
  };
}
