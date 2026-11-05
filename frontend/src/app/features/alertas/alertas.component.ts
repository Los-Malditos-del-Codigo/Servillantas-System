import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EstadoAlerta, TipoAlerta } from '../../core/models/alerta.model';
import { AlertasService } from '../../core/services/alertas.service';
import { environment } from '../../../environments/environment';

type FiltroEstado = 'todas' | EstadoAlerta;

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span> CENTRO DE ACTIVIDAD</span>
          <h1 class="page-title">Alertas y notificaciones</h1>
          <p class="page-subtitle">Supervisa el estado del inventario y da seguimiento a los avisos del sistema.</p>
        </div>
        <div class="header-actions">
          @if (esMock) {
            <button type="button" class="btn btn-secondary" (click)="probarAlerta()">
              <span aria-hidden="true">✦</span> Probar notificación
            </button>
          }
          <button type="button" class="btn btn-primary" (click)="actualizar()" [disabled]="cargando">
            <svg viewBox="0 0 24 24" aria-hidden="true" [class.spinning]="cargando">
              <path d="M20 7v5h-5M4 17v-5h5"></path>
              <path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"></path>
            </svg>
            {{ cargando ? 'Actualizando…' : 'Actualizar' }}
          </button>
        </div>
      </header>

      @if (error) {
        <div class="feedback feedback-error" role="alert">
          <span class="feedback-icon">!</span>
          <div><strong>No se pudieron cargar las alertas</strong><p>{{ error }}</p></div>
          <button type="button" class="btn btn-secondary btn-sm" (click)="actualizar()">Reintentar</button>
        </div>
      }
      @if (exito) {
        <div class="feedback feedback-success" role="status">{{ exito }}</div>
      }

      <section class="summary-grid" aria-label="Resumen de alertas">
        <article class="summary-card summary-total">
          <span class="summary-icon">◈</span>
          <div><span class="summary-label">Total de alertas</span><strong>{{ alertasService.alertas().length }}</strong></div>
          <span class="summary-caption">registradas</span>
        </article>
        <article class="summary-card summary-pending">
          <span class="summary-icon">!</span>
          <div><span class="summary-label">Pendientes</span><strong>{{ alertasService.pendientesCount() }}</strong></div>
          <span class="summary-caption">requieren atención</span>
        </article>
        <article class="summary-card summary-critical">
          <span class="summary-icon">⌁</span>
          <div><span class="summary-label">Stock agotado</span><strong>{{ agotadasCount }}</strong></div>
          <span class="summary-caption">reposición urgente</span>
        </article>
        <article class="summary-card summary-resolved">
          <span class="summary-icon">✓</span>
          <div><span class="summary-label">Resueltas</span><strong>{{ resueltasCount }}</strong></div>
          <span class="summary-caption">atendidas</span>
        </article>
      </section>

      <section class="panel preferences-panel">
        <div class="preferences-copy">
          <span class="sound-icon" aria-hidden="true">{{ alertasService.sonidoActivo() ? '♫' : '♪' }}</span>
          <div>
            <h2>Notificaciones sonoras</h2>
            <p>Reproduce un aviso discreto cuando llega una alerta nueva.</p>
          </div>
        </div>
        <button
          type="button"
          class="sound-toggle"
          [class.enabled]="alertasService.sonidoActivo()"
          [attr.aria-pressed]="alertasService.sonidoActivo()"
          (click)="alternarSonido()"
        >
          <span></span>{{ alertasService.sonidoActivo() ? 'Activadas' : 'Desactivadas' }}
        </button>
      </section>

      <section class="panel alerts-panel">
        <div class="list-heading">
          <div>
            <h2 class="section-title">Bandeja de alertas</h2>
            <p class="list-caption">Revisa avisos de stock y notificaciones del sistema.</p>
          </div>
          <span class="result-count">{{ alertasFiltradas.length }} resultado(s)</span>
        </div>

        <div class="filters">
          <label class="search-control">
            <span class="sr-only">Buscar alertas</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>
            </svg>
            <input class="form-control" type="search" [(ngModel)]="busqueda" placeholder="Buscar por mensaje o producto…" />
          </label>
          <label class="filter-control">
            <span>Estado</span>
            <select class="form-control" [(ngModel)]="filtroEstado">
              <option value="todas">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="leida">Leídas</option>
              <option value="resuelta">Resueltas</option>
            </select>
          </label>
          <label class="filter-control type-filter">
            <span>Tipo</span>
            <select class="form-control" [(ngModel)]="filtroTipo">
              <option value="todos">Todos los tipos</option>
              <option value="stock_agotado">Stock agotado</option>
              <option value="stock_bajo">Stock bajo</option>
              <option value="sistema">Sistema</option>
              <option value="informacion">Información</option>
            </select>
          </label>
        </div>

        @if (cargando && alertasService.alertas().length === 0) {
          <div class="loading-state"><span class="spinner spinner-dark"></span><span>Cargando notificaciones...</span></div>
        } @else if (alertasFiltradas.length === 0) {
          <div class="empty-state">
            <span class="empty-icon">✓</span>
            <strong>{{ alertasService.alertas().length === 0 ? 'Todo está al día' : 'No hay resultados' }}</strong>
            <p>{{ alertasService.alertas().length === 0 ? 'Cuando el sistema detecte una situación importante, aparecerá aquí.' : 'Prueba cambiando los filtros o el término de búsqueda.' }}</p>
            @if (filtroEstado !== 'todas' || filtroTipo !== 'todos' || busqueda) {
              <button type="button" class="btn btn-secondary btn-sm" (click)="limpiarFiltros()">Limpiar filtros</button>
            }
          </div>
        } @else {
          <div class="alert-list">
            @for (alerta of alertasFiltradas; track alerta.id) {
              <article
                class="alert-card"
                [class.is-pending]="alerta.estado === 'pendiente'"
                [class.is-critical]="alerta.tipo === 'stock_agotado'"
              >
                <div class="alert-symbol" [class.critical-symbol]="alerta.tipo === 'stock_agotado'" [class.info-symbol]="alerta.tipo === 'informacion' || alerta.tipo === 'sistema'">
                  @if (alerta.tipo === 'stock_agotado') { <span>!</span> }
                  @else if (alerta.tipo === 'stock_bajo') { <span>⌁</span> }
                  @else if (alerta.tipo === 'sistema') { <span>⚙</span> }
                  @else { <span>i</span> }
                </div>
                <div class="alert-content">
                  <div class="alert-meta">
                    <span class="badge" [ngClass]="claseTipo(alerta.tipo)">{{ etiquetaTipo(alerta.tipo) }}</span>
                    <span class="badge" [ngClass]="claseEstado(alerta.estado)">{{ etiquetaEstado(alerta.estado) }}</span>
                    <time [attr.datetime]="alerta.fechaGeneracion">{{ alerta.fechaGeneracion | date:'dd/MM/yyyy · HH:mm' }}</time>
                  </div>
                  <p class="alert-message">{{ alerta.mensaje }}</p>
                  @if (alerta.tipo === 'stock_bajo' || alerta.tipo === 'stock_agotado') {
                    <div class="stock-details">
                      <span>Disponible <strong [class.stock-danger]="alerta.stockActual === 0">{{ alerta.stockActual }}</strong></span>
                      <span class="stock-divider"></span>
                      <span>Mínimo <strong>{{ alerta.stockMinimo }}</strong></span>
                      @if (alerta.productoId) {
                        <a routerLink="/inventario" class="inventory-link">Ver inventario <span aria-hidden="true">↗</span></a>
                      }
                    </div>
                  }
                </div>
                <div class="alert-actions">
                  @if (alerta.estado !== 'resuelta') {
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      [disabled]="procesandoId === alerta.id"
                      (click)="alternarLectura(alerta.id, alerta.estado)"
                    >
                      {{ alerta.estado === 'pendiente' ? 'Marcar leída' : 'Marcar pendiente' }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      [disabled]="procesandoId === alerta.id"
                      (click)="resolver(alerta.id)"
                    >
                      {{ procesandoId === alerta.id ? 'Guardando…' : 'Resolver' }}
                    </button>
                  } @else {
                    <span class="resolved-mark">✓ Resuelta</span>
                  }
                </div>
              </article>
            }
          </div>
        }
      </section>
      <p class="page-footnote">Las alertas reflejan los avisos recibidos por el sistema. Actualiza la bandeja para consultar el estado más reciente.</p>
    </div>
  `,
  styles: [`
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: var(--accent-primary);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .12em;
    }
    .eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: #4b9b80; box-shadow: 0 0 0 4px rgba(75, 155, 128, .12); }
    .header-actions { align-items: center; }
    .header-actions svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .spinning { animation: spin 1s linear infinite; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
    .summary-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 13px;
      min-height: 104px;
      padding: 18px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      border-radius: 13px;
      background: linear-gradient(145deg, #fff, #fbfcfc);
      box-shadow: var(--surface-shadow);
    }
    .summary-card::after { position: absolute; right: -15px; bottom: -30px; width: 94px; height: 94px; border: 1px solid rgba(46,90,108,.07); border-radius: 50%; content: ''; }
    .summary-icon { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border: 1px solid #d5e3e7; border-radius: 12px; color: var(--accent-primary); background: #edf4f5; font-size: 19px; font-weight: 700; }
    .summary-pending .summary-icon { color: #a45b12; border-color: #f0dfc4; background: #fff7eb; }
    .summary-critical .summary-icon { color: #ae4239; border-color: #efd6d3; background: #fff1ef; }
    .summary-resolved .summary-icon { color: #3c825d; border-color: #d3e8da; background: #eff8f1; }
    .summary-card > div { display: flex; flex-direction: column; min-width: 0; }
    .summary-label { color: var(--text-secondary); font-size: 11px; font-weight: 600; }
    .summary-card strong { margin-top: 2px; color: var(--text-primary); font-size: 25px; line-height: 1.1; letter-spacing: -.04em; }
    .summary-caption { margin-left: auto; align-self: flex-end; color: var(--text-muted); font-size: 9px; white-space: nowrap; }
    .preferences-panel { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 78px; }
    .preferences-copy { display: flex; align-items: center; gap: 12px; }
    .sound-icon { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 11px; color: var(--accent-primary); background: var(--accent-subtle); font-size: 18px; }
    .preferences-copy h2 { font-size: 13px; font-weight: 650; }
    .preferences-copy p { margin-top: 2px; color: var(--text-secondary); font-size: 11px; }
    .sound-toggle { display: inline-flex; align-items: center; gap: 9px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 999px; color: var(--text-secondary); background: #fff; font: 600 11px var(--font-sans); cursor: pointer; }
    .sound-toggle > span { position: relative; width: 27px; height: 16px; border-radius: 20px; background: #cbd2d6; transition: background var(--transition-fast); }
    .sound-toggle > span::after { position: absolute; top: 3px; left: 3px; width: 10px; height: 10px; border-radius: 50%; background: #fff; content: ''; transition: transform var(--transition-fast); }
    .sound-toggle.enabled { color: var(--accent-primary); border-color: var(--accent-border); background: var(--accent-subtle); }
    .sound-toggle.enabled > span { background: var(--accent-primary); }
    .sound-toggle.enabled > span::after { transform: translateX(11px); }
    .alerts-panel { padding: 0 !important; overflow: hidden; }
    .list-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 24px 18px; }
    .list-caption { margin-top: 4px; color: var(--text-secondary); font-size: 11.5px; }
    .result-count { padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 999px; color: var(--text-secondary); background: #fafbfb; font-size: 10px; font-weight: 600; white-space: nowrap; }
    .filters { display: flex; align-items: flex-end; gap: 14px; padding: 0 24px 18px; border-bottom: 1px solid #edf0f2; }
    .search-control { position: relative; flex: 1; min-width: 220px; }
    .search-control > svg { position: absolute; z-index: 1; top: 13px; left: 12px; width: 16px; height: 16px; fill: none; stroke: #829099; stroke-width: 1.8; stroke-linecap: round; }
    .search-control .form-control { padding-left: 37px; }
    .filter-control { display: grid; gap: 5px; min-width: 155px; color: var(--text-secondary); font-size: 10px; font-weight: 600; }
    .filter-control .form-control { min-width: 155px; height: 40px; min-height: 40px; font-size: 11px; }
    .alert-list { display: grid; }
    .alert-card { position: relative; display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; align-items: start; gap: 14px; padding: 20px 24px; border-bottom: 1px solid #edf0f2; transition: background var(--transition-fast); }
    .alert-card:last-child { border-bottom: 0; }
    .alert-card:hover { background: linear-gradient(90deg, rgba(234,240,243,.45), transparent 70%); }
    .alert-card.is-pending::before { position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: #b8823f; content: ''; }
    .alert-card.is-critical.is-pending::before { background: var(--state-danger); }
    .alert-symbol { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid #f0dfc4; border-radius: 11px; color: #a45b12; background: #fff7eb; font-size: 17px; font-weight: 700; }
    .critical-symbol { border-color: #efd6d3; color: #b42318; background: #fff1ef; }
    .info-symbol { border-color: #d5e4ec; color: #356b83; background: #eff7fb; }
    .alert-content { min-width: 0; }
    .alert-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
    .alert-meta time { margin-left: auto; color: var(--text-muted); font-size: 10px; white-space: nowrap; }
    .badge { padding: 4px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; }
    .type-danger { color: #a33128; background: #fff0ee; }
    .type-warning { color: #92540c; background: #fff5e6; }
    .type-info { color: #346782; background: #edf6fa; }
    .type-neutral { color: #5b6472; background: #f0f2f4; }
    .status-pending { color: #92540c; background: #fff5e6; }
    .status-read { color: #506b77; background: #edf3f5; }
    .status-resolved { color: #34714d; background: #edf7f0; }
    .alert-message { margin: 9px 0 11px; color: var(--text-primary); font-size: 12px; line-height: 1.55; }
    .stock-details { display: flex; align-items: center; gap: 9px; color: var(--text-secondary); font-size: 10px; }
    .stock-details strong { margin-left: 3px; color: var(--text-primary); font-family: var(--font-mono); }
    .stock-details .stock-danger { color: var(--state-danger); }
    .stock-divider { width: 1px; height: 12px; background: var(--border-strong); }
    .inventory-link { margin-left: 5px; color: var(--accent-primary); font-weight: 650; }
    .inventory-link:hover { text-decoration: underline; }
    .alert-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; min-width: 204px; padding-top: 25px; }
    .resolved-mark { color: var(--state-success); font-size: 10px; font-weight: 650; }
    .feedback { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding: 12px 15px; border-radius: 10px; }
    .feedback > div { flex: 1; }
    .feedback strong { font-size: 12px; }
    .feedback p { margin-top: 2px; font-size: 11px; }
    .feedback-icon { display: grid; width: 24px; height: 24px; place-items: center; border-radius: 50%; font-weight: 700; }
    .feedback-error { border: 1px solid var(--state-danger-border); color: var(--state-danger); background: var(--state-danger-bg); }
    .feedback-error .feedback-icon { color: #fff; background: var(--state-danger); }
    .feedback-success { border: 1px solid var(--state-success-border); color: var(--state-success); background: var(--state-success-bg); font-size: 12px; }
    .empty-state { padding: 46px 24px; text-align: center; color: var(--text-secondary); }
    .empty-state strong { display: block; margin-top: 10px; color: var(--text-primary); font-size: 14px; }
    .empty-state p { margin: 4px 0 14px; font-size: 11px; }
    .empty-icon { display: inline-grid; width: 42px; height: 42px; place-items: center; border: 1px solid var(--state-success-border); border-radius: 14px; color: var(--state-success); background: var(--state-success-bg); font-size: 20px; font-weight: 700; }
    .page-footnote { margin: -4px 0 0 4px; color: var(--text-muted); font-size: 10px; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    @media (max-width: 900px) {
      .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .alert-card { grid-template-columns: 36px minmax(0, 1fr); }
      .alert-actions { grid-column: 2; justify-content: flex-start; min-width: 0; padding-top: 0; }
    }
    @media (max-width: 620px) {
      .summary-grid { gap: 10px; }
      .summary-card { min-height: 88px; gap: 9px; padding: 12px; }
      .summary-icon { width: 34px; height: 34px; }
      .summary-card strong { font-size: 21px; }
      .summary-caption { display: none; }
      .preferences-panel { align-items: flex-start; flex-direction: column; }
      .filters { align-items: stretch; flex-direction: column; padding: 0 16px 16px; }
      .search-control, .filter-control { min-width: 0; width: 100%; }
      .filter-control .form-control { width: 100%; }
      .list-heading { align-items: flex-start; padding: 18px 16px 14px; }
      .alert-card { gap: 10px; padding: 16px; }
      .alert-meta time { width: 100%; margin-left: 0; }
      .alert-actions { flex-wrap: wrap; }
      .alert-actions .btn { flex: 1; }
    }
  `],
})
export class AlertasComponent implements OnInit {
  readonly alertasService = inject(AlertasService);
  readonly esMock = environment.useMocks;
  busqueda = '';
  filtroEstado: FiltroEstado = 'todas';
  filtroTipo: 'todos' | TipoAlerta = 'todos';
  cargando = false;
  error = '';
  exito = '';
  procesandoId = '';

  ngOnInit(): void {
    this.actualizar();
  }

  get alertasFiltradas() {
    const consulta = this.normalizar(this.busqueda);
    return this.alertasService.alertas().filter((alerta) => {
      const coincideEstado = this.filtroEstado === 'todas' || alerta.estado === this.filtroEstado;
      const coincideTipo = this.filtroTipo === 'todos' || alerta.tipo === this.filtroTipo;
      const coincideBusqueda = !consulta || this.normalizar(alerta.mensaje).includes(consulta) || this.normalizar(alerta.productoId).includes(consulta);
      return coincideEstado && coincideTipo && coincideBusqueda;
    });
  }

  get agotadasCount(): number {
    return this.alertasService.alertas().filter((alerta) => alerta.tipo === 'stock_agotado' && alerta.estado !== 'resuelta').length;
  }

  get resueltasCount(): number {
    return this.alertasService.alertas().filter((alerta) => alerta.estado === 'resuelta').length;
  }

  actualizar(): void {
    if (this.cargando) return;
    this.cargando = true;
    this.error = '';
    this.exito = '';
    this.alertasService.obtenerAlertas().subscribe({
      next: () => { this.cargando = false; },
      error: () => {
        this.cargando = false;
        this.error = 'Verifica tu conexión y vuelve a intentarlo.';
      },
    });
  }

  alternarSonido(): void {
    this.alertasService.toggleSonido();
  }

  probarAlerta(): void {
    this.alertasService.dispararAlertaSimuladaAleatoria();
    this.exito = 'Se generó una notificación de prueba en este entorno mock.';
  }

  alternarLectura(id: string, estado: EstadoAlerta): void {
    const nuevoEstado: EstadoAlerta = estado === 'pendiente' ? 'leida' : 'pendiente';
    this.cambiarEstado(
      id,
      nuevoEstado,
      estado === 'pendiente' ? 'La alerta se marcó como leída.' : 'La alerta volvió a pendientes.'
    );
  }

  resolver(id: string): void {
    this.cambiarEstado(id, 'resuelta', 'La alerta fue marcada como resuelta.');
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = 'todas';
    this.filtroTipo = 'todos';
  }

  etiquetaTipo(tipo: TipoAlerta): string {
    return ({
      stock_bajo: 'Stock bajo',
      stock_agotado: 'Stock agotado',
      sistema: 'Sistema',
      informacion: 'Información',
    })[tipo];
  }

  claseTipo(tipo: TipoAlerta): string {
    if (tipo === 'stock_agotado') return 'type-danger';
    if (tipo === 'stock_bajo') return 'type-warning';
    if (tipo === 'informacion') return 'type-info';
    return 'type-neutral';
  }

  etiquetaEstado(estado: EstadoAlerta): string {
    return estado === 'pendiente' ? 'Pendiente' : estado === 'leida' ? 'Leída' : 'Resuelta';
  }

  claseEstado(estado: EstadoAlerta): string {
    return estado === 'pendiente' ? 'status-pending' : estado === 'leida' ? 'status-read' : 'status-resolved';
  }

  private cambiarEstado(id: string, estado: EstadoAlerta, mensaje: string): void {
    if (this.procesandoId) return;
    this.procesandoId = id;
    this.error = '';
    this.exito = '';
    const request = estado === 'resuelta'
      ? this.alertasService.marcarComoResuelta(id)
      : estado === 'pendiente'
        ? this.alertasService.marcarComoPendiente(id)
        : this.alertasService.marcarComoLeida(id);
    request.subscribe({
      next: () => {
        this.procesandoId = '';
        this.exito = mensaje;
      },
      error: () => {
        this.procesandoId = '';
        this.error = 'No se pudo actualizar la alerta. Inténtalo nuevamente.';
      },
    });
  }

  private normalizar(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
