import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, interval, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Alerta, AlertaApi, mapAlertaFromApi } from '../models/alerta.model';

const SOUND_STORAGE_KEY = 'srv_alertas_sonido_activo';

@Injectable({
  providedIn: 'root',
})
export class AlertasService {
  private http = inject(HttpClient);
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
    return this.http
      .get<any>(this.baseUrl)
      .pipe(map((res) => { const items = Array.isArray(res) ? res : (res?.content || []); return items.map(mapAlertaFromApi); }))
      .pipe(
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
            list.map((item) => (item.id === id ? updated : item))
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
