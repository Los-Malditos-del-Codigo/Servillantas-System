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
  tipo: TipoAlerta;
  mensaje: string;
  stock_actual: number;
  stock_minimo: number;
  estado: EstadoAlerta;
  fecha_generacion: string;
}

export function mapAlertaFromApi(api: AlertaApi): Alerta {
  return {
    id: api.id,
    productoId: api.producto_id,
    tipo: api.tipo,
    mensaje: api.mensaje,
    stockActual: Number(api.stock_actual),
    stockMinimo: Number(api.stock_minimo),
    estado: api.estado,
    fechaGeneracion: api.fecha_generacion,
  };
}
