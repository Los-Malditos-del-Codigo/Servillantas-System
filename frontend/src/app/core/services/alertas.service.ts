import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, interval, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Alerta, AlertaApi, TipoAlerta, mapAlertaFromApi } from '../models/alerta.model';
import { Producto } from '../models/producto.model';
import { Inventario } from '../models/inventario.model';
import { ProductoService } from './producto.service';
import { InventarioService } from './inventario.service';

const SOUND_STORAGE_KEY = 'srv_alertas_sonido_activo';

@Injectable({
  providedIn: 'root',
})
export class AlertasService {
  private http = inject(HttpClient);
  private productoService = inject(ProductoService);
  private inventarioService = inject(InventarioService);
  private readonly baseUrl = `${environment.apiUrl}/alertas`;

  private alertasSignal = signal<Alerta[]>([]);
  readonly alertas = computed(() => this.alertasSignal());
  readonly pendientes = computed(() => this.alertasSignal().filter((a) => a.estado === 'pendiente'));
  readonly pendientesCount = computed(() => this.pendientes().length);

  // Señal de configuración de audio
  readonly sonidoActivo = signal<boolean>(this.loadSoundPref());

  // Emisión en tiempo real simulada
  private alertaNuevaSubject = new Subject<Alerta>();
  readonly alertaNueva$ = this.alertaNuevaSubject.asObservable();

  private simSubscription?: Subscription;

  constructor() {
    this.cargarAlertasIniciales();
    this.iniciarSimuladorTiempoReal();
  }

  private loadSoundPref(): boolean {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val !== null ? val === 'true' : true;
  }

  toggleSonido(): boolean {
    const nextVal = !this.sonidoActivo();
    this.sonidoActivo.set(nextVal);
    localStorage.setItem(SOUND_STORAGE_KEY, String(nextVal));
    return nextVal;
  }

  cargarAlertasIniciales(): void {
    this.obtenerAlertas()
      .subscribe({
        error: (err) => console.warn('Error al cargar alertas', err),
      });
  }

  obtenerAlertas(): Observable<Alerta[]> {
    return forkJoin({
      alertasRes: this.http.get<any>(`${this.baseUrl}?size=100`).pipe(catchError(() => of({ content: [] }))),
      productos: this.productoService.listar({ includeInactivos: true }).pipe(catchError(() => of([] as Producto[]))),
      stocks: this.inventarioService.obtenerStock().pipe(catchError(() => of([] as Inventario[]))),
    }).pipe(
      switchMap(({ alertasRes, productos, stocks }) => {
        const items: AlertaApi[] = Array.isArray(alertasRes) ? alertasRes : (alertasRes?.content || []);
        const alertasBase = items.map(mapAlertaFromApi);

        const prodMap = new Map<string, Producto>(productos.map((p) => [p.id, p] as [string, Producto]));
        const stockMap = new Map<string, number>(stocks.map((s) => [s.productoId, s.stockActual] as [string, number]));

        // Detectar productos activos con stock bajo/agotado que aún no tengan alerta activa
        const faltantes = productos.filter((p) => {
          if (!p.activo) return false;
          const stockActual = stockMap.get(p.id);
          if (stockActual === undefined) return false;
          if (stockActual > p.stockMinimo) return false;
          const yaExiste = alertasBase.some((a) => a.productoId === p.id && a.estado !== 'resuelta');
          return !yaExiste;
        });

        const enriquecer = (lista: Alerta[]): Alerta[] =>
          lista.map((a) => {
            const prod = prodMap.get(a.productoId);
            const stockActual: number = stockMap.get(a.productoId) ?? a.stockActual ?? 0;
            const stockMinimo: number = prod?.stockMinimo ?? a.stockMinimo ?? 0;
            const tipo: TipoAlerta =
              (a.tipo === 'stock_bajo' || a.tipo === 'stock_agotado') && stockActual === 0
                ? 'stock_agotado'
                : a.tipo;
            return {
              ...a,
              tipo,
              stockActual,
              stockMinimo,
            };
          });

        if (faltantes.length === 0) {
          return of(enriquecer(alertasBase));
        }

        const creaciones$ = faltantes.map((p) => {
          const stockActual = stockMap.get(p.id) ?? 0;
          const mensaje =
            stockActual === 0
              ? `Stock agotado: ${p.nombre} (${p.codigo}) no cuenta con unidades disponibles (mínimo requerido: ${p.stockMinimo}).`
              : `Stock bajo: ${p.nombre} (${p.codigo}) cuenta con ${stockActual} unidad(es) disponibles (mínimo requerido: ${p.stockMinimo}).`;
          return this.http
            .post<AlertaApi>(this.baseUrl, { producto_id: p.id, mensaje })
            .pipe(
              map(mapAlertaFromApi),
              catchError(() => of(null))
            );
        });

        return forkJoin(creaciones$).pipe(
          map((nuevas) => {
            const creadas = nuevas.filter((n): n is Alerta => n !== null);
            const idsExistentes = new Set(alertasBase.map((a) => a.id));
            const combinadas = [
              ...creadas.filter((c) => !idsExistentes.has(c.id)),
              ...alertasBase,
            ];
            return enriquecer(combinadas);
          })
        );
      }),
      tap((alertas) => {
        this.alertasSignal.set(alertas);
      })
    );
  }

  marcarComoLeida(id: string): Observable<Alerta> {
    return this.actualizarEstado(id, 'leida');
  }

  marcarComoResuelta(id: string): Observable<Alerta> {
    return this.actualizarEstado(id, 'resuelta');
  }

  marcarComoPendiente(id: string): Observable<Alerta> {
    return this.actualizarEstado(id, 'pendiente');
  }

  private actualizarEstado(id: string, estado: Alerta['estado']): Observable<Alerta> {
    return this.http
      .patch<AlertaApi>(`${this.baseUrl}/${id}/estado`, { estado })
      .pipe(
        map(mapAlertaFromApi),
        tap((updated) => {
          this.alertasSignal.update((list) =>
            list.map((item) =>
              item.id === id
                ? {
                    ...updated,
                    stockActual: item.stockActual,
                    stockMinimo: item.stockMinimo,
                    tipo: item.tipo,
                  }
                : item
            )
          );
        })
      );
  }

  // Simulador de alertas en tiempo real
  private iniciarSimuladorTiempoReal(): void {
    if (!environment.useMocks) return;

    // Intervalo discreto
    this.simSubscription = interval(45000).subscribe(() => {
      this.dispararAlertaSimuladaAleatoria();
    });
  }

  dispararAlertaSimuladaAleatoria(): void {
    const ejemplos = [
      {
        id: `alt-sim-${Date.now()}`,
        productoId: 'prod-06',
        tipo: 'stock_bajo' as const,
        mensaje: 'Alerta: Llanta Bridgestone Ecopia 195/65 R15 alcanzó stock crítico de 3 UND (mín: 4).',
        stockActual: 3,
        stockMinimo: 4,
        estado: 'pendiente' as const,
        fechaGeneracion: new Date().toISOString(),
      },
      {
        id: `alt-sim-${Date.now()}`,
        productoId: 'prod-11',
        tipo: 'stock_bajo' as const,
        mensaje: 'Alerta: Aceite Sintético Castrol EDGE 5W-30 Titanium cuenta con solo 4 Litros disponibles.',
        stockActual: 4,
        stockMinimo: 8,
        estado: 'pendiente' as const,
        fechaGeneracion: new Date().toISOString(),
      },
    ];

    const pick = ejemplos[Math.floor(Math.random() * ejemplos.length)];
    this.recibirAlerta(pick);
  }

  recibirAlerta(alerta: Alerta): void {
    // Agregar a la lista local
    this.alertasSignal.update((prev) => [alerta, ...prev]);
    // Emitir evento
    this.alertaNuevaSubject.next(alerta);
    // Reproducir tono sutil si está habilitado
    if (this.sonidoActivo()) {
      this.reproducirTonoDiscreto();
    }
  }

  private reproducirTonoDiscreto(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext bloqueado o no soportado sin interacción
    }
  }
}
