import { Injectable } from '@angular/core';
import { Rol, Perfil, SesionUsuario } from '../models/auth.model';
import { Categoria, Marca, UnidadMedida } from '../models/catalogos.model';
import { ProductoApi } from '../models/producto.model';
import { InventarioApi, MovimientoInventarioApi, RegistrarEntradaDto, RegistrarSalidaDto } from '../models/inventario.model';
import { AlertaApi } from '../models/alerta.model';
import { CompraApi } from '../models/compra.model';
import { ProveedorApi } from '../models/proveedor.model';
import { VentaApi } from '../models/venta.model';
import { ServicioTallerApi } from '../models/servicio-taller.model';
import {
  SEED_ROLES,
  SEED_PERFILES,
  SEED_UNIDADES,
  SEED_CATEGORIAS,
  SEED_MARCAS,
  SEED_PRODUCTOS_CON_STOCK,
  SEED_MOVIMIENTOS,
  SEED_ALERTAS,
} from '../mock-data/seed-data';

const STORAGE_KEYS = {
  ROLES: 'srv_roles_v1',
  PERFILES: 'srv_perfiles_v1',
  UNIDADES: 'srv_unidades_v1',
  CATEGORIAS: 'srv_categorias_v1',
  MARCAS: 'srv_marcas_v1',
  PRODUCTOS: 'srv_productos_v1',
  INVENTARIO: 'srv_inventario_v1',
  MOVIMIENTOS: 'srv_movimientos_v1',
  ALERTAS: 'srv_alertas_v1',
  PROVEEDORES: 'srv_proveedores_v1',
  COMPRAS: 'srv_compras_v1',
  VENTAS: 'srv_ventas_v1',
  SERVICIOS_TALLER: 'srv_servicios_taller_v1',
};

function crearTokenMock(perfil: Perfil, rol: Rol): string {
  const payload = JSON.stringify({
    sub: perfil.id,
    rol: rol.nombre,
    nombres: perfil.nombres,
  });
  const bytes = new TextEncoder().encode(payload);
  const encodedPayload = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `mock.${encodedPayload}.mock`;
}

function crearIdMock(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

@Injectable({
  providedIn: 'root',
})
export class MockDbService {
  private roles: Rol[] = [];
  private perfiles: Array<Perfil & { correo: string; passwordHash: string }> = [];
  private unidades: UnidadMedida[] = [];
  private categorias: Categoria[] = [];
  private marcas: Marca[] = [];
  private productos: ProductoApi[] = [];
  private inventario: InventarioApi[] = [];
  private movimientos: MovimientoInventarioApi[] = [];
  private alertas: AlertaApi[] = [];
  private proveedores: ProveedorApi[] = [];
  private compras: CompraApi[] = [];
  private ventas: VentaApi[] = [];
  private serviciosTaller: ServicioTallerApi[] = [];

  constructor() {
    this.initDatabase();
  }

  private initDatabase(): void {
    // 1. Roles & Perfiles
    this.roles = this.loadOrSeed(STORAGE_KEYS.ROLES, SEED_ROLES);
    this.perfiles = this.loadOrSeed(STORAGE_KEYS.PERFILES, SEED_PERFILES);

    // 2. Catálogos
    this.unidades = this.loadOrSeed(STORAGE_KEYS.UNIDADES, SEED_UNIDADES);
    this.categorias = this.loadOrSeed(STORAGE_KEYS.CATEGORIAS, SEED_CATEGORIAS);
    this.marcas = this.loadOrSeed(STORAGE_KEYS.MARCAS, SEED_MARCAS);
    this.proveedores = this.loadOrSeed(STORAGE_KEYS.PROVEEDORES, [
      {
        id: 'prov-1',
        nombre: 'Distribuidora Automotriz del Norte S.A.C.',
        ruc: '20123456789',
        razon_social: 'Distribuidora Automotriz del Norte S.A.C.',
        nombre_contacto: 'María López',
        telefono: '044-234567',
        email: 'ventas@danorte.pe',
        direccion: 'Av. América Norte 1250, Trujillo',
        activo: true,
        created_at: '2025-02-01T08:00:00.000Z',
        updated_at: '2025-02-01T08:00:00.000Z',
      },
      {
        id: 'prov-2',
        nombre: 'Repuestos y Llantas del Perú E.I.R.L.',
        ruc: '20456789012',
        razon_social: 'Repuestos y Llantas del Perú E.I.R.L.',
        nombre_contacto: 'Jorge Ramírez',
        telefono: '01-4567890',
        email: 'contacto@repuestoperu.pe',
        direccion: 'Av. Argentina 820, Lima',
        activo: true,
        created_at: '2025-02-05T08:00:00.000Z',
        updated_at: '2025-02-05T08:00:00.000Z',
      },
    ]);
    this.compras = this.loadOrSeed(STORAGE_KEYS.COMPRAS, []);
    this.ventas = this.loadOrSeed(STORAGE_KEYS.VENTAS, []);
    this.serviciosTaller = this.loadOrSeed(STORAGE_KEYS.SERVICIOS_TALLER, []);

    // 3. Productos e Inventario
    const savedProds = this.load<ProductoApi[]>(STORAGE_KEYS.PRODUCTOS);
    const savedInv = this.load<InventarioApi[]>(STORAGE_KEYS.INVENTARIO);

    if (savedProds && savedInv) {
      this.productos = savedProds;
      this.inventario = savedInv;
    } else {
      this.productos = SEED_PRODUCTOS_CON_STOCK.map((item) => item.api);
      this.inventario = SEED_PRODUCTOS_CON_STOCK.map((item, idx) => ({
        id: `inv-${String(idx + 1).padStart(2, '0')}`,
        producto_id: item.api.id,
        stock_actual: item.stockActual,
        ultima_actualizacion: new Date().toISOString(),
        created_at: item.api.created_at,
        updated_at: new Date().toISOString(),
      }));
      this.save(STORAGE_KEYS.PRODUCTOS, this.productos);
      this.save(STORAGE_KEYS.INVENTARIO, this.inventario);
    }

    // 4. Movimientos y Alertas
    this.movimientos = this.loadOrSeed(STORAGE_KEYS.MOVIMIENTOS, SEED_MOVIMIENTOS);
    this.alertas = this.loadOrSeed(STORAGE_KEYS.ALERTAS, SEED_ALERTAS);
  }

  private load<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }
  }

  private loadOrSeed<T>(key: string, seed: T): T {
    const loaded = this.load<T>(key);
    if (loaded !== null) {
      return loaded;
    }
    this.save(key, seed);
    return JSON.parse(JSON.stringify(seed));
  }

  // Autenticacion
  authenticate(correo: string, pass: string): SesionUsuario | null {
    const user = this.perfiles.find(
      (p) => p.correo.toLowerCase() === correo.trim().toLowerCase() && p.passwordHash === pass
    );
    if (!user || !user.activo) {
      return null;
    }

    const rol = this.roles.find((r) => r.id === user.rolId) || {
      id: user.rolId,
      nombre: 'personal' as const,
      descripcion: 'Personal operativo',
      createdAt: new Date().toISOString(),
    };

    const { passwordHash: _, correo: __, ...perfilData } = user;

    return {
      perfil: perfilData,
      rol,
      token: crearTokenMock(user, rol),
    };
  }

  getProveedores(): ProveedorApi[] {
    return [...this.proveedores];
  }

  createProveedor(dto: Partial<ProveedorApi>): ProveedorApi {
    const ruc = dto.ruc?.trim() ?? '';
    if (!/^\d{11}$/.test(ruc)) throw new Error('El RUC debe tener 11 dígitos.');
    if (this.proveedores.some((item) => item.ruc === ruc)) {
      throw new Error('Ya existe un proveedor con ese RUC.');
    }
    const nombre = dto.nombre?.trim() || dto.razon_social?.trim() || '';
    if (!nombre) throw new Error('La razón social es obligatoria.');

    const now = new Date().toISOString();
    const proveedor: ProveedorApi = {
      id: crearIdMock('prov'),
      nombre,
      ruc,
      razon_social: nombre,
      nombre_contacto: dto.nombre_contacto?.trim() ?? '',
      telefono: dto.telefono?.trim() ?? '',
      email: dto.email?.trim() ?? '',
      direccion: dto.direccion?.trim() ?? '',
      activo: dto.activo ?? true,
      created_at: now,
      updated_at: now,
    };
    this.proveedores.unshift(proveedor);
    this.save(STORAGE_KEYS.PROVEEDORES, this.proveedores);
    return proveedor;
  }

  updateProveedor(id: string, dto: Partial<ProveedorApi>): ProveedorApi {
    const index = this.proveedores.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Proveedor no encontrado.');
    const ruc = dto.ruc?.trim();
    if (ruc && !/^\d{11}$/.test(ruc)) throw new Error('El RUC debe tener 11 dígitos.');
    if (ruc && this.proveedores.some((item) => item.ruc === ruc && item.id !== id)) {
      throw new Error('Ya existe un proveedor con ese RUC.');
    }
    if (dto.razon_social !== undefined && !dto.razon_social.trim()) {
      throw new Error('La razón social es obligatoria.');
    }
    const updated = {
      ...this.proveedores[index],
      ...dto,
      ruc: ruc ?? this.proveedores[index].ruc,
      razon_social: dto.razon_social?.trim() ?? this.proveedores[index].razon_social,
      updated_at: new Date().toISOString(),
    };
    this.proveedores[index] = updated;
    this.save(STORAGE_KEYS.PROVEEDORES, this.proveedores);
    return updated;
  }

  getCompras(): CompraApi[] {
    return [...this.compras].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  getCompra(id: string): CompraApi | undefined {
    return this.compras.find((compra) => compra.id === id);
  }

  createCompra(dto: Partial<CompraApi>): CompraApi {
    const proveedor = this.proveedores.find((item) => item.id === dto.proveedor_id && item.activo);
    if (!proveedor) throw new Error('Selecciona un proveedor activo.');
    if (!dto.detalles?.length) throw new Error('Agrega al menos un producto a la compra.');
    if (new Set(dto.detalles.map((detalle) => detalle.producto_id)).size !== dto.detalles.length) {
      throw new Error('Cada producto debe aparecer una sola vez en la orden.');
    }
    for (const detalle of dto.detalles) {
      if (!this.productos.some((producto) => producto.id === detalle.producto_id && producto.activo)) {
        throw new Error('La compra contiene un producto no disponible.');
      }
      if (!Number.isInteger(detalle.cantidad) || detalle.cantidad <= 0 ||
          !Number.isFinite(detalle.costo_unitario) || detalle.costo_unitario < 0) {
        throw new Error('Revisa las cantidades y costos de los productos.');
      }
    }

    const now = new Date().toISOString();
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = String(this.compras.filter((item) => item.codigo.startsWith(`OC-${day}-`)).length + 1).padStart(3, '0');
    const detalles = dto.detalles.map((detalle) => ({
      ...detalle,
      subtotal: detalle.cantidad * detalle.costo_unitario,
    }));
    const compra: CompraApi = {
      id: crearIdMock('compra'),
      proveedor_id: proveedor.id,
      codigo: `OC-${day}-${orderNumber}`,
      fecha: dto.fecha || new Date().toISOString().slice(0, 10),
      estado: 'pendiente',
      detalles,
      documentos: dto.documentos ?? [],
      total: detalles.reduce((sum, item) => sum + item.subtotal, 0),
      observaciones: dto.observaciones?.trim() || null,
      fecha_recepcion: null,
      motivo_anulacion: null,
      registrado_por: dto.registrado_por || 'Usuario del Sistema',
      created_at: now,
      updated_at: now,
    };
    this.compras.unshift(compra);
    this.save(STORAGE_KEYS.COMPRAS, this.compras);
    return compra;
  }

  receiveCompra(id: string, registradoPor: string): CompraApi {
    const compra = this.compras.find((item) => item.id === id);
    if (!compra) throw new Error('Compra no encontrada.');
    if (compra.estado !== 'pendiente') throw new Error('Solo se pueden recibir compras pendientes.');
    for (const detalle of compra.detalles) {
      if (!this.productos.some((producto) => producto.id === detalle.producto_id)) {
        throw new Error('No se puede recibir: uno de los productos ya no existe.');
      }
    }

    for (const detalle of compra.detalles) {
      this.registrarEntrada(
        {
          productoId: detalle.producto_id,
          cantidad: detalle.cantidad,
          costoUnitario: detalle.costo_unitario,
          proveedor: this.proveedores.find((item) => item.id === compra.proveedor_id)?.razon_social,
          motivo: 'Compra',
          observaciones: `Orden ${compra.codigo}`,
        },
        registradoPor
      );
    }
    compra.estado = 'recibida';
    compra.fecha_recepcion = new Date().toISOString();
    compra.updated_at = compra.fecha_recepcion;
    this.save(STORAGE_KEYS.COMPRAS, this.compras);
    return compra;
  }

  cancelCompra(id: string, motivo: string): CompraApi {
    const compra = this.compras.find((item) => item.id === id);
    if (!compra) throw new Error('Compra no encontrada.');
    if (compra.estado !== 'pendiente') throw new Error('Solo se pueden anular compras pendientes.');
    if (!motivo.trim()) throw new Error('Indica el motivo de anulación.');
    compra.estado = 'anulada';
    compra.motivo_anulacion = motivo.trim();
    compra.updated_at = new Date().toISOString();
    this.save(STORAGE_KEYS.COMPRAS, this.compras);
    return compra;
  }

  getVentas(): VentaApi[] {
    return [...this.ventas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  createVenta(dto: {
    cliente?: string;
    documento_cliente?: string;
    telefono?: string;
    medio_pago?: string;
    detalles?: Array<{ producto_id: string; cantidad: number }>;
    observaciones?: string | null;
    registrado_por?: string;
  }): VentaApi {
    if (!dto.cliente?.trim()) throw new Error('El nombre del cliente es obligatorio.');
    if (!dto.medio_pago?.trim()) throw new Error('Selecciona un medio de pago.');
    if (!dto.detalles?.length) throw new Error('Agrega al menos un producto a la venta.');
    if (new Set(dto.detalles.map((item) => item.producto_id)).size !== dto.detalles.length) {
      throw new Error('Cada producto debe aparecer una sola vez en la venta.');
    }

    const detalles = dto.detalles.map((item) => {
      const producto = this.productos.find((p) => p.id === item.producto_id && p.activo);
      if (!producto) throw new Error('La venta contiene un producto no disponible.');
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        throw new Error('La cantidad debe ser un número entero mayor a cero.');
      }
      const stock = this.inventario.find((i) => i.producto_id === item.producto_id)?.stock_actual ?? 0;
      if (stock < item.cantidad) throw new Error(`Stock insuficiente para "${producto.nombre}". Disponible: ${stock}.`);
      return {
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio_unitario: Number(producto.precio_venta),
        subtotal: Number(producto.precio_venta) * item.cantidad,
      };
    });

    const now = new Date().toISOString();
    const codigo = this.codigoDiario('V', this.ventas.map((item) => item.codigo));
    const venta: VentaApi = {
      id: crearIdMock('venta'),
      codigo,
      fecha: now,
      cliente: dto.cliente.trim(),
      documento_cliente: dto.documento_cliente?.trim() ?? '',
      telefono: dto.telefono?.trim() ?? '',
      medio_pago: dto.medio_pago,
      detalles,
      total: detalles.reduce((sum, item) => sum + item.subtotal, 0),
      observaciones: dto.observaciones?.trim() || null,
      registrado_por: dto.registrado_por || 'Usuario del Sistema',
    };

    for (const detalle of detalles) {
      this.registrarSalida(
        {
          productoId: detalle.producto_id,
          cantidad: detalle.cantidad,
          motivo: 'Venta',
          observaciones: `Venta ${codigo} · ${venta.cliente}`,
        },
        venta.registrado_por
      );
    }
    this.ventas.unshift(venta);
    this.save(STORAGE_KEYS.VENTAS, this.ventas);
    return venta;
  }

  getServiciosTaller(): ServicioTallerApi[] {
    return [...this.serviciosTaller].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  createServicioTaller(dto: {
    cliente?: string;
    documento_cliente?: string;
    telefono?: string;
    placa?: string;
    vehiculo?: string;
    descripcion?: string;
    mano_obra?: number;
    medio_pago?: string;
    materiales?: Array<{ producto_id: string; cantidad: number }>;
    observaciones?: string | null;
    registrado_por?: string;
  }): ServicioTallerApi {
    if (!dto.cliente?.trim() || !dto.placa?.trim() || !dto.vehiculo?.trim() || !dto.descripcion?.trim()) {
      throw new Error('Completa cliente, placa, vehículo y descripción del servicio.');
    }
    if (!Number.isFinite(dto.mano_obra) || (dto.mano_obra ?? -1) < 0) {
      throw new Error('El costo de mano de obra debe ser cero o mayor.');
    }
    const materiales = dto.materiales ?? [];
    if (new Set(materiales.map((item) => item.producto_id)).size !== materiales.length) {
      throw new Error('Cada material debe aparecer una sola vez en el servicio.');
    }
    for (const material of materiales) {
      const producto = this.productos.find((p) => p.id === material.producto_id && p.activo);
      if (!producto) throw new Error('El servicio contiene un producto no disponible.');
      if (!Number.isInteger(material.cantidad) || material.cantidad <= 0) {
        throw new Error('La cantidad de cada material debe ser un entero mayor a cero.');
      }
      const stock = this.inventario.find((i) => i.producto_id === material.producto_id)?.stock_actual ?? 0;
      if (stock < material.cantidad) throw new Error(`Stock insuficiente para "${producto.nombre}". Disponible: ${stock}.`);
    }

    const now = new Date().toISOString();
    const codigo = this.codigoDiario('ST', this.serviciosTaller.map((item) => item.codigo));
    const servicio: ServicioTallerApi = {
      id: crearIdMock('servicio'),
      codigo,
      fecha: now,
      cliente: dto.cliente.trim(),
      documento_cliente: dto.documento_cliente?.trim() ?? '',
      telefono: dto.telefono?.trim() ?? '',
      placa: dto.placa.trim().toUpperCase(),
      vehiculo: dto.vehiculo.trim(),
      descripcion: dto.descripcion.trim(),
      materiales: materiales.map((item) => ({ ...item })),
      mano_obra: dto.mano_obra ?? 0,
      medio_pago: dto.medio_pago ?? '',
      total: dto.mano_obra ?? 0,
      estado: 'en_proceso',
      observaciones: dto.observaciones?.trim() || null,
      registrado_por: dto.registrado_por || 'Usuario del Sistema',
    };
    for (const material of materiales) {
      this.registrarSalida(
        {
          productoId: material.producto_id,
          cantidad: material.cantidad,
          motivo: 'Uso en servicio de taller',
          observaciones: `Servicio ${codigo} · ${servicio.cliente}`,
        },
        servicio.registrado_por
      );
      const producto = this.productos.find((item) => item.id === material.producto_id)!;
      servicio.total += material.cantidad * Number(producto.precio_venta);
    }
    this.serviciosTaller.unshift(servicio);
    this.save(STORAGE_KEYS.SERVICIOS_TALLER, this.serviciosTaller);
    return servicio;
  }

  updateServicioTallerEstado(id: string, estado: 'completado' | 'cancelado'): ServicioTallerApi {
    const servicio = this.serviciosTaller.find((item) => item.id === id);
    if (!servicio) throw new Error('Servicio de taller no encontrado.');
    if (servicio.estado !== 'en_proceso') throw new Error('Solo se puede actualizar un servicio en proceso.');
    if (estado === 'cancelado') {
      for (const material of servicio.materiales) {
        this.registrarEntrada(
          {
            productoId: material.producto_id,
            cantidad: material.cantidad,
            motivo: 'Otro',
            observaciones: `Reintegro de materiales por cancelación del servicio ${servicio.codigo}`,
          },
          servicio.registrado_por
        );
      }
    }
    servicio.estado = estado;
    if (estado === 'completado') servicio.fecha_completado = new Date().toISOString();
    this.save(STORAGE_KEYS.SERVICIOS_TALLER, this.serviciosTaller);
    return servicio;
  }

  getResumenDashboard(): {
    productosActivos: number;
    unidadesStock: number;
    stockBajo: number;
    comprasPendientes: number;
    ventasHoy: number;
    totalVentasHoy: number;
    serviciosEnProceso: number;
    movimientosRecientes: MovimientoInventarioApi[];
  } {
    const hoy = new Date().toISOString().slice(0, 10);
    const ventasHoy = this.ventas.filter((venta) => venta.fecha.slice(0, 10) === hoy);
    return {
      productosActivos: this.productos.filter((producto) => producto.activo).length,
      unidadesStock: this.inventario.reduce((sum, inventario) => sum + inventario.stock_actual, 0),
      stockBajo: this.inventario.filter((inventario) => {
        const producto = this.productos.find((item) => item.id === inventario.producto_id);
        return producto?.activo && inventario.stock_actual <= producto.stock_minimo;
      }).length,
      comprasPendientes: this.compras.filter((compra) => compra.estado === 'pendiente').length,
      ventasHoy: ventasHoy.length,
      totalVentasHoy: ventasHoy.reduce((sum, venta) => sum + venta.total, 0),
      serviciosEnProceso: this.serviciosTaller.filter((servicio) => servicio.estado === 'en_proceso').length,
      movimientosRecientes: this.movimientos.slice(0, 6),
    };
  }

  private codigoDiario(prefijo: string, codigos: string[]): string {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const inicio = `${prefijo}-${day}-`;
    const numero = codigos.filter((codigo) => codigo.startsWith(inicio)).length + 1;
    return `${inicio}${String(numero).padStart(3, '0')}`;
  }

  // Categorias
  getCategorias(): Categoria[] {
    return [...this.categorias];
  }

  getCategoriaById(id: string): Categoria | undefined {
    return this.categorias.find((c) => c.id === id);
  }

  createCategoria(dto: Omit<Categoria, 'id' | 'createdAt' | 'updatedAt'>): Categoria {
    const newCat: Categoria = {
      id: `cat-${Date.now()}`,
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion.trim(),
      activo: dto.activo !== undefined ? dto.activo : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.categorias.push(newCat);
    this.save(STORAGE_KEYS.CATEGORIAS, this.categorias);
    return newCat;
  }

  updateCategoria(id: string, dto: Partial<Categoria>): Categoria {
    const index = this.categorias.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Categoría no encontrada');
    const updated = {
      ...this.categorias[index],
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.categorias[index] = updated;
    this.save(STORAGE_KEYS.CATEGORIAS, this.categorias);
    return updated;
  }

  // Marcas
  getMarcas(): Marca[] {
    return [...this.marcas];
  }

  getMarcaById(id: string): Marca | undefined {
    return this.marcas.find((m) => m.id === id);
  }

  createMarca(dto: Omit<Marca, 'id' | 'createdAt' | 'updatedAt'>): Marca {
    const newMarca: Marca = {
      id: `mar-${Date.now()}`,
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion.trim(),
      activo: dto.activo !== undefined ? dto.activo : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.marcas.push(newMarca);
    this.save(STORAGE_KEYS.MARCAS, this.marcas);
    return newMarca;
  }

  updateMarca(id: string, dto: Partial<Marca>): Marca {
    const index = this.marcas.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Marca no encontrada');
    const updated = {
      ...this.marcas[index],
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.marcas[index] = updated;
    this.save(STORAGE_KEYS.MARCAS, this.marcas);
    return updated;
  }

  // Unidades de Medida
  getUnidades(): UnidadMedida[] {
    return [...this.unidades];
  }

  getUnidadById(id: string): UnidadMedida | undefined {
    return this.unidades.find((u) => u.id === id);
  }

  createUnidad(dto: Omit<UnidadMedida, 'id' | 'createdAt'>): UnidadMedida {
    const newUm: UnidadMedida = {
      id: `um-${Date.now()}`,
      nombre: dto.nombre.trim(),
      abreviatura: dto.abreviatura.trim().toUpperCase(),
      activo: dto.activo !== undefined ? dto.activo : true,
      createdAt: new Date().toISOString(),
    };
    this.unidades.push(newUm);
    this.save(STORAGE_KEYS.UNIDADES, this.unidades);
    return newUm;
  }

  updateUnidad(id: string, dto: Partial<UnidadMedida>): UnidadMedida {
    const index = this.unidades.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Unidad de medida no encontrada');
    const updated = {
      ...this.unidades[index],
      ...dto,
      abreviatura: dto.abreviatura ? dto.abreviatura.toUpperCase() : this.unidades[index].abreviatura,
    };
    this.unidades[index] = updated;
    this.save(STORAGE_KEYS.UNIDADES, this.unidades);
    return updated;
  }

  // Productos
  getProductos(params?: {
    search?: string;
    categoriaId?: string;
    marcaId?: string;
    includeInactivos?: boolean;
  }): ProductoApi[] {
    let list = [...this.productos];

    if (!params?.includeInactivos) {
      list = list.filter((p) => p.activo);
    }

    if (params?.categoriaId) {
      list = list.filter((p) => p.categoria_id === params.categoriaId);
    }

    if (params?.marcaId) {
      list = list.filter((p) => p.marca_id === params.marcaId);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
      );
    }

    return list;
  }

  getProductoById(id: string): ProductoApi | undefined {
    return this.productos.find((p) => p.id === id);
  }

  createProducto(payload: Partial<ProductoApi>): ProductoApi {
    if (!payload.codigo || !payload.nombre || !payload.unidad_medida_id) {
      throw new Error('Campos obligatorios faltantes');
    }
    const exists = this.productos.some(
      (p) => p.codigo.trim().toLowerCase() === payload.codigo!.trim().toLowerCase()
    );
    if (exists) {
      throw new Error('El código de producto ya se encuentra registrado');
    }

    const now = new Date().toISOString();
    const newProd: ProductoApi = {
      id: `prod-${Date.now()}`,
      codigo: payload.codigo.trim().toUpperCase(),
      nombre: payload.nombre.trim(),
      descripcion: payload.descripcion?.trim() || '',
      categoria_id: payload.categoria_id || null,
      marca_id: payload.marca_id || null,
      unidad_medida_id: payload.unidad_medida_id,
      precio_venta: Math.max(0, Number(payload.precio_venta) || 0),
      stock_minimo: Math.max(0, Number(payload.stock_minimo) || 0),
      activo: payload.activo !== undefined ? payload.activo : true,
      created_at: now,
      updated_at: now,
    };

    this.productos.unshift(newProd);
    this.save(STORAGE_KEYS.PRODUCTOS, this.productos);

    // Inicializar fila en inventario con stockActual = 0
    const newInv: InventarioApi = {
      id: `inv-${Date.now()}`,
      producto_id: newProd.id,
      stock_actual: 0,
      ultima_actualizacion: now,
      created_at: now,
      updated_at: now,
    };
    this.inventario.push(newInv);
    this.save(STORAGE_KEYS.INVENTARIO, this.inventario);

    return newProd;
  }

  updateProducto(id: string, payload: Partial<ProductoApi>): ProductoApi {
    const index = this.productos.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');

    if (payload.codigo) {
      const exists = this.productos.some(
        (p) => p.id !== id && p.codigo.trim().toLowerCase() === payload.codigo!.trim().toLowerCase()
      );
      if (exists) {
        throw new Error('El código ya está asignado a otro producto');
      }
    }

    const current = this.productos[index];
    const updated: ProductoApi = {
      ...current,
      ...payload,
      codigo: payload.codigo ? payload.codigo.trim().toUpperCase() : current.codigo,
      precio_venta: payload.precio_venta !== undefined ? Math.max(0, Number(payload.precio_venta)) : current.precio_venta,
      stock_minimo: payload.stock_minimo !== undefined ? Math.max(0, Number(payload.stock_minimo)) : current.stock_minimo,
      updated_at: new Date().toISOString(),
    };

    this.productos[index] = updated;
    this.save(STORAGE_KEYS.PRODUCTOS, this.productos);
    return updated;
  }

  toggleProductoActivo(id: string): ProductoApi {
    const index = this.productos.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');

    const updated = {
      ...this.productos[index],
      activo: !this.productos[index].activo,
      updated_at: new Date().toISOString(),
    };

    this.productos[index] = updated;
    this.save(STORAGE_KEYS.PRODUCTOS, this.productos);
    return updated;
  }

  // Inventario y Movimientos
  getInventarios(): InventarioApi[] {
    return [...this.inventario];
  }

  getInventarioByProductoId(productoId: string): InventarioApi | undefined {
    return this.inventario.find((i) => i.producto_id === productoId);
  }

  getMovimientos(params?: {
    productoId?: string;
    tipo?: 'entrada' | 'salida';
    fechaDesde?: string;
    fechaHasta?: string;
  }): MovimientoInventarioApi[] {
    let list = [...this.movimientos];

    if (params?.productoId) {
      list = list.filter((m) => m.producto_id === params.productoId);
    }
    if (params?.tipo) {
      list = list.filter((m) => m.tipo === params.tipo);
    }
    if (params?.fechaDesde) {
      const d = new Date(params.fechaDesde).getTime();
      list = list.filter((m) => new Date(m.created_at).getTime() >= d);
    }
    if (params?.fechaHasta) {
      const h = new Date(params.fechaHasta);
      h.setHours(23, 59, 59, 999);
      list = list.filter((m) => new Date(m.created_at).getTime() <= h.getTime());
    }

    // Ordenar descendente por fecha
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  registrarEntrada(dto: RegistrarEntradaDto, registradoPor: string): {
    movimiento: MovimientoInventarioApi;
    inventario: InventarioApi;
  } {
    if (!dto.productoId || dto.cantidad <= 0 || !dto.motivo) {
      throw new Error('Datos de entrada inválidos. Cantidad y motivo obligatorios.');
    }

    const prod = this.productos.find((p) => p.id === dto.productoId);
    if (!prod) throw new Error('Producto no encontrado');

    let inv = this.inventario.find((i) => i.producto_id === dto.productoId);
    const now = new Date().toISOString();

    if (!inv) {
      inv = {
        id: `inv-${Date.now()}`,
        producto_id: dto.productoId,
        stock_actual: 0,
        ultima_actualizacion: now,
        created_at: now,
        updated_at: now,
      };
      this.inventario.push(inv);
    }

    const stockAnterior = inv.stock_actual;
    const stockPosterior = stockAnterior + dto.cantidad;

    inv.stock_actual = stockPosterior;
    inv.ultima_actualizacion = now;
    inv.updated_at = now;
    this.save(STORAGE_KEYS.INVENTARIO, this.inventario);

    const mov: MovimientoInventarioApi = {
      id: crearIdMock('mov'),
      producto_id: dto.productoId,
      tipo: 'entrada',
      cantidad: dto.cantidad,
      stock_anterior: stockAnterior,
      stock_posterior: stockPosterior,
      costo_unitario: dto.costoUnitario !== undefined && dto.costoUnitario !== null ? Number(dto.costoUnitario) : null,
      motivo: dto.motivo,
      observaciones: dto.observaciones?.trim() || (dto.proveedor ? `Proveedor: ${dto.proveedor}` : null),
      registrado_por: registradoPor,
      created_at: now,
    };

    this.movimientos.unshift(mov);
    this.save(STORAGE_KEYS.MOVIMIENTOS, this.movimientos);

    return { movimiento: mov, inventario: inv };
  }

  registrarSalida(dto: RegistrarSalidaDto, registradoPor: string): {
    movimiento: MovimientoInventarioApi;
    inventario: InventarioApi;
  } {
    if (!dto.productoId || dto.cantidad <= 0 || !dto.motivo) {
      throw new Error('Datos de salida inválidos. Cantidad y motivo obligatorios.');
    }

    const prod = this.productos.find((p) => p.id === dto.productoId);
    if (!prod) throw new Error('Producto no encontrado');

    const inv = this.inventario.find((i) => i.producto_id === dto.productoId);
    if (!inv || inv.stock_actual < dto.cantidad) {
      throw new Error(`Stock insuficiente. Disponible actual: ${inv?.stock_actual ?? 0}`);
    }

    const now = new Date().toISOString();
    const stockAnterior = inv.stock_actual;
    const stockPosterior = stockAnterior - dto.cantidad;

    inv.stock_actual = stockPosterior;
    inv.ultima_actualizacion = now;
    inv.updated_at = now;
    this.save(STORAGE_KEYS.INVENTARIO, this.inventario);

    const mov: MovimientoInventarioApi = {
      id: crearIdMock('mov'),
      producto_id: dto.productoId,
      tipo: 'salida',
      cantidad: dto.cantidad,
      stock_anterior: stockAnterior,
      stock_posterior: stockPosterior,
      costo_unitario: null,
      motivo: dto.motivo,
      observaciones: dto.observaciones?.trim() || null,
      registrado_por: registradoPor,
      created_at: now,
    };

    this.movimientos.unshift(mov);
    this.save(STORAGE_KEYS.MOVIMIENTOS, this.movimientos);

    // Verificar si genera alerta de stock bajo o agotado
    if (stockPosterior === 0) {
      this.generarAlerta(dto.productoId, 'stock_agotado', `Stock agotado para "${prod.nombre}". Existencia: 0.`);
    } else if (stockPosterior <= prod.stock_minimo) {
      this.generarAlerta(
        dto.productoId,
        'stock_bajo',
        `Stock bajo para "${prod.nombre}". Actual: ${stockPosterior}, Mínimo: ${prod.stock_minimo}.`
      );
    }

    return { movimiento: mov, inventario: inv };
  }

  // Alertas
  getAlertas(): AlertaApi[] {
    return [...this.alertas].sort(
      (a, b) => new Date(b.fecha_generacion).getTime() - new Date(a.fecha_generacion).getTime()
    );
  }

  generarAlerta(productoId: string, tipo: 'stock_bajo' | 'stock_agotado' | 'sistema' | 'informacion', mensaje: string): AlertaApi {
    const prod = this.productos.find((p) => p.id === productoId);
    const inv = this.inventario.find((i) => i.producto_id === productoId);

    const nuevaAlerta: AlertaApi = {
      id: `alt-${Date.now()}`,
      producto_id: productoId,
      tipo,
      mensaje,
      stock_actual: inv?.stock_actual ?? 0,
      stock_minimo: prod?.stock_minimo ?? 0,
      estado: 'pendiente',
      fecha_generacion: new Date().toISOString(),
    };

    this.alertas.unshift(nuevaAlerta);
    this.save(STORAGE_KEYS.ALERTAS, this.alertas);
    return nuevaAlerta;
  }

  updateAlertaEstado(id: string, estado: 'pendiente' | 'leida' | 'resuelta'): AlertaApi {
    const index = this.alertas.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Alerta no encontrada');
    this.alertas[index].estado = estado;
    this.save(STORAGE_KEYS.ALERTAS, this.alertas);
    return this.alertas[index];
  }
}
