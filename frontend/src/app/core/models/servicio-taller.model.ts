export type EstadoServicioTaller = 'en_proceso' | 'completado' | 'cancelado';

export interface MaterialServicio {
  productoId: string;
  cantidad: number;
}

export interface ServicioTaller {
  id: string;
  codigo: string;
  fecha: string;
  fechaCompletado?: string | null;
  cliente: string;
  documentoCliente: string;
  telefono: string;
  placa: string;
  vehiculo: string;
  descripcion: string;
  materiales: MaterialServicio[];
  manoObra: number;
  medioPago: string;
  total: number;
  estado: EstadoServicioTaller;
  observaciones: string | null;
  registradoPor: string;
}

export interface MaterialServicioApi {
  producto_id: string;
  cantidad: number;
}

export interface ServicioTallerApi {
  id: string;
  codigo: string;
  fecha: string;
  fecha_completado?: string | null;
  cliente: string;
  documento_cliente: string;
  telefono: string;
  placa: string;
  vehiculo: string;
  descripcion: string;
  materiales: MaterialServicioApi[];
  mano_obra: number;
  medio_pago: string;
  total: number;
  estado: EstadoServicioTaller;
  observaciones: string | null;
  registrado_por: string;
}

export function mapServicioTallerFromApi(api: ServicioTallerApi): ServicioTaller {
  return {
    id: api.id,
    codigo: api.codigo,
    fecha: api.fecha,
    fechaCompletado: api.fecha_completado ?? null,
    cliente: api.cliente,
    documentoCliente: api.documento_cliente ?? '',
    telefono: api.telefono,
    placa: api.placa,
    vehiculo: api.vehiculo,
    descripcion: api.descripcion,
    materiales: api.materiales.map((material) => ({
      productoId: material.producto_id,
      cantidad: Number(material.cantidad),
    })),
    manoObra: Number(api.mano_obra),
    medioPago: api.medio_pago ?? '',
    total: Number(api.total),
    estado: api.estado,
    observaciones: api.observaciones,
    registradoPor: api.registrado_por,
  };
}
