export interface DetalleVenta {
  id: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaResumen {
  id: string;
  fecha: string;
  estado: string;
  total: number;
  observacion: string | null;
  cantidadItems: number;
  usuarioId: string;
}

export interface VentaDetalle extends VentaResumen {
  usuarioId: string;
  confirmadaAt: string | null;
  anuladaAt: string | null;
  motivoAnulacion: string | null;
  items: DetalleVenta[];
  createdAt: string;
  updatedAt: string;
}

export interface VentaResumenApi {
  id: string;
  fecha: string;
  estado: string;
  total: number;
  observacion: string | null;
  cantidad_items: number;
  usuario_id: string;
}

export interface VentaDetalleApi extends VentaResumenApi {
  usuario_id: string;
  confirmada_at: string | null;
  anulada_at: string | null;
  motivo_anulacion: string | null;
  items: DetalleVentaApi[];
  created_at: string;
  updated_at: string;
}

export interface DetalleVentaApi {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CrearVentaItem {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CrearVentaDto {
  items: CrearVentaItem[];
  observacion?: string | null;
}

export function mapDetalleVentaFromApi(api: DetalleVentaApi): DetalleVenta {
  return {
    id: api.id,
    productoId: api.producto_id,
    cantidad: Number(api.cantidad),
    precioUnitario: Number(api.precio_unitario),
    subtotal: Number(api.subtotal),
  };
}

export function mapVentaResumenFromApi(api: VentaResumenApi): VentaResumen {
  return {
    id: api.id,
    fecha: api.fecha,
    estado: api.estado,
    total: Number(api.total),
    observacion: api.observacion,
    cantidadItems: api.cantidad_items,
    usuarioId: api.usuario_id,
  };
}

export function mapVentaDetalleFromApi(api: VentaDetalleApi): VentaDetalle {
  return {
    id: api.id,
    fecha: api.fecha,
    estado: api.estado,
    total: Number(api.total),
    observacion: api.observacion,
    cantidadItems: api.cantidad_items,
    usuarioId: api.usuario_id,
    confirmadaAt: api.confirmada_at,
    anuladaAt: api.anulada_at,
    motivoAnulacion: api.motivo_anulacion,
    items: (api.items || []).map(mapDetalleVentaFromApi),
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

// --- Modelo legado (compatibilidad con la vista anterior de ventas) ---

export interface DetalleVentaLegacyApi {
  id?: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  codigo: string;
  fecha: string;
  cliente: string;
  documentoCliente: string;
  telefono: string;
  medioPago: string;
  detalles: DetalleVenta[];
  total: number;
  observaciones: string | null;
  estado: string;
  registradoPor: string;
}

export interface VentaApi {
  id: string;
  codigo: string;
  fecha: string;
  cliente: string;
  documento_cliente: string;
  telefono: string;
  medio_pago: string;
  detalles: DetalleVentaLegacyApi[];
  total: number;
  observaciones: string | null;
  registrado_por: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export function mapVentaFromApi(api: VentaApi): Venta {
  return {
    id: api.id,
    codigo: api.codigo,
    fecha: api.fecha,
    cliente: api.cliente,
    documentoCliente: api.documento_cliente,
    telefono: api.telefono,
    medioPago: api.medio_pago,
    detalles: (api.detalles || []).map((detalle) => ({
      id: detalle.id ?? '',
      productoId: detalle.producto_id,
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precio_unitario),
      subtotal: Number(detalle.subtotal),
    })),
    total: Number(api.total),
    observaciones: api.observaciones,
    estado: api.estado ?? 'confirmada',
    registradoPor: api.registrado_por,
  };
}
