import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertasService } from '../../core/services/alertas.service';
import { ToastAlertasComponent } from '../../shared/components/toast/toast.component';
import { InventoryAssistantComponent } from '../../shared/components/inventory-assistant/inventory-assistant.component';
import { Alerta } from '../../core/models/alerta.model';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastAlertasComponent, InventoryAssistantComponent],
  template: `
    <div class="shell-layout">
      <!-- Barra Superior Fija -->
      <header class="top-header">
        <div class="top-header-inner">
          <div class="brand-block">
            <img src="servillantaslogo.png" alt="Servillantas RV" class="brand-logo-img" />
            <div class="brand-text">
              <span class="system-title">Servillantas RV</span>
            </div>
          </div>

          <div class="header-right">
            <!-- Campana de Notificaciones -->
            <div class="notification-wrapper">
              <button
                type="button"
                class="btn-bell"
                (click)="toggleMenuAlertas()"
                [attr.aria-expanded]="menuAlertasAbierto()"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                @if (alertasService.pendientesCount() > 0) {
                  <span class="bell-badge">{{ alertasService.pendientesCount() }}</span>
                }
              </button>

              <!-- Menú Desplegable de Alertas -->
              @if (menuAlertasAbierto()) {
                <div class="alerts-dropdown" role="menu">
                    <div class="alerts-dropdown-header">
                      <div>
                        <h4 class="dropdown-title">Alertas de Inventario</h4>
                        <span class="dropdown-subtitle">{{ alertasService.pendientesCount() }} pendientes de atención</span>
                      </div>
                    </div>

                  <div class="alerts-list">
                    @if (alertasService.alertas().length === 0) {
                      <div class="empty-alerts">
                        No hay alertas registradas en el sistema.
                      </div>
                    } @else {
                      @for (item of alertasService.alertas().slice(0, 6); track item.id) {
                        <div class="alert-item" [class.is-read]="item.estado !== 'pendiente'">
                          <div class="alert-item-header">
                            <span
                              class="badge"
                              [class.badge-danger]="item.tipo === 'stock_agotado'"
                              [class.badge-warning]="item.tipo === 'stock_bajo'"
                            >
                              {{ item.tipo === 'stock_agotado' ? 'Agotado' : 'Stock Bajo' }}
                            </span>
                            <span class="alert-time">{{ formatearHora(item.fechaGeneracion) }}</span>
                          </div>
                          <p class="alert-item-text">{{ item.mensaje }}</p>
                          <div class="alert-item-footer">
                            <span class="alert-qty font-mono">Stock: {{ item.stockActual }} / Mín: {{ item.stockMinimo }}</span>
                            @if (item.estado === 'pendiente') {
                              <button
                                type="button"
                                class="btn-link"
                                (click)="marcarLeida(item.id)"
                              >
                                Marcar atendida
                              </button>
                            } @else {
                              <span class="text-muted text-xs">Atendida</span>
                            }
                          </div>
                        </div>
                      }
                    }
                  </div>
                  <a routerLink="/alertas" class="alerts-view-all" (click)="menuAlertasAbierto.set(false)">
                    Ver todas las alertas <span aria-hidden="true">→</span>
                  </a>
                </div>
              }
            </div>

            <!-- Datos de Usuario y Rol -->
            <div class="user-chip">
              <div class="user-avatar">
                {{ obtenerIniciales() }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ authService.perfil()?.nombres }} {{ authService.perfil()?.apellidos }}</span>
                <span class="user-role-badge" [class.role-admin]="authService.rol()?.nombre === 'propietario'">
                  {{ authService.rol()?.nombre === 'propietario' ? 'Propietario' : 'Personal' }}
                </span>
              </div>
            </div>

            <!-- Botón Salir -->
            <button
              type="button"
              class="btn-logout"
              (click)="cerrarSesion()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </div>

        <!-- Barra de Pestañas de Navegación -->
        <nav class="modules-nav">
          <div class="nav-inner">
            <!-- Módulos Activos -->
            <a
              routerLink="/inventario"
              routerLinkActive="active"
              class="nav-tab"
              id="nav-tab-inventario"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>Inventario</span>
            </a>

            <a
              routerLink="/productos"
              routerLinkActive="active"
              class="nav-tab"
              id="nav-tab-productos"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>Productos y Catálogo</span>
            </a>

            <!-- Módulos Secundarios -->
            <a routerLink="/compras" routerLinkActive="active" class="nav-tab" id="nav-tab-compras">
              <span>Compras y Prov.</span>
            </a>

            <a routerLink="/ventas" routerLinkActive="active" class="nav-tab" id="nav-tab-ventas">
              <span>Ventas</span>
            </a>

            <a routerLink="/taller" routerLinkActive="active" class="nav-tab" id="nav-tab-taller">
              <span>Servicios de Taller</span>
            </a>

            <a routerLink="/reportes" routerLinkActive="active" class="nav-tab" id="nav-tab-reportes">
              <span>Reportes</span>
            </a>

            <a routerLink="/alertas" routerLinkActive="active" class="nav-tab" id="nav-tab-alertas">
              <span>Alertas y Notif.</span>
              @if (alertasService.pendientesCount() > 0) {
                <span class="nav-alert-count">{{ alertasService.pendientesCount() }}</span>
              }
            </a>
          </div>
        </nav>
      </header>

      <!-- Contenido Principal -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Toast flotante de alertas en tiempo real -->
      <app-toast-alertas></app-toast-alertas>

      <!-- Asistente disponible en todas las rutas del sistema -->
      <app-inventory-assistant></app-inventory-assistant>
    </div>
  `,
  styles: [`
    .shell-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-app);
    }

    /* Top Header Fijo */
    .top-header {
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 900;
      box-shadow: 0 4px 18px rgba(30, 55, 68, 0.035);
      backdrop-filter: blur(14px);
    }

    .top-header-inner {
      max-width: 1360px;
      margin: 0 auto;
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-img {
      height: 38px;
      width: auto;
      object-fit: contain;
      border-radius: var(--radius-sm);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .system-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }



    .header-right {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    /* Campana y Dropdown */
    .notification-wrapper {
      position: relative;
    }

    .btn-bell {
      position: relative;
      background-color: var(--surface-subtle);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color var(--transition-fast);

      &:hover {
        background-color: #E2E5E9;
      }
    }

    .bell-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background-color: var(--state-danger);
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 10px;
      line-height: 1.2;
      border: 2px solid #FFFFFF;
    }

    .alerts-dropdown {
      position: absolute;
      top: 44px;
      right: 0;
      width: 380px;
      background-color: #FFFFFF;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 0 8px 24px rgba(30, 36, 48, 0.12);
      z-index: 1050;
      animation: fadeIn 150ms ease-out;
    }

    .alerts-dropdown-header {
      padding: 12px 16px;
      background-color: var(--surface-subtle);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .dropdown-title {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .dropdown-subtitle {
      font-size: 11.5px;
      color: var(--text-secondary);
    }

    .alerts-list {
      max-height: 360px;
      overflow-y: auto;
    }

    .alerts-view-all {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid var(--border-color);
      color: var(--accent-primary);
      font-size: 12px;
      font-weight: 650;
      &:hover { background: var(--surface-subtle); }
    }

    .nav-alert-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 999px;
      color: #fff;
      background: var(--state-danger);
      font-size: 10px;
      font-weight: 700;
    }

    .empty-alerts {
      padding: 24px 16px;
      text-align: center;
      font-size: 12.5px;
      color: var(--text-secondary);
    }

    .alert-item {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      transition: background-color var(--transition-fast);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: var(--surface-hover);
      }

      &.is-read {
        opacity: 0.65;
      }
    }

    .alert-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .alert-time {
      font-size: 11px;
      color: var(--text-muted);
    }

    .alert-item-text {
      font-size: 12.5px;
      color: var(--text-primary);
      margin-bottom: 8px;
      line-height: 1.35;
    }

    .alert-item-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11.5px;
    }

    .alert-qty {
      color: var(--text-secondary);
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--accent-primary);
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;

      &:hover {
        text-decoration: underline;
      }
    }

    /* Usuario */
    .user-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px;
      background-color: var(--surface-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: var(--accent-subtle);
      color: var(--accent-primary);
      border: 1px solid var(--accent-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .user-role-badge {
      font-size: 10.5px;
      font-weight: 600;
      color: var(--text-secondary);

      &.role-admin {
        color: var(--accent-primary);
      }
    }

    .btn-logout {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background-color: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: background-color var(--transition-fast), color var(--transition-fast);

      &:hover {
        background-color: var(--state-danger-bg);
        border-color: var(--state-danger-border);
        color: var(--state-danger);
      }
    }

    /* Fila de Pestañas */
    .modules-nav {
      background: linear-gradient(180deg, #FFFFFF, #FBFCFC);
      border-top: 1px solid rgba(226, 229, 233, 0.8);
      padding: 5px 28px 7px;
    }

    .nav-inner {
      max-width: 1360px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 15px;
      font-size: 12.5px;
      font-weight: 550;
      color: var(--text-secondary);
      border: 1px solid transparent;
      border-radius: 9px;
      transition: color var(--transition-fast), border-color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
      white-space: nowrap;

      &:hover:not(.disabled) {
        color: var(--accent-active);
        background-color: var(--surface-subtle);
        transform: translateY(-1px);
      }

      &.active {
        color: var(--accent-primary);
        font-weight: 650;
        border-color: rgba(156, 181, 193, 0.58);
        background: linear-gradient(135deg, #EDF3F5, #F6F9FA);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.75), 0 3px 9px rgba(46, 90, 108, .06);
      }

      &.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        color: var(--text-muted);
      }
    }

    /* Área Principal */
    .main-content {
      max-width: 1360px;
      width: 100%;
      margin: 0 auto;
      padding: 30px 28px;
      flex: 1;
    }

    @media (max-width: 760px) {
      .top-header-inner {
        padding: 11px 16px;
      }

      .header-right {
        gap: 10px;
      }

      .modules-nav {
        padding: 5px 12px 7px;
      }

      .nav-inner {
        gap: 6px;
      }

      .nav-tab {
        padding: 9px 12px;
      }

      .main-content {
        padding: 22px 16px;
      }
    }

    @media (max-width: 480px) {
      .brand-logo-img {
        height: 32px;
      }

      .system-title {
        font-size: 14px;
      }

      .user-info {
        display: none;
      }

      .user-chip {
        padding: 4px;
        background: transparent;
        border-color: transparent;
      }

      .btn-logout {
        padding: 8px;
      }

      .btn-logout span {
        display: none;
      }
    }
  `],
})
export class ShellComponent {
  readonly authService = inject(AuthService);
  readonly alertasService = inject(AlertasService);
  private router = inject(Router);

  menuAlertasAbierto = signal<boolean>(false);

  toggleMenuAlertas(): void {
    this.menuAlertasAbierto.update((v) => !v);
  }

  marcarLeida(id: string): void {
    this.alertasService.marcarComoLeida(id).subscribe();
  }

  formatearHora(fechaIso: string): string {
    if (!fechaIso) return '';
    const d = new Date(fechaIso);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  obtenerIniciales(): string {
    const p = this.authService.perfil();
    if (!p) return 'RV';
    const n = p.nombres.charAt(0) || '';
    const a = p.apellidos.charAt(0) || '';
    return `${n}${a}`.toUpperCase();
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
