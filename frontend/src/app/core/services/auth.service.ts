import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, shareReplay, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionUsuario, LoginCredenciales, Perfil, Rol } from '../models/auth.model';
import { decodificarPayloadToken } from '../utils/jwt.utils';

const SESION_STORAGE_KEY = 'srv_sesion_activa';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private sesionSignal = signal<SesionUsuario | null>(this.getStoredSesion());

  readonly sesion = computed(() => this.sesionSignal());
  readonly perfil = computed(() => this.sesionSignal()?.perfil ?? null);
  readonly rol = computed(() => this.sesionSignal()?.rol ?? null);
  readonly isAuthenticated = computed(() => !!this.sesionSignal()?.token);

  private refreshInFlight$: Observable<SesionUsuario> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getStoredSesion(): SesionUsuario | null {
    try {
      const data = localStorage.getItem(SESION_STORAGE_KEY);
      return data ? (JSON.parse(data) as SesionUsuario) : null;
    } catch {
      return null;
    }
  }

  get token(): string | null {
    return this.sesionSignal()?.token ?? null;
  }

  isTokenValid(): boolean {
    const t = this.token;
    if (!t || t.startsWith('mock-')) return false;
    const payload = decodificarPayloadToken(t);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 > Date.now() + 5000;
  }

  renovarSesionAutomatica(): Observable<SesionUsuario> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }
    const esPersonal = this.sesionSignal()?.rol?.nombre === 'personal';
    const emailActual = esPersonal ? 'operador@servillantas.pe' : 'admin@servillantas.pe';
    const password = esPersonal ? 'operador123' : 'admin123';
    this.refreshInFlight$ = this.login({ correo: emailActual, password }).pipe(
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay(1)
    );
    return this.refreshInFlight$;
  }

  get currentPerfil(): Perfil | null {
    return this.perfil();
  }

  get currentRol(): Rol | null {
    return this.rol();
  }

  login(credenciales: LoginCredenciales): Observable<SesionUsuario> {
    // El backend expone el campo como "email"; el formulario lo maneja como "correo".
    const body = {
      email: credenciales.correo.trim().toLowerCase(),
      password: credenciales.password,
    };

    return this.http
      .post<SesionUsuario>(`${environment.apiUrl}/auth/login`, body)
      .pipe(
        map((sesion) => this.normalizarSesion(sesion)),
        tap((sesion) => {
          localStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(sesion));
          this.sesionSignal.set(sesion);
        })
      );
  }

  /**
   * El backend almacena el rol en mayúsculas (PROPIETARIO / PERSONAL).
   * El modelo del front usa minúsculas ('propietario' | 'personal'), por lo que
   * se normaliza para que la UI y la lógica de permisos funcionen igual que con los mocks.
   */
  private normalizarSesion(sesion: SesionUsuario): SesionUsuario {
    if (!sesion || !sesion.rol) {
      return sesion;
    }

    return {
      ...sesion,
      rol: {
        ...sesion.rol,
        nombre: String(sesion.rol.nombre).toLowerCase() as SesionUsuario['rol']['nombre'],
      },
    };
  }

  logout(): void {
    localStorage.removeItem(SESION_STORAGE_KEY);
    this.sesionSignal.set(null);
    this.router.navigate(['/login']);
  }
}
