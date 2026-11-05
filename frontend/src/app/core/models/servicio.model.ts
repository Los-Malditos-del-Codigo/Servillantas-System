export interface MaterialServicio {
  id: string;
  productoId: string;
  cantidad: number;
  createdAt: string;
}

export interface MaterialServicioApi {
  id: string;
  producto_id: string;
  cantidad: number;
  created_at: string;
}

export interface TipoServicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioReferencial: number | null;
  activo: boolean;
}

export interface TipoServicioApi {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_referencial: number | null;
  activo: boolean;
}

export interface ServicioResumen {
  id: string;
  fecha: string;
  tipoServicioId: string;
  tipoServicioNombre: string;
  precio: number;
  estado: string;
  observacion: string | null;
  cantidadMateriales: number;
}

export interface ServicioDetalle extends ServicioResumen {
  usuarioId: string;
  anuladaAt: string | null;
  motivoAnulacion: string | null;
  materiales: MaterialServicio[];
  createdAt: string;
  updatedAt: string;
}

export interface ServicioResumenApi {
  id: string;
  fecha: string;
  tipo_servicio_id: string;
  tipo_servicio_nombre: string;
  precio: number;
  estado: string;
  observacion: string | null;
  cantidad_materiales: number;
}

export interface ServicioDetalleApi extends ServicioResumenApi {
  usuario_id: string;
  anulada_at: string | null;
  motivo_anulacion: string | null;
  materiales: MaterialServicioApi[];
  created_at: string;
  updated_at: string;
}

export interface CrearServicioDto {
  tipoServicioId: string;
  precio: number;
  fecha?: string;
  observacion?: string | null;
}

export interface CrearMaterialDto {
  productoId: string;
  cantidad: number;
}

export interface CrearTipoServicioDto {
  nombre: string;
  descripcion?: string | null;
  precioReferencial?: number | null;
  activo?: boolean;
}

export function mapMaterialFromApi(api: MaterialServicioApi): MaterialServicio {
  return {
    id: api.id,
    productoId: api.producto_id,
    cantidad: Number(api.cantidad),
    createdAt: api.created_at,
  };
}

export function mapTipoServicioFromApi(api: TipoServicioApi): TipoServicio {
  return {
    id: api.id,
    nombre: api.nombre,
    descripcion: api.descripcion,
    precioReferencial: api.precio_referencial != null ? Number(api.precio_referencial) : null,
    activo: api.activo,
  };
}

export function mapServicioResumenFromApi(api: ServicioResumenApi): ServicioResumen {
  return {
    id: api.id,
    fecha: api.fecha,
    tipoServicioId: api.tipo_servicio_id,
    tipoServicioNombre: api.tipo_servicio_nombre,
    precio: Number(api.precio),
    estado: api.estado,
    observacion: api.observacion,
    cantidadMateriales: api.cantidad_materiales,
  };
}

export function mapServicioDetalleFromApi(api: ServicioDetalleApi): ServicioDetalle {
  return {
    ...mapServicioResumenFromApi(api),
    usuarioId: api.usuario_id,
    anuladaAt: api.anulada_at,
    motivoAnulacion: api.motivo_anulacion,
    materiales: (api.materiales || []).map(mapMaterialFromApi),
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}
