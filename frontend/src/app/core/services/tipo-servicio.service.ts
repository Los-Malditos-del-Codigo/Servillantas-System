import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CrearTipoServicioDto,
  mapTipoServicioFromApi,
  TipoServicio,
  TipoServicioApi,
} from '../models/servicio.model';

@Injectable({
  providedIn: 'root',
})
export class TipoServicioService {
  private readonly baseUrl = `${environment.apiUrl}/tipos-servicio`;

  constructor(private http: HttpClient) {}

  listar(activo?: boolean): Observable<TipoServicio[]> {
    let params = new HttpParams();
    if (activo !== undefined) {
      params = params.set('activo', activo ? 'true' : 'false');
    }

    return this.http
      .get<TipoServicioApi[]>(this.baseUrl, { params })
      .pipe(map((items) => items.map(mapTipoServicioFromApi)));
  }

  listarActivos(): Observable<TipoServicio[]> {
    return this.listar(true);
  }

  listarTodos(): Observable<TipoServicio[]> {
    return this.listar(undefined);
  }

  crear(dto: CrearTipoServicioDto): Observable<TipoServicio> {
    return this.http
      .post<TipoServicioApi>(this.baseUrl, dto)
      .pipe(map(mapTipoServicioFromApi));
  }

  actualizar(id: string, dto: Partial<CrearTipoServicioDto>): Observable<TipoServicio> {
    return this.http
      .put<TipoServicioApi>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(mapTipoServicioFromApi));
  }

  cambiarEstado(id: string): Observable<TipoServicio> {
    return this.http
      .patch<TipoServicioApi>(`${this.baseUrl}/${id}/activo`, {})
      .pipe(map(mapTipoServicioFromApi));
  }
}
