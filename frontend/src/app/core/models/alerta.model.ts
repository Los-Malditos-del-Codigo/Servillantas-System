export type TipoAlerta = 'stock_bajo' | 'stock_agotado' | 'sistema' | 'informacion';
export type EstadoAlerta = 'pendiente' | 'leida' | 'resuelta';

export interface Alerta {
  id: string;
  productoId: string;
  tipo: TipoAlerta;
  mensaje: string;
  stockActual: number;
  stockMinimo: number;
  estado: EstadoAlerta;
  fechaGeneracion: string;
}

export interface AlertaApi {
  id: string;
  producto_id: string;
  tipo: TipoAlerta | string;
  mensaje: string;
  stock_actual?: number;
  stock_minimo?: number;
  estado: EstadoAlerta | string;
  fecha_generacion?: string;
  created_at?: string;
}

export function mapAlertaFromApi(api: AlertaApi): Alerta {
  const raw = api as any;
  const rawTipo = String(api.tipo ?? 'stock_bajo').toLowerCase();
  const tipo: TipoAlerta =
    rawTipo === 'stock_agotado' || rawTipo === 'stock_bajo' || rawTipo === 'sistema' || rawTipo === 'informacion'
      ? (rawTipo as TipoAlerta)
      : 'stock_bajo';

  const rawEstado = String(api.estado ?? 'pendiente').toLowerCase();
  const estado: EstadoAlerta =
    rawEstado === 'resuelta'
      ? 'resuelta'
      : rawEstado === 'leida' || rawEstado === 'leída'
        ? 'leida'
        : 'pendiente';

  return {
    id: api.id,
    productoId: api.producto_id ?? raw.productoId ?? '',
    tipo,
    mensaje: api.mensaje ?? '',
    stockActual: Number(api.stock_actual ?? raw.stockActual ?? 0),
    stockMinimo: Number(api.stock_minimo ?? raw.stockMinimo ?? 0),
    estado,
    fechaGeneracion: api.fecha_generacion ?? api.created_at ?? raw.createdAt ?? new Date().toISOString(),
  };
}
