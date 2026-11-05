import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria, Marca, UnidadMedida } from '../models/catalogos.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogoService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /* Categorías */
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
  }

  getCategoriaById(id: string): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.baseUrl}/categorias/${id}`);
  }

  crearCategoria(categoria: { nombre: string; descripcion: string; activo?: boolean }): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.baseUrl}/categorias`, categoria);
  }

  actualizarCategoria(id: string, categoria: Partial<Categoria>): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/categorias/${id}`, categoria);
  }

  toggleCategoriaActivo(id: string): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.baseUrl}/categorias/${id}/activo`, {});
  }

  /* Marcas */
  getMarcas(): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.baseUrl}/marcas`);
  }

  getMarcaById(id: string): Observable<Marca> {
    return this.http.get<Marca>(`${this.baseUrl}/marcas/${id}`);
  }

  crearMarca(marca: { nombre: string; descripcion: string; activo?: boolean }): Observable<Marca> {
    return this.http.post<Marca>(`${this.baseUrl}/marcas`, marca);
  }

  actualizarMarca(id: string, marca: Partial<Marca>): Observable<Marca> {
    return this.http.put<Marca>(`${this.baseUrl}/marcas/${id}`, marca);
  }

  toggleMarcaActivo(id: string): Observable<Marca> {
    return this.http.patch<Marca>(`${this.baseUrl}/marcas/${id}/activo`, {});
  }

  /* Unidades de Medida */
  getUnidades(): Observable<UnidadMedida[]> {
    return this.http.get<UnidadMedida[]>(`${this.baseUrl}/unidades-medida`);
  }

  getUnidadById(id: string): Observable<UnidadMedida> {
    return this.http.get<UnidadMedida>(`${this.baseUrl}/unidades-medida/${id}`);
  }

  crearUnidad(unidad: { nombre: string; abreviatura: string; activo?: boolean }): Observable<UnidadMedida> {
    return this.http.post<UnidadMedida>(`${this.baseUrl}/unidades-medida`, unidad);
  }

  actualizarUnidad(id: string, unidad: Partial<UnidadMedida>): Observable<UnidadMedida> {
    return this.http.put<UnidadMedida>(`${this.baseUrl}/unidades-medida/${id}`, unidad);
  }

  toggleUnidadActivo(id: string): Observable<UnidadMedida> {
    return this.http.patch<UnidadMedida>(`${this.baseUrl}/unidades-medida/${id}/activo`, {});
  }
}
