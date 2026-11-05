import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventarioService, FiltrosMovimiento } from '../../../core/services/inventario.service';
import { ProductoService } from '../../../core/services/producto.service';
import { MovimientoInventario } from '../../../core/models/inventario.model';
import { Producto } from '../../../core/models/producto.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CurrencyPenPipe } from '../../../shared/pipes/currency-pen.pipe';

@Component({
  selector: 'app-movimientos-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EmptyStateComponent, CurrencyPenPipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="breadcrumb-back">
            <a routerLink="/inventario" class="link-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver al panel de stock
            </a>
          </div>
          <h1 class="page-title">Historial de Movimientos de Inventario (HU-10)</h1>
          <p class="page-subtitle">
            Kárdex cronológico inmutable de todas las transacciones de entrada y salida de mercancía.
          </p>
        </div>

        <div class="header-actions">
          <a routerLink="/inventario/entrada" class="btn btn-secondary">
            + Nueva Entrada
          </a>
          <a routerLink="/inventario/salida" class="btn btn-secondary">
            - Nueva Salida
          </a>
        </div>
      </div>

      <!-- Filtros de Búsqueda de Movimientos -->
      <div class="filters-card">
        <div class="filters-row">
          <div class="filter-group">
            <label class="filter-label">Filtrar por Producto</label>
            <select
              class="form-control filter-input"
              [(ngModel)]="filtroProductoId"
              (change)="aplicarFiltros()"
            >
              <option value="">Todos los productos</option>
              @for (p of productos(); track p.id) {
                <option [value]="p.id">[{{ p.codigo }}] {{ p.nombre }}</option>
              }
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Tipo de Movimiento</label>
            <select
              class="form-control filter-input"
              [(ngModel)]="filtroTipo"
              (change)="aplicarFiltros()"
            >
              <option value="">Entradas y Salidas</option>
              <option value="entrada">Solo Entradas (+)</option>
              <option value="salida">Solo Salidas (-)</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Fecha Desde</label>
            <input
              type="date"
              class="form-control filter-input"
              [(ngModel)]="filtroFechaDesde"
              (change)="aplicarFiltros()"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Fecha Hasta</label>
            <input
              type="date"
              class="form-control filter-input"
              [(ngModel)]="filtroFechaHasta"
              (change)="aplicarFiltros()"
            />
          </div>

          <div class="filter-group-action">
            <button type="button" class="btn btn-ghost btn-sm" (click)="limpiarFiltros()">
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla de Movimientos -->
      @if (cargando()) {
        <div class="loading-state">
          <span class="spinner spinner-dark"></span>
          <span>Consultando registros de auditoría...</span>
        </div>
      } @else if (movimientos().length === 0) {
        <app-empty-state
          title="Sin movimientos registrados"
          message="No existen movimientos que coincidan con los filtros seleccionados."
          actionText="Ver todos los movimientos"
          (actionClick)="limpiarFiltros()"
        ></app-empty-state>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>FECHA Y HORA</th>
                <th>PRODUCTO</th>
                <th>TIPO</th>
                <th class="text-right">CANTIDAD</th>
                <th class="text-right">STOCK ANTERIOR / POSTERIOR</th>
                <th>MOTIVO Y DETALLE</th>
                <th>REGISTRADO POR</th>
              </tr>
            </thead>
            <tbody>
              @for (mov of movimientos(); track mov.id) {
                <tr>
                  <td class="font-mono text-secondary">
                    {{ formatearFecha(mov.createdAt) }}
                  </td>
                  <td>
                    <div class="prod-mov-cell">
                      <span class="font-mono text-strong text-xs">{{ obtenerCodigo(mov.productoId) }}</span>
                      <span class="prod-title">{{ obtenerNombre(mov.productoId) }}</span>
                    </div>
                  </td>
                  <td>
                    @if (mov.tipo === 'entrada') {
                      <span class="badge badge-success">Entrada</span>
                    } @else {
                      <span class="badge badge-danger">Salida</span>
                    }
                  </td>
                  <td class="text-right font-mono text-strong">
                    <span [class.text-success]="mov.tipo === 'entrada'" [class.text-danger]="mov.tipo === 'salida'">
                      {{ mov.tipo === 'entrada' ? '+' : '-' }}{{ mov.cantidad }}
                    </span>
                  </td>
                  <td class="text-right font-mono">
                    <span class="stock-shift">
                      <span class="stock-old">{{ mov.stockAnterior }}</span>
                      <span class="stock-arrow">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle;">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </span>
                      <span class="stock-new">{{ mov.stockPosterior }}</span>
                    </span>
                  </td>
                  <td>
                    <div class="motivo-cell">
                      <strong class="motivo-name">{{ mov.motivo }}</strong>
                      @if (mov.costoUnitario) {
                        <span class="text-xs text-muted font-mono">
                          Costo: {{ mov.costoUnitario | currencyPen }}
                        </span>
                      }
                      @if (mov.observaciones) {
                        <span class="text-xs text-secondary">{{ mov.observaciones }}</span>
                      }
                    </div>
                  </td>
                  <td class="text-secondary text-sm">
                    {{ mov.registradoPor }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .breadcrumb-back {
      margin-bottom: 6px;
    }

    .link-back {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
      &:hover { color: var(--accent-primary); }
    }

    .page-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .page-subtitle {
      font-size: 13.5px;
      color: var(--text-secondary);
      margin-top: 3px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Filtros */
    .filters-card {
      background-color: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 16px 20px;
    }

    .filters-row {
      display: flex;
      align-items: flex-end;
      gap: 14px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 180px;
    }

    .filter-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .filter-input {
      height: 38px;
    }

    .filter-group-action {
      height: 38px;
      display: flex;
      align-items: center;
    }

    /* Tabla */
    .text-strong { font-weight: 600; }
    .text-xs { font-size: 11px; }
    .text-sm { font-size: 12.5px; }

    .prod-mov-cell {
      display: flex;
      flex-direction: column;
    }

    .prod-title {
      font-size: 13px;
      color: var(--text-primary);
    }

    .text-success { color: var(--state-success) !important; }
    .text-danger { color: var(--state-danger) !important; }

    .stock-shift {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .stock-old {
      color: var(--text-muted);
    }

    .stock-arrow {
      color: var(--text-secondary);
      font-size: 11px;
    }

    .stock-new {
      font-weight: 600;
      color: var(--text-primary);
    }

    .motivo-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .motivo-name {
      font-size: 13px;
      color: var(--text-primary);
    }

    .loading-state {
      padding: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-secondary);
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }
  `],
})
export class MovimientosHistorialComponent implements OnInit {
  private inventarioService = inject(InventarioService);
  private productoService = inject(ProductoService);

  cargando = signal<boolean>(true);
  movimientos = signal<MovimientoInventario[]>([]);
  productos = signal<Producto[]>([]);

  // Filtros
  filtroProductoId = '';
  filtroTipo: '' | 'entrada' | 'salida' = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';

  ngOnInit(): void {
    this.cargarProductos();
    this.aplicarFiltros();
  }

  cargarProductos(): void {
    this.productoService.listar({ includeInactivos: true }).subscribe((list) => {
      this.productos.set(list);
    });
  }

  aplicarFiltros(): void {
    this.cargando.set(true);

    const filtros: FiltrosMovimiento = {
      productoId: this.filtroProductoId || undefined,
      tipo: this.filtroTipo || undefined,
      fechaDesde: this.filtroFechaDesde || undefined,
      fechaHasta: this.filtroFechaHasta || undefined,
    };

    this.inventarioService.listarMovimientos(filtros).subscribe({
      next: (data) => {
        this.movimientos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  limpiarFiltros(): void {
    this.filtroProductoId = '';
    this.filtroTipo = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.aplicarFiltros();
  }

  obtenerCodigo(productoId: string): string {
    const p = this.productos().find((item) => item.id === productoId);
    return p ? p.codigo : '—';
  }

  obtenerNombre(productoId: string): string {
    const p = this.productos().find((item) => item.id === productoId);
    return p ? p.nombre : 'Producto no identificado';
  }

  formatearFecha(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    return `${dia}/${mes}/${anio} ${hora}`;
  }
}
