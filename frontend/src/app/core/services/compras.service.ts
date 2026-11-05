import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Compra,
  CompraApi,
  CompraLegacyInput,
  DetalleCompraLegacy,
  mapCompraFromApi,
  mapCompraToApi,
} from '../models/compra.model';
import { Proveedor, ProveedorApi, mapProveedorFromApi, mapProveedorToApi } from '../models/proveedor.model';

export type ProveedorForm = Pick<Proveedor, 'ruc' | 'razonSocial'> &
  Partial<Pick<Proveedor, 'nombreContacto' | 'telefono' | 'email' | 'direccion' | 'activo'>>;

export interface CrearCompra {
  proveedorId: string;
  fecha: string;
  detalles: Array<Pick<DetalleCompraLegacy, 'productoId' | 'cantidad' | 'costoUnitario'>>;
  observaciones?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarProveedores(): Observable<Proveedor[]> {
    return this.http
      .get<ProveedorApi[]>(`${this.baseUrl}/proveedores`)
      .pipe(map((items) => items.map(mapProveedorFromApi)));
  }

  crearProveedor(proveedor: ProveedorForm): Observable<Proveedor> {
    return this.http
      .post<ProveedorApi>(`${this.baseUrl}/proveedores`, mapProveedorToApi(proveedor))
      .pipe(map(mapProveedorFromApi));
  }

  actualizarProveedor(id: string, proveedor: Partial<Proveedor>): Observable<Proveedor> {
    return this.http
      .put<ProveedorApi>(`${this.baseUrl}/proveedores/${id}`, mapProveedorToApi(proveedor))
      .pipe(map(mapProveedorFromApi));
  }

  listarCompras(): Observable<Compra[]> {
    return this.http
      .get<CompraApi[]>(`${this.baseUrl}/compras`)
      .pipe(map((items) => items.map(mapCompraFromApi)));
  }

  crearCompra(dto: CrearCompra): Observable<Compra> {
    const compraApi = mapCompraToApi({
      proveedorId: dto.proveedorId,
      fecha: dto.fecha,
      estado: 'pendiente',
      detalles: dto.detalles.map((detalle) => ({
        ...detalle,
        subtotal: detalle.cantidad * detalle.costoUnitario,
      })),
      observaciones: dto.observaciones?.trim() || null,
    });
    return this.http
      .post<CompraApi>(`${this.baseUrl}/compras`, compraApi)
      .pipe(map(mapCompraFromApi));
  }

  recibirCompra(id: string): Observable<Compra> {
    return this.http
      .post<CompraApi>(`${this.baseUrl}/compras/${id}/recibir`, {})
      .pipe(map(mapCompraFromApi));
  }

  anularCompra(id: string, motivo: string): Observable<Compra> {
    return this.http
      .post<CompraApi>(`${this.baseUrl}/compras/${id}/anular`, { motivo })
      .pipe(map(mapCompraFromApi));
  }
}
