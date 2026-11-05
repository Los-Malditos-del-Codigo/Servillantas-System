import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CrearMaterialDto,
  CrearServicioDto,
  mapMaterialFromApi,
  mapServicioDetalleFromApi,
  mapServicioResumenFromApi,
  MaterialServicio,
  MaterialServicioApi,
  ServicioDetalle,
  ServicioDetalleApi,
  ServicioResumen,
  ServicioResumenApi,
} from '../models/servicio.model';
import { PageResponse } from '../models/compra.model';

export interface FiltrosServicio {
  tipoServicioId?: string;
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
export class ServicioService {
  private readonly baseUrl = `${environment.apiUrl}/servicios`;

  constructor(private http: HttpClient) {}

  listar(filtros?: FiltrosServicio): Observable<PageResponse<ServicioResumen>> {
    let params = new HttpParams();
    if (filtros?.tipoServicioId) {
      params = params.set('tipoServicioId', filtros.tipoServicioId);
    }
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
      .get<PageResponse<ServicioResumenApi>>(this.baseUrl, { params })
      .pipe(
        map((res) => ({
          ...res,
          content: (res.content || []).map(mapServicioResumenFromApi),
        }))
      );
  }

  obtenerPorId(id: string): Observable<ServicioDetalle> {
    return this.http
      .get<ServicioDetalleApi>(`${this.baseUrl}/${id}`)
      .pipe(map(mapServicioDetalleFromApi));
  }

  crear(dto: CrearServicioDto, idempotencyKey: string, correlationId?: string): Observable<ServicioDetalle> {
    let headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
    if (correlationId) {
      headers = headers.set('X-Correlation-Id', correlationId);
    }

    return this.http
      .post<ServicioDetalleApi>(this.baseUrl, dto, { headers })
      .pipe(map(mapServicioDetalleFromApi));
  }

  agregarMaterial(servicioId: string, dto: CrearMaterialDto, idempotencyKey: string, correlationId?: string): Observable<MaterialServicio> {
    let headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
    if (correlationId) {
      headers = headers.set('X-Correlation-Id', correlationId);
    }

    return this.http
      .post<MaterialServicioApi>(`${this.baseUrl}/${servicioId}/materiales`, dto, { headers })
      .pipe(map(mapMaterialFromApi));
  }

  anular(servicioId: string, motivo: string, idempotencyKey: string, correlationId?: string): Observable<ServicioDetalle> {
    let headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
    if (correlationId) {
      headers = headers.set('X-Correlation-Id', correlationId);
    }

    return this.http
      .post<ServicioDetalleApi>(`${this.baseUrl}/${servicioId}/anulacion`, { motivo }, { headers })
      .pipe(map(mapServicioDetalleFromApi));
  }
}
