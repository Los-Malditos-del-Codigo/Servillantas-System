import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductoService, FiltrosProducto } from '../../../core/services/producto.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Producto } from '../../../core/models/producto.model';
import { Categoria, Marca, UnidadMedida } from '../../../core/models/catalogos.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CurrencyPenPipe } from '../../../shared/pipes/currency-pen.pipe';

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ModalComponent,
    EmptyStateComponent,
    CurrencyPenPipe,
  ],
  template: `
    <div class="page-container">
      <!-- Encabezado de Página -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogo de Productos</h1>
          <p class="page-subtitle">
            Administración del maestro de artículos, neumáticos, fluidos y accesorios.
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="/productos/catalogos" class="btn btn-secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Catálogos Auxiliares</span>
          </a>

          <a routerLink="/productos/nuevo" class="btn btn-secondary" title="Asistente guiado paso a paso">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span>Asistente Guiado (5 Pasos)</span>
          </a>

          <button type="button" class="btn btn-primary" (click)="abrirModalCrear()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nuevo Producto Rápido</span>
          </button>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda (HU-04) -->
      <div class="filters-card">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por código o nombre del producto..."
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

        <div class="select-filters">
          <select class="form-control filter-select" [value]="filtroCategoria()" (change)="onCategoriaChange($event)">
            <option value="">Todas las categorías</option>
            @for (cat of categorias(); track cat.id) {
              <option [value]="cat.id">{{ cat.nombre }}</option>
            }
          </select>

          <select class="form-control filter-select" [value]="filtroMarca()" (change)="onMarcaChange($event)">
            <option value="">Todas las marcas</option>
            @for (m of marcas(); track m.id) {
              <option [value]="m.id">{{ m.nombre }}</option>
            }
          </select>

          <label class="checkbox-label">
            <input
              type="checkbox"
              [checked]="mostrarInactivos()"
              (change)="toggleInactivos($event)"
            />
            <span>Mostrar inactivos</span>
          </label>
        </div>
      </div>

      <!-- Tabla de Productos (HU-03) -->
      @if (cargando()) {
        <div class="loading-state">
          <span class="spinner spinner-dark"></span>
          <span>Cargando productos del catálogo...</span>
        </div>
      } @else if (productosFiltrados().length === 0) {
        <app-empty-state
          title="No se encontraron productos"
          message="Aún no registraste productos o no hay coincidencias con los filtros aplicados. Crea el primero con el botón superior."
          actionText="Crear primer producto"
          (actionClick)="abrirModalCrear()"
        ></app-empty-state>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>NOMBRE DEL PRODUCTO</th>
                <th>CATEGORÍA</th>
                <th>MARCA</th>
                <th>UNIDAD</th>
                <th class="text-right">PRECIO VENTA</th>
                <th class="text-right">STOCK MÍN.</th>
                <th>ESTADO</th>
                <th class="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              @for (prod of productosPaginados(); track prod.id) {
                <tr [class.row-inactive]="!prod.activo">
                  <td class="font-mono text-strong">{{ prod.codigo }}</td>
                  <td>
                    <div class="prod-cell">
                      <span class="prod-name">{{ prod.nombre }}</span>
                      @if (prod.descripcion) {
                        <span class="prod-desc">{{ prod.descripcion }}</span>
                      }
                    </div>
                  </td>
                  <td>{{ obtenerNombreCategoria(prod.categoriaId) }}</td>
                  <td>{{ obtenerNombreMarca(prod.marcaId) }}</td>
                  <td>
                    <span class="font-mono badge badge-neutral">
                      {{ obtenerAbrevUnidad(prod.unidadMedidaId) }}
                    </span>
                  </td>
                  <td class="text-right font-mono text-strong">
                    {{ prod.precioVenta | currencyPen }}
                  </td>
                  <td class="text-right font-mono">
                    {{ prod.stockMinimo }}
                  </td>
                  <td>
                    @if (prod.activo) {
                      <span class="badge badge-success">Activo</span>
                    } @else {
                      <span class="badge badge-danger">Inactivo</span>
                    }
                  </td>
                  <td class="text-right">
                    <div class="actions-cell">
                      <button
                        type="button"
                        class="btn-action"
                        (click)="abrirModalEditar(prod)"
                        title="Editar datos del producto"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        class="btn-action"
                        [class.text-danger]="prod.activo"
                        (click)="toggleEstadoProducto(prod)"
                        [title]="prod.activo ? 'Desactivar producto (soft-delete)' : 'Activar producto'"
                      >
                        {{ prod.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Paginación Operativa -->
          <div class="pagination-footer">
            <span class="pagination-info">
              Mostrando {{ indiceInicio + 1 }} - {{ indiceFin }} de {{ productosFiltrados().length }} productos
            </span>

            <div class="pagination-controls">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                [disabled]="paginaActual() === 1"
                (click)="cambiarPagina(paginaActual() - 1)"
              >
                Anterior
              </button>
              <span class="page-current">Página {{ paginaActual() }} de {{ totalPaginas }}</span>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                [disabled]="paginaActual() >= totalPaginas"
                (click)="cambiarPagina(paginaActual() + 1)"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Drawer Lateral para CRUD Rápido (HU-02, HU-05) -->
      <app-modal
        [isOpen]="modalAbierto()"
        [title]="productoEnEdicion ? 'Editar Producto' : 'Crear Producto Rápido'"
        [subtitle]="productoEnEdicion ? 'Modifica los campos operativos del producto seleccionado.' : 'Registro ágil para cuando categoría, marca y unidad ya existen.'"
        mode="drawer"
        maxWidth="580px"
        (closeEvent)="cerrarModal()"
      >
        <div modal-body>
          @if (formErrorGeneral) {
            <div class="alert-inline-error">
              {{ formErrorGeneral }}
            </div>
          }

          <form [formGroup]="productoForm" novalidate>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="codigo">
                  Código de Producto
                  <span class="required-mark">*</span>
                </label>
                <input
                  id="codigo"
                  type="text"
                  class="form-control font-mono"
                  [class.has-error]="esInvalido('codigo')"
                  formControlName="codigo"
                  placeholder="Ej. LL-1856515-MIC"
                />
                @if (esInvalido('codigo')) {
                  <span class="form-error">Código obligatorio y debe ser único.</span>
                }
              </div>

              <div class="form-group">
                <label for="unidadMedidaId">
                  Unidad de Medida
                  <span class="required-mark">*</span>
                </label>
                <select
                  id="unidadMedidaId"
                  class="form-control"
                  [class.has-error]="esInvalido('unidadMedidaId')"
                  formControlName="unidadMedidaId"
                >
                  <option value="">Seleccione unidad...</option>
                  @for (um of unidades(); track um.id) {
                    <option [value]="um.id">{{ um.nombre }} ({{ um.abreviatura }})</option>
                  }
                </select>
                @if (esInvalido('unidadMedidaId')) {
                  <span class="form-error">La unidad de medida es obligatoria.</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label for="nombre">
                Nombre / Descripción Corta
                <span class="required-mark">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                class="form-control"
                [class.has-error]="esInvalido('nombre')"
                formControlName="nombre"
                placeholder="Ej. Llanta Michelin Energy XM2+ 185/65 R15"
              />
              @if (esInvalido('nombre')) {
                <span class="form-error">El nombre es obligatorio.</span>
              }
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label for="categoriaId">Categoría</label>
                <select id="categoriaId" class="form-control" formControlName="categoriaId">
                  <option [ngValue]="null">Sin categoría asignada</option>
                  @for (cat of categorias(); track cat.id) {
                    <option [value]="cat.id">{{ cat.nombre }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="marcaId">Marca</label>
                <select id="marcaId" class="form-control" formControlName="marcaId">
                  <option [ngValue]="null">Sin marca asignada</option>
                  @for (m of marcas(); track m.id) {
                    <option [value]="m.id">{{ m.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label for="precioVenta">
                  Precio de Venta (S/.)
                  <span class="required-mark">*</span>
                </label>
                <input
                  id="precioVenta"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10000000"
                  class="form-control font-mono"
                  [class.has-error]="esInvalido('precioVenta')"
                  formControlName="precioVenta"
                  placeholder="0.00"
                />
                @if (esInvalido('precioVenta')) {
                  <span class="form-error">El precio no puede ser negativo.</span>
                }
              </div>

              <div class="form-group">
                <label for="stockMinimo">
                  Stock Mínimo de Alerta
                  <span class="required-mark">*</span>
                </label>
                <input
                  id="stockMinimo"
                  type="number"
                  step="1"
                  min="0"
                  max="999999"
                  class="form-control font-mono"
                  [class.has-error]="esInvalido('stockMinimo')"
                  formControlName="stockMinimo"
                  placeholder="0"
                />
                @if (esInvalido('stockMinimo')) {
                  <span class="form-error">El stock mínimo no puede ser negativo.</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label for="descripcion">Detalles técnicos / Observaciones</label>
              <textarea
                id="descripcion"
                rows="3"
                class="form-control"
                formControlName="descripcion"
                placeholder="Especificaciones adicionales, índice de carga, velocidad, etc."
              ></textarea>
            </div>
          </form>
        </div>

        <div modal-footer>
          <button type="button" class="btn btn-secondary" (click)="cerrarModal()" [disabled]="guardando">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="guardarProducto()"
            [disabled]="guardando || productoForm.invalid"
          >
            @if (guardando) {
              <span class="spinner"></span>
              <span>Guardando...</span>
            } @else {
              <span>{{ productoEnEdicion ? 'Actualizar Producto' : 'Guardar Producto' }}</span>
            }
          </button>
        </div>
      </app-modal>
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
    }

    /* Filtros */
    .filters-card {
      background-color: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 14px 18px;
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

    .select-filters {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filter-select {
      width: 180px;
      height: 38px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;

      input {
        cursor: pointer;
      }
    }

    /* Tabla */
    .text-strong {
      font-weight: 600;
    }

    .row-inactive {
      opacity: 0.6;
      background-color: #FAFAFA;
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
      max-width: 320px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-action {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12.5px;
      color: var(--accent-primary);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 6px;
      border-radius: var(--radius-sm);

      &:hover {
        background-color: var(--surface-subtle);
      }

      &.text-danger {
        color: var(--state-danger);

        &:hover {
          background-color: var(--state-danger-bg);
        }
      }
    }

    .pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid var(--border-color);
      background-color: var(--surface-subtle);
    }

    .pagination-info {
      font-size: 12.5px;
      color: var(--text-secondary);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-current {
      font-size: 12.5px;
      color: var(--text-primary);
      font-weight: 500;
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

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .alert-inline-error {
      background-color: var(--state-danger-bg);
      border: 1px solid var(--state-danger-border);
      color: var(--state-danger);
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 12.5px;
      margin-bottom: 16px;
    }
  `],
})
export class ProductosListComponent implements OnInit {
  private productoService = inject(ProductoService);
  private catalogoService = inject(CatalogoService);
  private fb = inject(FormBuilder);

  // Estados de datos
  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  marcas = signal<Marca[]>([]);
  unidades = signal<UnidadMedida[]>([]);
  cargando = signal<boolean>(true);

  // Filtros
  filtroTexto = signal<string>('');
  filtroCategoria = signal<string>('');
  filtroMarca = signal<string>('');
  mostrarInactivos = signal<boolean>(false);

  // Paginación
  paginaActual = signal<number>(1);
  elementosPorPagina = 10;

  // Modal / Drawer CRUD rápido
  modalAbierto = signal<boolean>(false);
  productoEnEdicion: Producto | null = null;
  guardando = false;
  formErrorGeneral = '';

  productoForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-_]+$/)]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    categoriaId: [null],
    marcaId: [null],
    unidadMedidaId: ['', Validators.required],
    precioVenta: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarProductos();
  }

  cargarCatalogos(): void {
    this.catalogoService.getCategorias().subscribe({
      next: (c) => {
        this.categorias.set(c);
        if (this.modalAbierto() && !this.productoEnEdicion && !this.productoForm.get('categoriaId')?.value && c.length > 0) {
          this.productoForm.patchValue({ categoriaId: c[0].id });
        }
      },
      error: (err) => console.warn('Error cargando categorías', err),
    });
    this.catalogoService.getMarcas().subscribe({
      next: (m) => {
        this.marcas.set(m);
        if (this.modalAbierto() && !this.productoEnEdicion && !this.productoForm.get('marcaId')?.value && m.length > 0) {
          this.productoForm.patchValue({ marcaId: m[0].id });
        }
      },
      error: (err) => console.warn('Error cargando marcas', err),
    });
    this.catalogoService.getUnidades().subscribe({
      next: (u) => {
        this.unidades.set(u);
        if (this.modalAbierto() && !this.productoEnEdicion && !this.productoForm.get('unidadMedidaId')?.value && u.length > 0) {
          this.productoForm.patchValue({ unidadMedidaId: u[0].id });
        }
      },
      error: (err) => console.warn('Error cargando unidades', err),
    });
  }

  cargarProductos(): void {
    this.cargando.set(true);
    const filtros: FiltrosProducto = {
      search: this.filtroTexto(),
      categoriaId: this.filtroCategoria() || undefined,
      marcaId: this.filtroMarca() || undefined,
      includeInactivos: this.mostrarInactivos(),
    };

    this.productoService.listar(filtros).subscribe({
      next: (prods) => {
        this.productos.set(prods);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // Filtrado computado en cliente para búsqueda reactiva instantánea
  productosFiltrados(): Producto[] {
    const list = this.productos();
    return list;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.productosFiltrados().length / this.elementosPorPagina));
  }

  get indiceInicio(): number {
    return (this.paginaActual() - 1) * this.elementosPorPagina;
  }

  get indiceFin(): number {
    return Math.min(this.indiceInicio + this.elementosPorPagina, this.productosFiltrados().length);
  }

  productosPaginados(): Producto[] {
    return this.productosFiltrados().slice(this.indiceInicio, this.indiceFin);
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual.set(p);
    }
  }

  onTextoChange(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.filtroTexto.set(val);
    this.paginaActual.set(1);
    this.cargarProductos();
  }

  limpiarTexto(): void {
    this.filtroTexto.set('');
    this.paginaActual.set(1);
    this.cargarProductos();
  }

  onCategoriaChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.filtroCategoria.set(val);
    this.paginaActual.set(1);
    this.cargarProductos();
  }

  onMarcaChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.filtroMarca.set(val);
    this.paginaActual.set(1);
    this.cargarProductos();
  }

  toggleInactivos(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this.mostrarInactivos.set(checked);
    this.paginaActual.set(1);
    this.cargarProductos();
  }

  // Helpers de nombres
  obtenerNombreCategoria(id: string | null): string {
    if (!id) return '—';
    const c = this.categorias().find((cat) => cat.id === id);
    return c ? c.nombre : '—';
  }

  obtenerNombreMarca(id: string | null): string {
    if (!id) return '—';
    const m = this.marcas().find((mar) => mar.id === id);
    return m ? m.nombre : '—';
  }

  obtenerAbrevUnidad(id: string): string {
    const u = this.unidades().find((um) => um.id === id);
    return u ? u.abreviatura : 'UND';
  }

  // Acciones CRUD Rápido
  abrirModalCrear(): void {
    if (this.unidades().length === 0 || this.categorias().length === 0 || this.marcas().length === 0) {
      this.cargarCatalogos();
    }
    this.productoEnEdicion = null;
    this.formErrorGeneral = '';
    this.productoForm.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoriaId: this.categorias()[0]?.id || null,
      marcaId: this.marcas()[0]?.id || null,
      unidadMedidaId: this.unidades()[0]?.id || '',
      precioVenta: 0,
      stockMinimo: 0,
    });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(prod: Producto): void {
    this.productoEnEdicion = prod;
    this.formErrorGeneral = '';
    this.productoForm.patchValue({
      codigo: prod.codigo,
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      categoriaId: prod.categoriaId,
      marcaId: prod.marcaId,
      unidadMedidaId: prod.unidadMedidaId,
      precioVenta: prod.precioVenta,
      stockMinimo: prod.stockMinimo,
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.productoEnEdicion = null;
  }

  esInvalido(campo: string): boolean {
    const c = this.productoForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  guardarProducto(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    const rawVal = this.productoForm.value;
    const formVal = {
      ...rawVal,
      codigo: rawVal.codigo.trim().toUpperCase(),
      nombre: rawVal.nombre.trim(),
      categoriaId: rawVal.categoriaId || this.categorias()[0]?.id || null,
      unidadMedidaId: rawVal.unidadMedidaId || this.unidades()[0]?.id || '',
    };

    // Validación de unicidad de código en el cliente
    const codigoNormalizado = formVal.codigo.trim().toUpperCase();
    const existeDuplicado = this.productos().some(
      (p) =>
        p.codigo.trim().toUpperCase() === codigoNormalizado &&
        (!this.productoEnEdicion || p.id !== this.productoEnEdicion.id)
    );

    if (existeDuplicado) {
      this.formErrorGeneral = `El código "${codigoNormalizado}" ya está registrado en otro producto.`;
      return;
    }

    this.guardando = true;
    this.formErrorGeneral = '';

    if (this.productoEnEdicion) {
      this.productoService.actualizar(this.productoEnEdicion.id, formVal).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargarProductos();
        },
        error: (err) => {
          this.guardando = false;
          this.formErrorGeneral = err?.error?.mensaje || 'Error al actualizar el producto.';
        },
      });
    } else {
      this.productoService.crear(formVal).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargarProductos();
        },
        error: (err) => {
          this.guardando = false;
          this.formErrorGeneral = err?.error?.mensaje || 'Error al crear el producto.';
        },
      });
    }
  }

  toggleEstadoProducto(prod: Producto): void {
    const accion = prod.activo ? 'desactivar' : 'activar';
    const confirmacion = window.confirm(
      `¿Está seguro de ${accion} el producto "${prod.nombre}"?`
    );
    if (!confirmacion) return;

    this.productoService.cambiarEstado(prod.id).subscribe({
      next: () => {
        this.cargarProductos();
      },
    });
  }
}
