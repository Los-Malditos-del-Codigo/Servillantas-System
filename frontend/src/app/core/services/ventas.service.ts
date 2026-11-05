import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Venta, VentaApi, mapVentaFromApi } from '../models/venta.model';

export interface CrearVenta {
  cliente: string;
  documentoCliente?: string;
  telefono?: string;
  medioPago: string;
  detalles: Array<{ productoId: string; cantidad: number }>;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly url = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Venta[]> {
    return this.http.get<VentaApi[]>(this.url).pipe(map((items) => items.map(mapVentaFromApi)));
  }

  registrar(dto: CrearVenta): Observable<Venta> {
    return this.http.post<VentaApi>(this.url, {
      cliente: dto.cliente,
      documento_cliente: dto.documentoCliente ?? '',
      telefono: dto.telefono ?? '',
      medio_pago: dto.medioPago,
      detalles: dto.detalles.map((detalle) => ({
        producto_id: detalle.productoId,
        cantidad: detalle.cantidad,
      })),
      observaciones: dto.observaciones?.trim() || null,
    }).pipe(map(mapVentaFromApi));
  }
}
