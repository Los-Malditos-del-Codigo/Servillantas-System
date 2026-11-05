import { Injectable } from '@angular/core';

export interface ProveedorLocal {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  correo: string;
  direccion: string;
  activo: boolean;
}

export interface LineaOperacion {
  productoId: string;
  codigo: string;
  producto: string;
  cantidad: number;
  costoUnitario: number;
  precioUnitario: number;
  devuelta: number;
}

export interface DocumentoLocal {
  nombre: string;
  dataUrl: string;
  tipo: string;
  bytes: number;
}

export interface CompraLocal {
  id: string;
  proveedorId: string;
  proveedor: string;
  fecha: string;
  estado: 'pendiente' | 'recibida' | 'anulada';
  items: LineaOperacion[];
  documentos: DocumentoLocal[];
}

export interface VentaLocal {
  id: string;
  cliente: string;
  documentoCliente?: string;
  metodoPago?: string;
  condicionPago?: string;
  observaciones?: string;
  fecha: string;
  estado: 'confirmada' | 'anulada';
  items: LineaOperacion[];
  motivoAnulacion: string;
}

export interface TipoServicioLocal {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
}

export interface MaterialServicioLocal {
  productoId: string;
  codigo: string;
  producto: string;
  cantidad: number;
  devuelta: number;
}

export interface ServicioTallerLocal {
  id: string;
  tipoServicioId: string;
  tipoServicio: string;
  cliente: string;
  placa: string;
  vehiculo: string;
  precioServicio: number;
  materiales: MaterialServicioLocal[];
  observaciones: string;
  fecha: string;
  estado: 'realizado' | 'anulado';
  motivoAnulacion: string;
}

const STORAGE = {
  proveedores: 'srv_ui_proveedores_v1',
  compras: 'srv_ui_compras_v1',
  ventas: 'srv_ui_ventas_v1',
  tiposServicio: 'srv_ui_tipos_servicio_v1',
  serviciosTaller: 'srv_ui_servicios_taller_v1',
};

const PROVEEDORES_INICIALES: ProveedorLocal[] = [
  { id: 'prov-1', nombre: 'Distribuidora Michelin del Perú S.A.', documento: '20100070970', telefono: '01 411 5000', correo: 'pedidos@michelin.pe', direccion: 'Av. República de Panamá 3055, San Isidro', activo: true },
  { id: 'prov-2', nombre: 'Goodyear del Perú S.A.', documento: '20100171410', telefono: '01 213 0300', correo: 'ventas@goodyear.pe', direccion: 'Av. Javier Prado Este 560, San Isidro', activo: true },
  { id: 'prov-3', nombre: 'Importaciones Vulcanizadoras Lima E.I.R.L.', documento: '20508761234', telefono: '987 654 321', correo: 'contacto@ivl.pe', direccion: 'Av. Argentina 1840, Lima', activo: false },
];

const TIPOS_SERVICIO_INICIALES: TipoServicioLocal[] = [
  { id: 'srv-tipo-1', nombre: 'Montaje de llanta', descripcion: 'Montaje y desmontaje de neumático.', precio: 35, activo: true },
  { id: 'srv-tipo-2', nombre: 'Alineación', descripcion: 'Alineación de dirección y tren delantero.', precio: 60, activo: true },
  { id: 'srv-tipo-3', nombre: 'Balanceo', descripcion: 'Balanceo computarizado de rueda.', precio: 25, activo: true },
  { id: 'srv-tipo-4', nombre: 'Rotación de neumáticos', descripcion: 'Rotación según patrón del vehículo.', precio: 40, activo: true },
  { id: 'srv-tipo-5', nombre: 'Parchado de llanta en frío', descripcion: 'Reparación interior del neumático mediante parche en frío.', precio: 20, activo: true },
  { id: 'srv-tipo-6', nombre: 'Parchado de llanta en caliente', descripcion: 'Reparación vulcanizada del neumático mediante aplicación de calor.', precio: 35, activo: true },
  { id: 'srv-tipo-7', nombre: 'Limpieza de aros', descripcion: 'Limpieza de aros y retiro de residuos adheridos.', precio: 15, activo: true },
  { id: 'srv-tipo-8', nombre: 'Sopleteo de filtros', descripcion: 'Limpieza de filtros mediante aire a presión.', precio: 10, activo: true },
  { id: 'srv-tipo-9', nombre: 'Otros servicios relacionados con neumáticos', descripcion: 'Atención adicional relacionada con neumáticos. Ajustar el precio según el trabajo realizado.', precio: 0, activo: true },
];

@Injectable({ providedIn: 'root' })
export class OperacionesLocalService {
  proveedores(): ProveedorLocal[] {
    return this.read(STORAGE.proveedores, PROVEEDORES_INICIALES);
  }

  guardarProveedor(input: Omit<ProveedorLocal, 'id'> & { id?: string }): ProveedorLocal {
    const list = this.proveedores();
    const item: ProveedorLocal = { ...input, id: input.id ?? this.id('prov') };
    const index = list.findIndex((row) => row.id === item.id);
    if (index < 0) list.unshift(item);
    else list[index] = item;
    this.write(STORAGE.proveedores, list);
    return item;
  }

  cambiarEstadoProveedor(id: string): void {
    const item = this.proveedores().find((row) => row.id === id);
    if (item) this.guardarProveedor({ ...item, activo: !item.activo });
  }

  compras(): CompraLocal[] {
    return this.read(STORAGE.compras, []);
  }

  crearCompra(input: Omit<CompraLocal, 'id'>): CompraLocal {
    const item = { ...input, id: this.id('COM') };
    this.write(STORAGE.compras, [item, ...this.compras()]);
    return item;
  }

  actualizarCompra(id: string, estado: CompraLocal['estado']): void {
    this.write(STORAGE.compras, this.compras().map((item) => item.id === id ? { ...item, estado } : item));
  }

  ventas(): VentaLocal[] {
    return this.read(STORAGE.ventas, []);
  }

  crearVenta(input: Omit<VentaLocal, 'id'>): VentaLocal {
    const item = { ...input, id: this.id('VTA') };
    this.write(STORAGE.ventas, [item, ...this.ventas()]);
    return item;
  }

  actualizarVenta(id: string, update: Partial<VentaLocal>): void {
    this.write(STORAGE.ventas, this.ventas().map((item) => item.id === id ? { ...item, ...update } : item));
  }

  tiposServicio(): TipoServicioLocal[] {
    const saved = this.read(STORAGE.tiposServicio, TIPOS_SERVICIO_INICIALES);
    const savedIds = new Set(saved.map((item) => item.id));
    const missingDefaults = TIPOS_SERVICIO_INICIALES.filter((item) => !savedIds.has(item.id));
    if (missingDefaults.length) {
      const updated = [...saved, ...missingDefaults];
      this.write(STORAGE.tiposServicio, updated);
      return updated;
    }
    return saved;
  }

  guardarTipoServicio(input: Omit<TipoServicioLocal, 'id'> & { id?: string }): TipoServicioLocal {
    const list = this.tiposServicio();
    const item: TipoServicioLocal = { ...input, id: input.id ?? this.id('ST') };
    const index = list.findIndex((row) => row.id === item.id);
    if (index < 0) list.unshift(item);
    else list[index] = item;
    this.write(STORAGE.tiposServicio, list);
    return item;
  }

  serviciosTaller(): ServicioTallerLocal[] {
    return this.read(STORAGE.serviciosTaller, []);
  }

  crearServicioTaller(input: Omit<ServicioTallerLocal, 'id'>): ServicioTallerLocal {
    const item: ServicioTallerLocal = { ...input, id: this.id('ST') };
    this.write(STORAGE.serviciosTaller, [item, ...this.serviciosTaller()]);
    return item;
  }

  actualizarServicioTaller(id: string, update: Partial<ServicioTallerLocal>): void {
    this.write(STORAGE.serviciosTaller, this.serviciosTaller().map((item) => item.id === id ? { ...item, ...update } : item));
  }

  private read<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) {
        this.write(key, fallback);
        return structuredClone(fallback);
      }
      return JSON.parse(saved) as T;
    } catch {
      return structuredClone(fallback);
    }
  }

  private write<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private id(prefix: string): string {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }
}