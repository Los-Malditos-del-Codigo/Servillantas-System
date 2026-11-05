export interface DetalleCompra {
  id: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  createdAt: string;
}

export interface CompraResumen {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  ruc: string | null;
  estado: string;
  fecha: string;
  total: number;
  cantidadItems: number;
  recibidaAt: string | null;
  anuladaAt: string | null;
  motivoAnulacion: string | null;
}

export interface CompraDetalle extends CompraResumen {
  items: DetalleCompra[];
  motivoAnulacion: string | null;
}

export interface CompraResumenApi {
  id: string;
  proveedor_id: string;
  proveedor_nombre: string;
  ruc: string | null;
  estado: string;
  fecha: string;
  total: number;
  cantidad_items: number;
  recibida_at: string | null;
  anulada_at: string | null;
  motivo_anulacion: string | null;
}

export interface CompraDetalleApi extends CompraResumenApi {
  items: DetalleCompraApi[];
  motivo_anulacion: string | null;
}

export interface DetalleCompraApi {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export function mapDetalleCompraFromApi(api: DetalleCompraApi): DetalleCompra {
  return {
    id: api.id,
    productoId: api.producto_id,
    cantidad: Number(api.cantidad),
    precioUnitario: Number(api.precio_unitario),
    subtotal: Number(api.subtotal),
    createdAt: api.created_at,
  };
}

export function mapCompraResumenFromApi(api: CompraResumenApi): CompraResumen {
  return {
    id: api.id,
    proveedorId: api.proveedor_id,
    proveedorNombre: api.proveedor_nombre,
    ruc: api.ruc,
    estado: api.estado,
    fecha: api.fecha,
    total: Number(api.total),
    cantidadItems: api.cantidad_items,
    recibidaAt: api.recibida_at,
    anuladaAt: api.anulada_at,
    motivoAnulacion: api.motivo_anulacion,
  };
}

export function mapCompraDetalleFromApi(api: CompraDetalleApi): CompraDetalle {
  return {
    ...mapCompraResumenFromApi(api),
    items: (api.items || []).map(mapDetalleCompraFromApi),
    motivoAnulacion: api.motivo_anulacion,
  };
}

// --- Modelo legado (compatibilidad con la vista anterior de compras) ---

export type EstadoCompra = 'pendiente' | 'recibida' | 'anulada';

export interface DetalleCompraLegacy {
  id?: string;
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface Compra {
  id: string;
  proveedorId: string;
  codigo: string;
  fecha: string;
  estado: EstadoCompra;
  detalles: DetalleCompraLegacy[];
  total: number;
  observaciones: string | null;
  fechaRecepcion: string | null;
  motivoAnulacion: string | null;
}

export interface DetalleCompraLegacyApi {
  id?: string;
  producto_id: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
}

export interface CompraApi {
  id: string;
  proveedor_id: string;
  codigo: string;
  fecha: string;
  estado: EstadoCompra;
  detalles: DetalleCompraLegacyApi[];
  documentos: unknown[];
  total: number;
  observaciones: string | null;
  fecha_recepcion: string | null;
  motivo_anulacion: string | null;
  registrado_por: string;
  created_at: string;
  updated_at: string;
}

export interface CompraLegacyInput {
  proveedorId: string;
  fecha: string;
  estado: EstadoCompra;
  detalles: DetalleCompraLegacy[];
  observaciones: string | null;
}

export function mapCompraFromApi(api: CompraApi): Compra {
  return {
    id: api.id,
    proveedorId: api.proveedor_id,
    codigo: api.codigo,
    fecha: api.fecha,
    estado: api.estado,
    detalles: (api.detalles || []).map((detalle) => ({
      id: detalle.id,
      productoId: detalle.producto_id,
      cantidad: Number(detalle.cantidad),
      costoUnitario: Number(detalle.costo_unitario),
      subtotal: Number(detalle.subtotal),
    })),
    total: Number(api.total),
    observaciones: api.observaciones,
    fechaRecepcion: api.fecha_recepcion,
    motivoAnulacion: api.motivo_anulacion,
  };
}

export function mapCompraToApi(compra: CompraLegacyInput): CompraApi {
  return {
    id: '',
    proveedor_id: compra.proveedorId,
    codigo: '',
    fecha: compra.fecha,
    estado: compra.estado,
    detalles: compra.detalles.map((detalle) => ({
      id: detalle.id,
      producto_id: detalle.productoId,
      cantidad: detalle.cantidad,
      costo_unitario: detalle.costoUnitario,
      subtotal: detalle.subtotal,
    })),
    documentos: [],
    total: compra.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0),
    observaciones: compra.observaciones,
    fecha_recepcion: null,
    motivo_anulacion: null,
    registrado_por: '',
    created_at: '',
    updated_at: '',
  };
}
