export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: string | null;
  marcaId: string | null;
  unidadMedidaId: string;
  precioVenta: number;
  stockMinimo: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Modelo API (snake_case)
export interface ProductoApi {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria_id: string | null;
  marca_id: string | null;
  unidad_medida_id: string;
  precio_venta: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function mapProductoFromApi(api: ProductoApi): Producto {
  return {
    id: api.id,
    codigo: api.codigo,
    nombre: api.nombre,
    descripcion: api.descripcion,
    categoriaId: api.categoria_id,
    marcaId: api.marca_id,
    unidadMedidaId: api.unidad_medida_id,
    precioVenta: Number(api.precio_venta),
    stockMinimo: Number(api.stock_minimo),
    activo: api.activo,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function mapProductoToApi(p: Partial<Producto>): Partial<ProductoApi> {
  const result: Partial<ProductoApi> = {};
  if (p.id !== undefined) result.id = p.id;
  if (p.codigo !== undefined) result.codigo = p.codigo;
  if (p.nombre !== undefined) result.nombre = p.nombre;
  if (p.descripcion !== undefined) result.descripcion = p.descripcion;
  if (p.categoriaId !== undefined) result.categoria_id = p.categoriaId;
  if (p.marcaId !== undefined) result.marca_id = p.marcaId;
  if (p.unidadMedidaId !== undefined) result.unidad_medida_id = p.unidadMedidaId;
  if (p.precioVenta !== undefined) result.precio_venta = p.precioVenta;
  if (p.stockMinimo !== undefined) result.stock_minimo = p.stockMinimo;
  if (p.activo !== undefined) result.activo = p.activo;
  if (p.createdAt !== undefined) result.created_at = p.createdAt;
  if (p.updatedAt !== undefined) result.updated_at = p.updatedAt;
  return result;
}
