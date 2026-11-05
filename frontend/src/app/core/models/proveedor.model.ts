export interface Proveedor {
  id: string;
  nombre: string;
  ruc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  // Campos legados usados por la vista anterior de proveedores.
  razonSocial?: string;
  nombreContacto?: string | null;
}

export interface ProveedorApi {
  id: string;
  nombre: string;
  ruc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Campos legados usados por el mock y la vista anterior.
  razon_social?: string | null;
  nombre_contacto?: string | null;
}

export interface CrearProveedorDto {
  nombre: string;
  ruc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export function mapProveedorFromApi(api: ProveedorApi): Proveedor {
  return {
    id: api.id,
    nombre: api.nombre,
    ruc: api.ruc,
    telefono: api.telefono,
    email: api.email,
    direccion: api.direccion,
    activo: api.activo,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    razonSocial: api.nombre,
    nombreContacto: api.nombre_contacto ?? null,
  };
}

export function mapProveedorToApi(p: Partial<CrearProveedorDto>): Partial<ProveedorApi> {
  const result: Partial<ProveedorApi> = {};
  if (p.nombre !== undefined) result.nombre = p.nombre;
  if (p.ruc !== undefined) result.ruc = p.ruc;
  if (p.telefono !== undefined) result.telefono = p.telefono;
  if (p.email !== undefined) result.email = p.email;
  if (p.direccion !== undefined) result.direccion = p.direccion;
  return result;
}
