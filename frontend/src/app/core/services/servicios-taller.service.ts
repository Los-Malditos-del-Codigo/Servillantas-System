import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ServicioTaller,
  ServicioTallerApi,
  mapServicioTallerFromApi,
} from '../models/servicio-taller.model';

export interface CrearServicioTaller {
  cliente: string;
  documentoCliente?: string;
  telefono?: string;
  placa: string;
  vehiculo: string;
  descripcion: string;
  manoObra: number;
  medioPago: string;
  materiales: Array<{ productoId: string; cantidad: number }>;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class ServiciosTallerService {
  private readonly url = `${environment.apiUrl}/servicios-taller`;

  constructor(private http: HttpClient) {}

  listar(): Observable<ServicioTaller[]> {
    return this.http.get<ServicioTallerApi[]>(this.url).pipe(map((items) => items.map(mapServicioTallerFromApi)));
  }

  registrar(dto: CrearServicioTaller): Observable<ServicioTaller> {
    return this.http.post<ServicioTallerApi>(this.url, {
      cliente: dto.cliente,
      documento_cliente: dto.documentoCliente ?? '',
      telefono: dto.telefono ?? '',
      placa: dto.placa,
      vehiculo: dto.vehiculo,
      descripcion: dto.descripcion,
      mano_obra: dto.manoObra,
      medio_pago: dto.medioPago,
      materiales: dto.materiales.map((material) => ({
        producto_id: material.productoId,
        cantidad: material.cantidad,
      })),
      observaciones: dto.observaciones?.trim() || null,
    }).pipe(map(mapServicioTallerFromApi));
  }

  actualizarEstado(id: string, estado: 'completado' | 'cancelado'): Observable<ServicioTaller> {
    return this.http.patch<ServicioTallerApi>(`${this.url}/${id}/estado`, { estado })
      .pipe(map(mapServicioTallerFromApi));
  }
}
