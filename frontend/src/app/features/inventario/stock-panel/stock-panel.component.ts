import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Producto } from '../../../core/models/producto.model';
import { Inventario } from '../../../core/models/inventario.model';
import { Categoria, Marca, UnidadMedida } from '../../../core/models/catalogos.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

export interface ProductoStockItem {
  producto: Producto;
  stockActual: number;
  stockMinimo: number;
  unidadAbrev: string;
  categoriaNombre: string;
  marcaNombre: string;
  estadoStock: 'agotado' | 'bajo' | 'saludable';
  ultimaActualizacion?: string;
}

type FiltroStock = 'todos' | 'agotados' | 'bajos' | 'saludables';

@Component({
  selector: 'app-stock-panel',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Encabezado Operativo Principal -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Monitor de Stock en Tiempo Real</h1>
          <p class="page-subtitle">
            Control de existencias físicas disponibles en almacén vs. mínimos configurados de reposición.
          </p>
        </div>

        <div class="header-actions">
          <a routerLink="/inventario/movimientos" class="btn btn-secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Historial Movimientos</span>
          </a>

          <a routerLink="/inventario/salida" class="btn btn-secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            <span>Registrar Salida</span>
          </a>

          <a routerLink="/inventario/entrada" class="btn btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Registrar Entrada</span>
          </a>
        </div>
      </div>

      <!-- Tarjetas de Métricas Rápidas Operativas -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Referencias Activas</div>
          <div class="metric-value font-mono">{{ itemsStock().length }}</div>
          <div class="metric-desc">Productos controlados en almacén</div>
        </div>

        <div
          class="metric-card clickable"
          [class.active-metric]="filtroEstado() === 'saludables'"
          (click)="filtrarPorEstado('saludables')"
        >
          <div class="metric-label text-success">Stock Saludable</div>
          <div class="metric-value font-mono text-success">{{ conteoSaludables() }}</div>
          <div class="metric-desc">Existencias superiores al mínimo</div>
        </div>

        <div
          class="metric-card clickable"
          [class.active-metric]="filtroEstado() === 'bajos'"
          (click)="filtrarPorEstado('bajos')"
        >
          <div class="metric-label text-warning">Stock Bajo / Crítico</div>
          <div class="metric-value font-mono text-warning">{{ conteoBajos() }}</div>
          <div class="metric-desc">Igual o menor al stock mínimo</div>
        </div>

        <div
          class="metric-card clickable"
          [class.active-metric]="filtroEstado() === 'agotados'"
          (click)="filtrarPorEstado('agotados')"
        >
          <div class="metric-label text-danger">Stock Agotado</div>
          <div class="metric-value font-mono text-danger">{{ conteoAgotados() }}</div>
          <div class="metric-desc">0 unidades disponibles en taller</div>
        </div>
      </div>

      <!-- Barra de Búsqueda y Filtros de Estado -->
      <div class="filters-card">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por código, nombre o categoría..."
            [value]="filtroTexto()"
            (input)="onTextoChange($event)"
          />
          @if (filtroTexto()) {
            <button type="button" class="btn-clear" (click)="limpiarTexto()" aria-label="Limpiar búsqueda">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          }
        </div>

        <div class="state-filter-buttons">
          <button
            type="button"
            class="btn-filter"
            [class.active]="filtroEstado() === 'todos'"
            (click)="filtrarPorEstado('todos')"
          >
            Todos ({{ itemsStock().length }})
          </button>
          <button
            type="button"
            class="btn-filter"
            [class.active]="filtroEstado() === 'bajos'"
            (click)="filtrarPorEstado('bajos')"
          >
            Bajos ({{ conteoBajos() }})
          </button>
          <button
            type="button"
            class="btn-filter"
            [class.active]="filtroEstado() === 'agotados'"
            (click)="filtrarPorEstado('agotados')"
          >
            Agotados ({{ conteoAgotados() }})
          </button>
          <button
            type="button"
            class="btn-filter"
            [class.active]="filtroEstado() === 'saludables'"
            (click)="filtrarPorEstado('saludables')"
          >
            Saludables ({{ conteoSaludables() }})
          </button>
        </div>
      </div>

      <!-- Tabla de Stock Actual (HU-09) -->
      @if (cargando()) {
        <div class="loading-state">
          <span class="spinner spinner-dark"></span>
          <span>Consultando balances de inventario...</span>
        </div>
      } @else if (itemsFiltrados().length === 0) {
        <app-empty-state
          title="Sin coincidencias de inventario"
          message="No se encontraron artículos que cumplan con los criterios de búsqueda o filtro de stock."
          actionText="Mostrar todos los productos"
          (actionClick)="resetFiltros()"
        ></app-empty-state>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>PRODUCTO</th>
                <th>CATEGORÍA / MARCA</th>
                <th>UNIDAD</th>
                <th class="text-right">STOCK ACTUAL</th>
                <th class="text-right">STOCK MÍN.</th>
                <th>ESTADO DE STOCK</th>
                <th class="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              @for (item of itemsFiltrados(); track item.producto.id) {
                <tr [class.row-danger]="item.estadoStock === 'agotado'" [class.row-warning]="item.estadoStock === 'bajo'">
                  <td class="font-mono text-strong">{{ item.producto.codigo }}</td>
                  <td>
                    <div class="prod-cell">
                      <span class="prod-name">{{ item.producto.nombre }}</span>
                      @if (item.producto.descripcion) {
                        <span class="prod-desc">{{ item.producto.descripcion }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="cat-brand-cell">
                      <span>{{ item.categoriaNombre }}</span>
                      <span class="text-muted text-xs">{{ item.marcaNombre }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-neutral font-mono">{{ item.unidadAbrev }}</span>
                  </td>
                  <td class="text-right font-mono text-strong stock-col">
                    <span [class.text-danger]="item.estadoStock === 'agotado'" [class.text-warning]="item.estadoStock === 'bajo'">
                      {{ item.stockActual }}
                    </span>
                  </td>
                  <td class="text-right font-mono text-secondary">
                    {{ item.stockMinimo }}
                  </td>
                  <td>
                    @if (item.estadoStock === 'agotado') {
                      <span class="badge badge-danger">Agotado (0)</span>
                    } @else if (item.estadoStock === 'bajo') {
                      <span class="badge badge-warning">Stock Bajo</span>
                    } @else {
                      <span class="badge badge-success">Saludable</span>
                    }
                  </td>
                  <td class="text-right">
                    <div class="row-actions">
                      <a
                        [routerLink]="['/inventario/entrada']"
                        [queryParams]="{ productoId: item.producto.id }"
                        class="btn-row-action"
                        title="Registrar entrada de mercancía"
                      >
                        + Entrada
                      </a>
                      <a
                        [routerLink]="['/inventario/salida']"
                        [queryParams]="{ productoId: item.producto.id }"
                        class="btn-row-action"
                        [class.disabled]="item.stockActual === 0"
                        title="Registrar salida de almacén"
                      >
                        - Salida
                      </a>
                    </div>
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

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
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
      flex-wrap: wrap;
    }

    /* Métricas Operativas */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }

    .metric-card {
      background-color: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: border-color var(--transition-fast), background-color var(--transition-fast);

      &.clickable {
        cursor: pointer;

        &:hover {
          background-color: var(--surface-hover);
          border-color: var(--border-strong);
        }
      }

      &.active-metric {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px var(--focus-ring);
      }
    }

    .metric-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .metric-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.1;
    }

    .metric-desc {
      font-size: 11.5px;
      color: var(--text-muted);
    }

    .text-success { color: var(--state-success) !important; }
    .text-warning { color: var(--state-warning) !important; }
    .text-danger { color: var(--state-danger) !important; }

    /* Filtros y Búsqueda */
    .filters-card {
      background-color: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 280px;
      background-color: var(--surface-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0 12px;
      height: 38px;
      color: var(--text-secondary);
    }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 13px;
      color: var(--text-primary);
    }

    .btn-clear {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 13px;
      padding: 2px 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .state-filter-buttons {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .btn-filter {
      background: var(--surface-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 6px 12px;
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background-color: #E6EAEF;
        color: var(--text-primary);
      }

      &.active {
        background-color: var(--accent-primary);
        color: #FFFFFF;
        border-color: var(--accent-primary);
      }
    }

    /* Tabla */
    .text-strong { font-weight: 600; }

    .stock-col {
      font-size: 14.5px;
    }

    .prod-cell {
      display: flex;
      flex-direction: column;
    }

    .prod-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .prod-desc {
      font-size: 11.5px;
      color: var(--text-secondary);
      max-width: 280px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cat-brand-cell {
      display: flex;
      flex-direction: column;
      font-size: 12.5px;
    }

    .text-xs { font-size: 11px; }

    .row-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-row-action {
      background-color: var(--surface-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
      color: var(--accent-primary);
      text-decoration: none;
      transition: all var(--transition-fast);

      &:hover {
        background-color: var(--accent-subtle);
        border-color: var(--accent-border);
      }

      &.disabled {
        opacity: 0.4;
        pointer-events: none;
      }
    }

    .row-danger {
      background-color: #FFFDFD;
    }

    .row-warning {
      background-color: #FFFEFC;
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
export class StockPanelComponent implements OnInit {
  private productoService = inject(ProductoService);
  private inventarioService = inject(InventarioService);
  private catalogoService = inject(CatalogoService);

  cargando = signal<boolean>(true);
  productos = signal<Producto[]>([]);
  inventarios = signal<Inventario[]>([]);
  categorias = signal<Categoria[]>([]);
  marcas = signal<Marca[]>([]);
  unidades = signal<UnidadMedida[]>([]);

  filtroTexto = signal<string>('');
  filtroEstado = signal<FiltroStock>('todos');

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando.set(true);

    this.catalogoService.getCategorias().subscribe((c) => this.categorias.set(c));
    this.catalogoService.getMarcas().subscribe((m) => this.marcas.set(m));
    this.catalogoService.getUnidades().subscribe((u) => this.unidades.set(u));

    this.productoService.listar({ includeInactivos: false }).subscribe({
      next: (prods) => {
        this.productos.set(prods);
        this.inventarioService.obtenerStock().subscribe({
          next: (inv) => {
            this.inventarios.set(inv);
            this.cargando.set(false);
          },
          error: () => this.cargando.set(false),
        });
      },
      error: () => this.cargando.set(false),
    });
  }

  // Combinar productos activos con su fila de inventario
  itemsStock = computed<ProductoStockItem[]>(() => {
    const prods = this.productos();
    const invMap = new Map(this.inventarios().map((i) => [i.productoId, i]));
    const catMap = new Map(this.categorias().map((c) => [c.id, c.nombre]));
    const marMap = new Map(this.marcas().map((m) => [m.id, m.nombre]));
    const umMap = new Map(this.unidades().map((u) => [u.id, u.abreviatura]));

    return prods.map((p) => {
      const inv = invMap.get(p.id);
      const stockActual = inv ? inv.stockActual : 0;
      const stockMinimo = p.stockMinimo;

      let estadoStock: 'agotado' | 'bajo' | 'saludable' = 'saludable';
      if (stockActual === 0) {
        estadoStock = 'agotado';
      } else if (stockActual <= stockMinimo) {
        estadoStock = 'bajo';
      }

      return {
        producto: p,
        stockActual,
        stockMinimo,
        unidadAbrev: umMap.get(p.unidadMedidaId) || 'UND',
        categoriaNombre: p.categoriaId ? catMap.get(p.categoriaId) || '—' : '—',
        marcaNombre: p.marcaId ? marMap.get(p.marcaId) || '—' : '—',
        estadoStock,
        ultimaActualizacion: inv?.ultimaActualizacion,
      };
    });
  });

  // Métricas computadas
  conteoSaludables = computed(() => this.itemsStock().filter((i) => i.estadoStock === 'saludable').length);
  conteoBajos = computed(() => this.itemsStock().filter((i) => i.estadoStock === 'bajo').length);
  conteoAgotados = computed(() => this.itemsStock().filter((i) => i.estadoStock === 'agotado').length);

  // Filtrado reactivo en pantalla
  itemsFiltrados = computed(() => {
    let list = this.itemsStock();
    const estado = this.filtroEstado();
    const q = this.filtroTexto().trim().toLowerCase();

    if (estado === 'agotados') {
      list = list.filter((i) => i.estadoStock === 'agotado');
    } else if (estado === 'bajos') {
      list = list.filter((i) => i.estadoStock === 'bajo');
    } else if (estado === 'saludables') {
      list = list.filter((i) => i.estadoStock === 'saludable');
    }

    if (q) {
      list = list.filter(
        (i) =>
          i.producto.codigo.toLowerCase().includes(q) ||
          i.producto.nombre.toLowerCase().includes(q) ||
          i.categoriaNombre.toLowerCase().includes(q) ||
          i.marcaNombre.toLowerCase().includes(q)
      );
    }

    return list;
  });

  filtrarPorEstado(estado: FiltroStock): void {
    this.filtroEstado.set(estado);
  }

  onTextoChange(e: Event): void {
    this.filtroTexto.set((e.target as HTMLInputElement).value);
  }

  limpiarTexto(): void {
    this.filtroTexto.set('');
  }

  resetFiltros(): void {
    this.filtroTexto.set('');
    this.filtroEstado.set('todos');
  }
}
