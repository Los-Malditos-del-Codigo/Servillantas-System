import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventarioService } from '../../core/services/inventario.service';
import { ProductoService } from '../../core/services/producto.service';
import { ComprasService } from '../../core/services/compras.service';
import { VentasService } from '../../core/services/ventas.service';
import { ServiciosTallerService } from '../../core/services/servicios-taller.service';
import { MovimientoInventario } from '../../core/models/inventario.model';
import { Venta } from '../../core/models/venta.model';
import { Compra } from '../../core/models/compra.model';
import { ServicioTaller } from '../../core/models/servicio-taller.model';
import { Producto } from '../../core/models/producto.model';
import { CurrencyPenPipe } from '../../shared/pipes/currency-pen.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPenPipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Panel de control</h1>
          <p class="page-subtitle">Resumen de la operación de Servillantas RV.</p>
        </div>
        <span class="today">{{ hoy | date:'EEEE, d MMMM y' }}</span>
      </div>
      @if (error) { <div class="alert-box alert-error" role="alert">{{ error }}</div> }
      @if (cargando) {
        <div class="loading-state"><span class="spinner spinner-dark"></span><span>Preparando resumen...</span></div>
      } @else {
        <div class="kpi-grid">
          <a routerLink="/inventario" class="kpi-card">
            <span class="kpi-label">Productos activos</span><strong>{{ productosActivos }}</strong>
            <span class="kpi-note">{{ unidadesStock }} unidades en inventario</span>
          </a>
          <a routerLink="/inventario" class="kpi-card warning">
            <span class="kpi-label">Productos con stock bajo</span><strong>{{ stockBajo }}</strong>
            <span class="kpi-note">Revisa existencias y mínimos</span>
          </a>
          <a routerLink="/compras" class="kpi-card">
            <span class="kpi-label">Compras pendientes</span><strong>{{ comprasPendientes }}</strong>
            <span class="kpi-note">Órdenes por recibir</span>
          </a>
          <a routerLink="/ventas" class="kpi-card">
            <span class="kpi-label">Ventas de hoy</span><strong>{{ ventasHoy }}</strong>
            <span class="kpi-note">{{ totalVentasHoy | currencyPen }} vendidos</span>
          </a>
          <a routerLink="/servicios-taller" class="kpi-card">
            <span class="kpi-label">Servicios en proceso</span><strong>{{ serviciosEnProceso }}</strong>
            <span class="kpi-note">Órdenes activas del taller</span>
          </a>
        </div>

        <section class="chart-toolbar panel">
          <div>
            <h2>Actividad del negocio</h2>
            <p>Ventas y servicios agrupados por día.</p>
          </div>
          <label for="chartRange">Periodo</label>
          <select id="chartRange" class="form-control" [value]="periodoDias" (change)="cambiarPeriodo($event)">
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
        </section>

        <div class="charts-grid">
          <section class="panel chart-panel">
            <div class="chart-heading">
              <div><h2>Ingresos registrados</h2><p>Montos por día · PEN</p></div>
              <div class="legend"><span class="legend-sales"></span>Ventas <span class="legend-workshop"></span>Taller</div>
            </div>
            <div class="chart-scroll">
              <svg class="chart" viewBox="0 0 760 250" role="img" aria-label="Gráfico de ingresos diarios de ventas y taller">
                @for (guide of [0, 1, 2, 3]; track guide) {
                  <line x1="48" [attr.y1]="chartY(guide / 3)" x2="748" [attr.y2]="chartY(guide / 3)" class="grid-line"></line>
                  <text x="42" [attr.y]="chartY(guide / 3) + 4" text-anchor="end" class="axis-label">{{ chartMaxValue * (1 - guide / 3) | number:'1.0-0' }}</text>
                }
                <polyline [attr.points]="chartLine('ventas')" class="sales-line"></polyline>
                <polyline [attr.points]="chartLine('taller')" class="workshop-line"></polyline>
                @for (point of chartPoints; track point.key; let i = $index) {
                  @if (point.ventas > 0) { <circle [attr.cx]="chartX(i)" [attr.cy]="chartYValue(point.ventas)" r="3" class="sales-point"><title>{{ point.label }}: ventas {{ point.ventas | currencyPen }}</title></circle> }
                  @if (point.taller > 0) { <circle [attr.cx]="chartX(i)" [attr.cy]="chartYValue(point.taller)" r="3" class="workshop-point"><title>{{ point.label }}: taller {{ point.taller | currencyPen }}</title></circle> }
                  @if (i === 0 || i === chartPoints.length - 1 || i % chartLabelStep === 0) {
                    <text [attr.x]="chartX(i)" y="238" text-anchor="middle" class="axis-label">{{ point.label }}</text>
                  }
                }
              </svg>
            </div>
          </section>
          <section class="panel chart-panel">
            <div class="chart-heading">
              <div><h2>Operaciones por día</h2><p>Cantidad de ventas y órdenes de taller</p></div>
              <div class="legend"><span class="legend-sales"></span>Ventas <span class="legend-workshop"></span>Taller</div>
            </div>
            <div class="chart-scroll">
              <svg class="chart" viewBox="0 0 760 250" role="img" aria-label="Gráfico de cantidad diaria de operaciones">
                @for (guide of [0, 1, 2, 3]; track guide) {
                  <line x1="48" [attr.y1]="chartY(guide / 3)" x2="748" [attr.y2]="chartY(guide / 3)" class="grid-line"></line>
                  <text x="42" [attr.y]="chartY(guide / 3) + 4" text-anchor="end" class="axis-label">{{ chartMaxCount * (1 - guide / 3) | number:'1.0-0' }}</text>
                }
                @for (point of chartPoints; track point.key; let i = $index) {
                  <rect [attr.x]="barX(i, 0)" [attr.y]="barY(point.ventasCount)" [attr.width]="barWidth" [attr.height]="barHeight(point.ventasCount)" rx="2" class="sales-bar">
                    <title>{{ point.label }}: {{ point.ventasCount }} ventas</title>
                  </rect>
                  <rect [attr.x]="barX(i, 1)" [attr.y]="barY(point.tallerCount)" [attr.width]="barWidth" [attr.height]="barHeight(point.tallerCount)" rx="2" class="workshop-bar">
                    <title>{{ point.label }}: {{ point.tallerCount }} órdenes de taller</title>
                  </rect>
                  @if (i === 0 || i === chartPoints.length - 1 || i % chartLabelStep === 0) {
                    <text [attr.x]="chartX(i)" y="238" text-anchor="middle" class="axis-label">{{ point.label }}</text>
                  }
                }
              </svg>
            </div>
          </section>
        </div>

        <div class="content-grid">
          <section class="panel">
            <div class="panel-heading"><h2>Movimientos recientes</h2><a routerLink="/inventario/movimientos">Ver historial</a></div>
            @if (movimientos.length === 0) { <p class="empty">Todavía no hay movimientos de inventario.</p> }
            @else {
              <div class="table-container">
                <table class="data-table">
                  <thead><tr><th>FECHA</th><th>PRODUCTO</th><th>TIPO</th><th class="text-right">CANTIDAD</th><th>MOTIVO</th></tr></thead>
                  <tbody>@for (movimiento of movimientos; track movimiento.id) {
                    <tr>
                      <td>{{ movimiento.createdAt | date:'dd/MM HH:mm' }}</td>
                      <td>{{ nombreProducto(movimiento.productoId) }}</td>
                      <td><span class="badge" [class.badge-success]="movimiento.tipo === 'entrada'" [class.badge-warning]="movimiento.tipo === 'salida'">{{ movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida' }}</span></td>
                      <td class="text-right">{{ movimiento.cantidad }}</td>
                      <td>{{ movimiento.motivo }}</td>
                    </tr>
                  }</tbody>
                </table>
              </div>
            }
          </section>
          <section class="panel shortcuts">
            <h2>Accesos rápidos</h2>
            <a routerLink="/ventas" class="shortcut">Registrar una venta <span>›</span></a>
            <a routerLink="/servicios-taller" class="shortcut">Crear orden de taller <span>›</span></a>
            <a routerLink="/compras" class="shortcut">Revisar órdenes de compra <span>›</span></a>
            <a routerLink="/reportes" class="shortcut">Consultar reportes <span>›</span></a>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .today { color: var(--text-secondary); text-transform: capitalize; }
    .kpi-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
    .kpi-card { display: flex; flex-direction: column; min-height: 135px; padding: 18px; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--surface-card); transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(30, 36, 48, .08); }
    .kpi-label { color: var(--text-secondary); font-size: 13px; }
    .kpi-card strong { margin: 8px 0 4px; font-size: 28px; color: var(--text-primary); }
    .kpi-note { margin-top: auto; color: var(--text-muted); font-size: 12px; }
    .kpi-card.warning strong { color: var(--state-warning); }
    .chart-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .chart-toolbar h2 { font-size: 16px; }
    .chart-toolbar p, .chart-heading p { color: var(--text-secondary); font-size: 12px; }
    .chart-toolbar label { margin-left: auto; color: var(--text-secondary); }
    .chart-toolbar select { width: 160px; }
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .chart-panel { overflow: hidden; }
    .chart-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
    .legend { display: flex; align-items: center; gap: 6px; white-space: nowrap; color: var(--text-secondary); font-size: 11px; }
    .legend-sales, .legend-workshop { width: 9px; height: 9px; border-radius: 50%; background: #2e5a6c; }
    .legend-workshop { margin-left: 6px; background: #e28a36; }
    .chart-scroll { overflow-x: auto; }
    .chart { display: block; width: 100%; min-width: 520px; height: auto; }
    .grid-line { stroke: var(--border-color); stroke-width: 1; }
    .axis-label { fill: var(--text-muted); font: 10px var(--font-sans); }
    .sales-line, .workshop-line { fill: none; stroke: #2e5a6c; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
    .workshop-line { stroke: #e28a36; }
    .sales-point { fill: #2e5a6c; }
    .workshop-point { fill: #e28a36; }
    .sales-bar { fill: #2e5a6c; }
    .workshop-bar { fill: #e28a36; }
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .panel { min-width: 0; padding: 20px; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); }
    .panel h2 { font-size: 16px; }
    .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
    .panel-heading a { font-size: 13px; }
    .empty { color: var(--text-secondary); padding: 20px 0; }
    .shortcut { display: flex; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
    .shortcut:last-child { border-bottom: 0; }
    .shortcut span { color: var(--accent-primary); font-size: 20px; line-height: 1; }
    .alert-box { padding: 10px 14px; margin-bottom: 14px; border-radius: var(--radius-md); }
    .alert-error { color: var(--state-danger); background: var(--state-danger-bg); }
    @media (max-width: 1050px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } .content-grid, .charts-grid { grid-template-columns: 1fr; } }
    @media (max-width: 600px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .kpi-card { padding: 14px; } }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly inventarioService = inject(InventarioService);
  private readonly productoService = inject(ProductoService);
  private readonly comprasService = inject(ComprasService);
  private readonly ventasService = inject(VentasService);
  private readonly talleresService = inject(ServiciosTallerService);
  readonly hoy = new Date();
  productos: Producto[] = [];
  movimientos: MovimientoInventario[] = [];
  compras: Compra[] = [];
  ventas: Venta[] = [];
  servicios: ServicioTaller[] = [];
  stock: Array<{ productoId: string; stockActual: number }> = [];
  periodoDias = 7;
  cargando = true;
  error = '';

  get productosActivos(): number { return this.productos.filter((producto) => producto.activo).length; }
  get unidadesStock(): number { return this.stock.reduce((sum, item) => sum + item.stockActual, 0); }
  get stockBajo(): number {
    return this.stock.filter((item) => {
      const producto = this.productos.find((p) => p.id === item.productoId);
      return producto?.activo && item.stockActual <= producto.stockMinimo;
    }).length;
  }
  get comprasPendientes(): number { return this.compras.filter((compra) => compra.estado === 'pendiente').length; }
  get ventasHoy(): number {
    const hoy = this.hoy.toISOString().slice(0, 10);
    return this.ventas.filter((venta) => venta.fecha.slice(0, 10) === hoy).length;
  }
  get totalVentasHoy(): number {
    const hoy = this.hoy.toISOString().slice(0, 10);
    return this.ventas.filter((venta) => venta.fecha.slice(0, 10) === hoy).reduce((sum, venta) => sum + venta.total, 0);
  }
  get serviciosEnProceso(): number { return this.servicios.filter((servicio) => servicio.estado === 'en_proceso').length; }

  get chartPoints(): Array<{ key: string; label: string; ventas: number; taller: number; ventasCount: number; tallerCount: number }> {
    const points = Array.from({ length: this.periodoDias }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (this.periodoDias - index - 1));
      const key = this.dateKey(date);
      return {
        key,
        label: date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }),
        ventas: 0,
        taller: 0,
        ventasCount: 0,
        tallerCount: 0,
      };
    });
    const buckets = new Map(points.map((point) => [point.key, point]));
    for (const venta of this.ventas) {
      const point = buckets.get(this.dateKey(new Date(venta.fecha)));
      if (point) { point.ventas += venta.total; point.ventasCount += 1; }
    }
    for (const servicio of this.servicios) {
      const point = buckets.get(this.dateKey(new Date(servicio.fecha)));
      if (point) { point.taller += servicio.total; point.tallerCount += 1; }
    }
    return points;
  }

  get chartMaxValue(): number {
    return Math.max(10, ...this.chartPoints.flatMap((point) => [point.ventas, point.taller])) * 1.15;
  }

  get chartMaxCount(): number {
    return Math.max(1, ...this.chartPoints.flatMap((point) => [point.ventasCount, point.tallerCount]));
  }

  get chartLabelStep(): number { return Math.max(1, Math.ceil(this.chartPoints.length / 7)); }
  get barWidth(): number { return Math.max(2, Math.min(7, 300 / this.periodoDias)); }

  cambiarPeriodo(event: Event): void {
    const days = Number((event.target as HTMLSelectElement).value);
    if ([7, 30, 90].includes(days)) this.periodoDias = days;
  }

  chartX(index: number): number {
    return 52 + (this.chartPoints.length > 1 ? index * (688 / (this.chartPoints.length - 1)) : 344);
  }

  chartY(ratio: number): number { return 18 + ratio * 196; }

  chartYValue(value: number): number {
    return this.chartY(1 - value / this.chartMaxValue);
  }

  chartLine(kind: 'ventas' | 'taller'): string {
    return this.chartPoints.map((point, index) =>
      `${this.chartX(index)},${this.chartYValue(point[kind])}`
    ).join(' ');
  }

  barX(index: number, series: 0 | 1): number {
    const pairGap = this.barWidth * 0.35;
    return this.chartX(index) - this.barWidth - pairGap / 2 + series * (this.barWidth + pairGap);
  }

  barHeight(value: number): number {
    return value ? Math.max(2, (value / this.chartMaxCount) * 188) : 0;
  }

  barY(value: number): number { return 214 - this.barHeight(value); }

  private dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    let remaining = 6;
    const done = (): void => { remaining -= 1; if (remaining === 0) this.cargando = false; };
    this.productoService.listar().subscribe({
      next: (items) => { this.productos = items; done(); },
      error: () => { this.error = 'No se pudieron cargar los productos.'; done(); },
    });
    this.inventarioService.obtenerStock().subscribe({
      next: (items) => { this.stock = items; done(); },
      error: () => { this.error = 'No se pudo cargar el inventario.'; done(); },
    });
    this.inventarioService.listarMovimientos().subscribe({
      next: (items) => { this.movimientos = items.slice(0, 6); done(); },
      error: () => { this.error = 'No se pudieron cargar los movimientos.'; done(); },
    });
    this.comprasService.listarCompras().subscribe({
      next: (items) => { this.compras = items; done(); },
      error: () => { this.error = 'No se pudieron cargar las compras.'; done(); },
    });
    this.ventasService.listar().subscribe({
      next: (items) => { this.ventas = items; done(); },
      error: () => { this.error = 'No se pudieron cargar las ventas.'; done(); },
    });
    this.talleresService.listar().subscribe({
      next: (items) => { this.servicios = items; done(); },
      error: () => { this.error = 'No se pudieron cargar los servicios.'; done(); },
    });
  }

  nombreProducto(id: string): string { return this.productos.find((producto) => producto.id === id)?.nombre ?? 'Producto no encontrado'; }
}
