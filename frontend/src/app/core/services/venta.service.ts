import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CrearVentaDto,
  mapVentaDetalleFromApi,
  mapVentaResumenFromApi,
  VentaDetalle,
  VentaDetalleApi,
  VentaResumen,
  VentaResumenApi,
} from '../models/venta.model';
import { PageResponse } from '../models/compra.model';

export interface FiltrosVenta {
  estado?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VentaService {
  private readonly baseUrl = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  listar(filtros?: FiltrosVenta): Observable<PageResponse<VentaResumen>> {
    let params = new HttpParams();
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.desde) {
      params = params.set('desde', filtros.desde);
    }
    if (filtros?.hasta) {
      params = params.set('hasta', filtros.hasta);
    }
    if (filtros?.page !== undefined) {
      params = params.set('page', filtros.page.toString());
    }
    if (filtros?.size !== undefined) {
      params = params.set('size', filtros.size.toString());
    }
    if (filtros?.sortBy) {
      params = params.set('sortBy', filtros.sortBy);
    }
    if (filtros?.sortDir) {
      params = params.set('sortDir', filtros.sortDir);
    }

    return this.http
      .get<PageResponse<VentaResumenApi>>(this.baseUrl, { params })
      .pipe(
        map((res) => ({
          ...res,
          content: (res.content || []).map(mapVentaResumenFromApi),
        }))
      );
  }

  obtenerPorId(id: string): Observable<VentaDetalle> {
    return this.http
      .get<VentaDetalleApi>(`${this.baseUrl}/${id}`)
      .pipe(map(mapVentaDetalleFromApi));
  }

  crear(dto: CrearVentaDto, idempotencyKey: string, correlationId?: string): Observable<VentaDetalle> {
    let headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
    if (correlationId) {
      headers = headers.set('X-Correlation-Id', correlationId);
    }

    return this.http
      .post<VentaDetalleApi>(this.baseUrl, dto, { headers })
      .pipe(map(mapVentaDetalleFromApi));
  }

  anular(id: string, motivo: string, idempotencyKey: string, correlationId?: string): Observable<VentaDetalle> {
    let headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
    if (correlationId) {
      headers = headers.set('X-Correlation-Id', correlationId);
    }

    return this.http
      .post<VentaDetalleApi>(`${this.baseUrl}/${id}/anulacion`, { motivo }, { headers })
      .pipe(map(mapVentaDetalleFromApi));
  }
}
