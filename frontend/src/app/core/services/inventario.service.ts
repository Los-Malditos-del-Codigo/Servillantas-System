import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Inventario,
  InventarioApi,
  MovimientoInventario,
  MovimientoInventarioApi,
  RegistrarEntradaDto,
  RegistrarSalidaDto,
  mapInventarioFromApi,
  mapMovimientoFromApi,
} from '../models/inventario.model';

export interface FiltrosMovimiento {
  productoId?: string;
  tipo?: 'entrada' | 'salida';
  fechaDesde?: string;
  fechaHasta?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private readonly baseUrl = `${environment.apiUrl}/inventario`;

  constructor(private http: HttpClient) {}

  obtenerStock(): Observable<Inventario[]> {
    return this.http
      .get<InventarioApi[]>(`${this.baseUrl}/stock`)
      .pipe(map((items) => items.map(mapInventarioFromApi)));
  }

  obtenerStockPorProducto(productoId: string): Observable<Inventario> {
    return this.http
      .get<InventarioApi>(`${this.baseUrl}/stock/${productoId}`)
      .pipe(map(mapInventarioFromApi));
  }

  registrarEntrada(dto: RegistrarEntradaDto): Observable<{ movimiento: MovimientoInventario; inventario: Inventario }> {
    return this.http
      .post<{ movimiento: MovimientoInventarioApi; inventario: InventarioApi }>(`${this.baseUrl}/entradas`, dto)
      .pipe(
        map((res) => ({
          movimiento: mapMovimientoFromApi(res.movimiento),
          inventario: mapInventarioFromApi(res.inventario),
        }))
      );
  }

  registrarSalida(dto: RegistrarSalidaDto): Observable<{ movimiento: MovimientoInventario; inventario: Inventario }> {
    return this.http
      .post<{ movimiento: MovimientoInventarioApi; inventario: InventarioApi }>(`${this.baseUrl}/salidas`, dto)
      .pipe(
        map((res) => ({
          movimiento: mapMovimientoFromApi(res.movimiento),
          inventario: mapInventarioFromApi(res.inventario),
        }))
      );
  }

  listarMovimientos(filtros?: FiltrosMovimiento): Observable<MovimientoInventario[]> {
    let params = new HttpParams();
    if (filtros?.productoId) {
      params = params.set('producto_id', filtros.productoId);
    }
    if (filtros?.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros?.fechaDesde) {
      params = params.set('fecha_desde', filtros.fechaDesde);
    }
    if (filtros?.fechaHasta) {
      params = params.set('fecha_hasta', filtros.fechaHasta);
    }

    return this.http
      .get<MovimientoInventarioApi[]>(`${this.baseUrl}/movimientos`, { params })
      .pipe(map((items) => items.map(mapMovimientoFromApi)));
  }
}
