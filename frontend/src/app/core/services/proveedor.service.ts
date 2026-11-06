import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CrearProveedorDto,
  mapProveedorFromApi,
  mapProveedorToApi,
  Proveedor,
  ProveedorApi,
} from '../models/proveedor.model';

export interface FiltrosProveedor {
  busqueda?: string;
  activo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProveedorService {
  private readonly baseUrl = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) {}

  listar(filtros?: FiltrosProveedor): Observable<Proveedor[]> {
    let params = new HttpParams();
    if (filtros?.busqueda?.trim()) {
      params = params.set('busqueda', filtros.busqueda.trim());
    }
    if (filtros?.activo !== undefined) {
      params = params.set('activo', filtros.activo ? 'true' : 'false');
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
      .get<any>(this.baseUrl, { params })
      .pipe(
        map((res) => {
          const items: ProveedorApi[] = Array.isArray(res) ? res : (res?.content ?? []);
          return items.map(mapProveedorFromApi);
        })
      );
  }

  obtenerPorId(id: string): Observable<Proveedor> {
    return this.http
      .get<ProveedorApi>(`${this.baseUrl}/${id}`)
      .pipe(map(mapProveedorFromApi));
  }

  crear(dto: CrearProveedorDto): Observable<Proveedor> {
    return this.http
      .post<ProveedorApi>(this.baseUrl, dto)
      .pipe(map(mapProveedorFromApi));
  }

  actualizar(id: string, dto: Partial<CrearProveedorDto>): Observable<Proveedor> {
    return this.http
      .put<ProveedorApi>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(mapProveedorFromApi));
  }

  cambiarEstado(id: string): Observable<Proveedor> {
    return this.http
      .patch<ProveedorApi>(`${this.baseUrl}/${id}/activo`, {})
      .pipe(map(mapProveedorFromApi));
  }
}
