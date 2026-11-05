import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Producto,
  ProductoApi,
  mapProductoFromApi,
  mapProductoToApi,
} from '../models/producto.model';

export interface FiltrosProducto {
  search?: string;
  categoriaId?: string;
  marcaId?: string;
  includeInactivos?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  listar(filtros?: FiltrosProducto): Observable<Producto[]> {
    let params = new HttpParams();
    if (filtros?.search?.trim()) {
      params = params.set('search', filtros.search.trim());
    }
    if (filtros?.categoriaId) {
      params = params.set('categoria_id', filtros.categoriaId);
    }
    if (filtros?.marcaId) {
      params = params.set('marca_id', filtros.marcaId);
    }
    if (filtros?.includeInactivos) {
      params = params.set('include_inactivos', 'true');
    }

    return this.http
      .get<ProductoApi[]>(this.baseUrl, { params })
      .pipe(map((items) => items.map(mapProductoFromApi)));
  }

  obtenerPorId(id: string): Observable<Producto> {
    return this.http
      .get<ProductoApi>(`${this.baseUrl}/${id}`)
      .pipe(map(mapProductoFromApi));
  }

  crear(producto: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>): Observable<Producto> {
    // Un producto nuevo siempre nace activo, aunque el formulario rápido no envíe el campo.
    const payload = mapProductoToApi({ activo: true, ...producto });
    return this.http
      .post<ProductoApi>(this.baseUrl, payload)
      .pipe(map(mapProductoFromApi));
  }

  actualizar(id: string, producto: Partial<Producto>): Observable<Producto> {
    const payload = mapProductoToApi(producto);
    return this.http
      .put<ProductoApi>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(mapProductoFromApi));
  }

  cambiarEstado(id: string): Observable<Producto> {
    return this.http
      .patch<ProductoApi>(`${this.baseUrl}/${id}/activo`, {})
      .pipe(map(mapProductoFromApi));
  }
}
