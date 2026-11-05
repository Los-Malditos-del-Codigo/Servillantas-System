import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CompraDetalle,
  CompraDetalleApi,
  CompraResumen,
  CompraResumenApi,
  mapCompraDetalleFromApi,
  mapCompraResumenFromApi,
  PageResponse,
} from '../models/compra.model';

export interface CrearCompraDto {
  proveedorId: string;
  items: {
    productoId: string;
    cantidad: number;
    precioUnitario: number;
  }[];
}

export interface FiltrosCompra {
  proveedorId?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompraService {
  private readonly baseUrl = `${environment.apiUrl}/compras`;

  constructor(private http: HttpClient) {}

  listar(filtros?: FiltrosCompra): Observable<PageResponse<CompraResumen>> {
    let params = new HttpParams();
    if (filtros?.proveedorId) {
      params = params.set('proveedor_id', filtros.proveedorId);
    }
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.fechaInicio) {
      params = params.set('fecha_inicio', filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      params = params.set('fecha_fin', filtros.fechaFin);
    }
    if (filtros?.page !== undefined) {
      params = params.set('page', filtros.page.toString());
    }
    if (filtros?.size !== undefined) {
      params = params.set('size', filtros.size.toString());
    }
    if (filtros?.sort) {
      params = params.set('sort', filtros.sort);
    }

    return this.http
      .get<PageResponse<CompraResumenApi>>(this.baseUrl, { params })
      .pipe(
        map((res) => ({
          ...res,
          content: (res.content || []).map(mapCompraResumenFromApi),
        }))
      );
  }

  obtenerPorId(id: string): Observable<CompraDetalle> {
    return this.http
      .get<CompraDetalleApi>(`${this.baseUrl}/${id}`)
      .pipe(map(mapCompraDetalleFromApi));
  }

  crear(dto: CrearCompraDto, idempotencyKey: string, correlationId?: string): Observable<CompraDetalle> {
    let headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
    if (correlationId) {
      headers = headers.set('X-Correlation-Id', correlationId);
    }

    return this.http
      .post<CompraDetalleApi>(this.baseUrl, dto, { headers })
      .pipe(map(mapCompraDetalleFromApi));
  }

  recibir(id: string, idempotencyKey: string, correlationId?: string): Observable<CompraDetalle> {
    let headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
    if (correlationId) {
      headers = headers.set('X-Correlation-Id', correlationId);
    }

    return this.http
      .post<CompraDetalleApi>(`${this.baseUrl}/${id}/recepcion`, {}, { headers })
      .pipe(map(mapCompraDetalleFromApi));
  }

  anular(id: string, motivo: string, idempotencyKey: string, correlationId?: string): Observable<CompraDetalle> {
    let headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
    if (correlationId) {
      headers = headers.set('X-Correlation-Id', correlationId);
    }

    return this.http
      .post<CompraDetalleApi>(`${this.baseUrl}/${id}/anulacion`, { motivo }, { headers })
      .pipe(map(mapCompraDetalleFromApi));
  }
}
