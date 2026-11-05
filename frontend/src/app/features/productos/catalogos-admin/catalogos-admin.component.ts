import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Categoria, Marca, UnidadMedida } from '../../../core/models/catalogos.model';

type TabCatalogo = 'categorias' | 'marcas' | 'unidades';

@Component({
  selector: 'app-catalogos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="breadcrumb-back">
            <a routerLink="/productos" class="link-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver al catálogo de productos
            </a>
          </div>
          <h1 class="page-title">Administración de Catálogos Auxiliares</h1>
          <p class="page-subtitle">
            Gestión in-place de Categorías, Marcas comerciales y Unidades de medida para el control de inventario.
          </p>
        </div>
      </div>

      <!-- Selector de Sub-Catálogo -->
      <div class="subnav-tabs">
        <button
          type="button"
          class="subnav-tab"
          [class.active]="tabActiva() === 'categorias'"
          (click)="cambiarTab('categorias')"
        >
          <span>Categorías</span>
          <span class="badge badge-neutral font-mono">{{ categorias().length }}</span>
        </button>

        <button
          type="button"
          class="subnav-tab"
          [class.active]="tabActiva() === 'marcas'"
          (click)="cambiarTab('marcas')"
        >
          <span>Marcas Comerciales</span>
          <span class="badge badge-neutral font-mono">{{ marcas().length }}</span>
        </button>

        <button
          type="button"
          class="subnav-tab"
          [class.active]="tabActiva() === 'unidades'"
          (click)="cambiarTab('unidades')"
        >
          <span>Unidades de Medida</span>
          <span class="badge badge-neutral font-mono">{{ unidades().length }}</span>
        </button>
      </div>

      @if (errorMensaje) {
        <div class="alert-box alert-error">
          {{ errorMensaje }}
        </div>
      }

      <!-- PANEL: CATEGORÍAS -->
      @if (tabActiva() === 'categorias') {
        <div class="catalog-section">
          <!-- Formulario de Alta / Edición In-Place -->
          <div class="card inline-form-card">
            <h3 class="form-title">
              {{ editandoCatId ? 'Modificar Categoría' : 'Nueva Categoría' }}
            </h3>
            <div class="inline-form-grid">
              <div class="form-group">
                <label>Nombre de Categoría <span class="required-mark">*</span></label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej. Filtros y Bujías"
                  [(ngModel)]="catFormNombre"
                />
              </div>
              <div class="form-group flex-2">
                <label>Descripción / Clasificación</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Detalles sobre los artículos de este rubro..."
                  [(ngModel)]="catFormDesc"
                />
              </div>
              <div class="form-group-btn">
                <button
                  type="button"
                  class="btn btn-primary"
                  (click)="guardarCategoria()"
                  [disabled]="!catFormNombre.trim()"
                >
                  {{ editandoCatId ? 'Guardar Cambios' : 'Registrar Categoría' }}
                </button>
                @if (editandoCatId) {
                  <button type="button" class="btn btn-secondary" (click)="cancelarEdicionCat()">
                    Cancelar
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Tabla de Categorías -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>NOMBRE DE CATEGORÍA</th>
                  <th>DESCRIPCIÓN</th>
                  <th>ESTADO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of categorias(); track cat.id) {
                  <tr [class.row-inactive]="!cat.activo">
                    <td><strong>{{ cat.nombre }}</strong></td>
                    <td class="text-secondary">{{ cat.descripcion || '—' }}</td>
                    <td>
                      @if (cat.activo) {
                        <span class="badge badge-success">Activa</span>
                      } @else {
                        <span class="badge badge-danger">Inactiva</span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="table-actions">
                        <button type="button" class="btn-table-action" (click)="iniciarEdicionCat(cat)">
                          Editar
                        </button>
                        <button
                          type="button"
                          class="btn-table-action"
                          [class.text-danger]="cat.activo"
                          (click)="toggleEstadoCat(cat)"
                        >
                          {{ cat.activo ? 'Desactivar' : 'Activar' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- PANEL: MARCAS -->
      @if (tabActiva() === 'marcas') {
        <div class="catalog-section">
          <!-- Formulario de Alta / Edición In-Place -->
          <div class="card inline-form-card">
            <h3 class="form-title">
              {{ editandoMarcaId ? 'Modificar Marca' : 'Nueva Marca Comercial' }}
            </h3>
            <div class="inline-form-grid">
              <div class="form-group">
                <label>Nombre de Marca <span class="required-mark">*</span></label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej. Continental, Mobil, Maxxis..."
                  [(ngModel)]="marcaFormNombre"
                />
              </div>
              <div class="form-group flex-2">
                <label>Descripción / Fabricante</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Origen, garantías o detalles de fábrica..."
                  [(ngModel)]="marcaFormDesc"
                />
              </div>
              <div class="form-group-btn">
                <button
                  type="button"
                  class="btn btn-primary"
                  (click)="guardarMarca()"
                  [disabled]="!marcaFormNombre.trim()"
                >
                  {{ editandoMarcaId ? 'Guardar Cambios' : 'Registrar Marca' }}
                </button>
                @if (editandoMarcaId) {
                  <button type="button" class="btn btn-secondary" (click)="cancelarEdicionMarca()">
                    Cancelar
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Tabla de Marcas -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>MARCA</th>
                  <th>DESCRIPCIÓN</th>
                  <th>ESTADO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                @for (m of marcas(); track m.id) {
                  <tr [class.row-inactive]="!m.activo">
                    <td><strong>{{ m.nombre }}</strong></td>
                    <td class="text-secondary">{{ m.descripcion || '—' }}</td>
                    <td>
                      @if (m.activo) {
                        <span class="badge badge-success">Activa</span>
                      } @else {
                        <span class="badge badge-danger">Inactiva</span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="table-actions">
                        <button type="button" class="btn-table-action" (click)="iniciarEdicionMarca(m)">
                          Editar
                        </button>
                        <button
                          type="button"
                          class="btn-table-action"
                          [class.text-danger]="m.activo"
                          (click)="toggleEstadoMarca(m)"
                        >
                          {{ m.activo ? 'Desactivar' : 'Activar' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- PANEL: UNIDADES DE MEDIDA -->
      @if (tabActiva() === 'unidades') {
        <div class="catalog-section">
          <!-- Formulario de Alta / Edición In-Place -->
          <div class="card inline-form-card">
            <h3 class="form-title">
              {{ editandoUnidadId ? 'Modificar Unidad' : 'Nueva Unidad de Medida' }}
            </h3>
            <div class="inline-form-grid">
              <div class="form-group">
                <label>Nombre Completo <span class="required-mark">*</span></label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej. Galón, Rollo, Paquete..."
                  [(ngModel)]="unidadFormNombre"
                />
              </div>
              <div class="form-group">
                <label>Abreviatura <span class="required-mark">*</span></label>
                <input
                  type="text"
                  class="form-control font-mono"
                  placeholder="Ej. GLN, RLL, PQT..."
                  [(ngModel)]="unidadFormAbrev"
                />
              </div>
              <div class="form-group-btn">
                <button
                  type="button"
                  class="btn btn-primary"
                  (click)="guardarUnidad()"
                  [disabled]="!unidadFormNombre.trim() || !unidadFormAbrev.trim()"
                >
                  {{ editandoUnidadId ? 'Guardar Cambios' : 'Registrar Unidad' }}
                </button>
                @if (editandoUnidadId) {
                  <button type="button" class="btn btn-secondary" (click)="cancelarEdicionUnidad()">
                    Cancelar
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Tabla de Unidades -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ABREVIATURA</th>
                  <th>NOMBRE COMPLETO</th>
                  <th>ESTADO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                @for (u of unidades(); track u.id) {
                  <tr [class.row-inactive]="!u.activo">
                    <td>
                      <span class="badge badge-neutral font-mono">{{ u.abreviatura }}</span>
                    </td>
                    <td><strong>{{ u.nombre }}</strong></td>
                    <td>
                      @if (u.activo) {
                        <span class="badge badge-success">Activa</span>
                      } @else {
                        <span class="badge badge-danger">Inactiva</span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="table-actions">
                        <button type="button" class="btn-table-action" (click)="iniciarEdicionUnidad(u)">
                          Editar
                        </button>
                        <button
                          type="button"
                          class="btn-table-action"
                          [class.text-danger]="u.activo"
                          (click)="toggleEstadoUnidad(u)"
                        >
                          {{ u.activo ? 'Desactivar' : 'Activar' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
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

    /* Subnav */
    .subnav-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 4px;
    }

    .subnav-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: none;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background-color: var(--surface-subtle);
        color: var(--text-primary);
      }

      &.active {
        background-color: var(--surface-card);
        border-color: var(--border-color);
        color: var(--accent-primary);
        font-weight: 600;
      }
    }

    .catalog-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .inline-form-card {
      background-color: var(--surface-card);
      border: 1px solid var(--border-color);
      padding: 16px 20px;
    }

    .form-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .inline-form-grid {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      flex-wrap: wrap;

      .form-group {
        flex: 1;
        min-width: 180px;
        margin-bottom: 0;
      }

      .flex-2 {
        flex: 2;
        min-width: 240px;
      }

      .form-group-btn {
        display: flex;
        gap: 8px;
        align-items: center;
        height: 38px;
      }
    }

    .table-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-table-action {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12.5px;
      color: var(--accent-primary);
      padding: 2px 4px;

      &:hover { text-decoration: underline; }

      &.text-danger {
        color: var(--state-danger);
      }
    }

    .row-inactive {
      opacity: 0.6;
      background-color: #FAFAFA;
    }

    .alert-box {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;

      &.alert-error {
        background-color: var(--state-danger-bg);
        border: 1px solid var(--state-danger-border);
        color: var(--state-danger);
      }
    }
  `],
})
export class CatalogosAdminComponent implements OnInit {
  private catalogoService = inject(CatalogoService);

  tabActiva = signal<TabCatalogo>('categorias');

  categorias = signal<Categoria[]>([]);
  marcas = signal<Marca[]>([]);
  unidades = signal<UnidadMedida[]>([]);

  errorMensaje = '';

  // Form states Categorías
  editandoCatId: string | null = null;
  catFormNombre = '';
  catFormDesc = '';

  // Form states Marcas
  editandoMarcaId: string | null = null;
  marcaFormNombre = '';
  marcaFormDesc = '';

  // Form states Unidades
  editandoUnidadId: string | null = null;
  unidadFormNombre = '';
  unidadFormAbrev = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.catalogoService.getCategorias().subscribe((c) => this.categorias.set(c));
    this.catalogoService.getMarcas().subscribe((m) => this.marcas.set(m));
    this.catalogoService.getUnidades().subscribe((u) => this.unidades.set(u));
  }

  cambiarTab(tab: TabCatalogo): void {
    this.tabActiva.set(tab);
    this.errorMensaje = '';
  }

  /* CATEGORÍAS */
  iniciarEdicionCat(cat: Categoria): void {
    this.editandoCatId = cat.id;
    this.catFormNombre = cat.nombre;
    this.catFormDesc = cat.descripcion ?? '';
    this.errorMensaje = '';
  }

  cancelarEdicionCat(): void {
    this.editandoCatId = null;
    this.catFormNombre = '';
    this.catFormDesc = '';
  }

  guardarCategoria(): void {
    const nombre = this.catFormNombre.trim();
    if (!nombre) return;

    // Validación unicidad en cliente
    const duplicado = this.categorias().some(
      (c) => c.nombre.toLowerCase() === nombre.toLowerCase() && c.id !== this.editandoCatId
    );
    if (duplicado) {
      this.errorMensaje = `La categoría "${nombre}" ya existe en el catálogo.`;
      return;
    }

    this.errorMensaje = '';
    if (this.editandoCatId) {
      this.catalogoService
        .actualizarCategoria(this.editandoCatId, { nombre, descripcion: (this.catFormDesc || '').trim() })
        .subscribe({
          next: (updated) => {
            this.categorias.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
            this.cancelarEdicionCat();
          },
          error: (err) => (this.errorMensaje = err?.error?.mensaje || 'Error al actualizar categoría'),
        });
    } else {
      this.catalogoService
        .crearCategoria({ nombre, descripcion: (this.catFormDesc || '').trim() })
        .subscribe({
          next: (created) => {
            this.categorias.update((list) => [...list, created]);
            this.cancelarEdicionCat();
          },
          error: (err) => (this.errorMensaje = err?.error?.mensaje || 'Error al registrar categoría'),
        });
    }
  }

  toggleEstadoCat(cat: Categoria): void {
    this.catalogoService.toggleCategoriaActivo(cat.id).subscribe({
      next: (updated) => {
        this.categorias.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
      },
    });
  }

  /* MARCAS */
  iniciarEdicionMarca(m: Marca): void {
    this.editandoMarcaId = m.id;
    this.marcaFormNombre = m.nombre;
    this.marcaFormDesc = m.descripcion ?? '';
    this.errorMensaje = '';
  }

  cancelarEdicionMarca(): void {
    this.editandoMarcaId = null;
    this.marcaFormNombre = '';
    this.marcaFormDesc = '';
  }

  guardarMarca(): void {
    const nombre = this.marcaFormNombre.trim();
    if (!nombre) return;

    // Validación unicidad
    const duplicado = this.marcas().some(
      (m) => m.nombre.toLowerCase() === nombre.toLowerCase() && m.id !== this.editandoMarcaId
    );
    if (duplicado) {
      this.errorMensaje = `La marca "${nombre}" ya existe en el catálogo.`;
      return;
    }

    this.errorMensaje = '';
    if (this.editandoMarcaId) {
      this.catalogoService
        .actualizarMarca(this.editandoMarcaId, { nombre, descripcion: (this.marcaFormDesc || '').trim() })
        .subscribe({
          next: (updated) => {
            this.marcas.update((list) => list.map((m) => (m.id === updated.id ? updated : m)));
            this.cancelarEdicionMarca();
          },
          error: (err) => (this.errorMensaje = err?.error?.mensaje || 'Error al actualizar marca'),
        });
    } else {
      this.catalogoService
        .crearMarca({ nombre, descripcion: (this.marcaFormDesc || '').trim() })
        .subscribe({
          next: (created) => {
            this.marcas.update((list) => [...list, created]);
            this.cancelarEdicionMarca();
          },
          error: (err) => (this.errorMensaje = err?.error?.mensaje || 'Error al registrar marca'),
        });
    }
  }

  toggleEstadoMarca(m: Marca): void {
    this.catalogoService.toggleMarcaActivo(m.id).subscribe({
      next: (updated) => {
        this.marcas.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      },
    });
  }

  /* UNIDADES DE MEDIDA */
  iniciarEdicionUnidad(u: UnidadMedida): void {
    this.editandoUnidadId = u.id;
    this.unidadFormNombre = u.nombre;
    this.unidadFormAbrev = u.abreviatura;
    this.errorMensaje = '';
  }

  cancelarEdicionUnidad(): void {
    this.editandoUnidadId = null;
    this.unidadFormNombre = '';
    this.unidadFormAbrev = '';
  }

  guardarUnidad(): void {
    const nombre = this.unidadFormNombre.trim();
    const abreviatura = this.unidadFormAbrev.trim().toUpperCase();
    if (!nombre || !abreviatura) return;

    // Validación unicidad nombre y abreviatura
    const dupNombre = this.unidades().some(
      (u) => u.nombre.toLowerCase() === nombre.toLowerCase() && u.id !== this.editandoUnidadId
    );
    if (dupNombre) {
      this.errorMensaje = `El nombre de unidad "${nombre}" ya existe.`;
      return;
    }

    const dupAbrev = this.unidades().some(
      (u) => u.abreviatura.toUpperCase() === abreviatura && u.id !== this.editandoUnidadId
    );
    if (dupAbrev) {
      this.errorMensaje = `La abreviatura "${abreviatura}" ya se encuentra registrada.`;
      return;
    }

    this.errorMensaje = '';
    if (this.editandoUnidadId) {
      this.catalogoService
        .actualizarUnidad(this.editandoUnidadId, { nombre, abreviatura })
        .subscribe({
          next: (updated) => {
            this.unidades.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
            this.cancelarEdicionUnidad();
          },
          error: (err) => (this.errorMensaje = err?.error?.mensaje || 'Error al actualizar unidad'),
        });
    } else {
      this.catalogoService
        .crearUnidad({ nombre, abreviatura })
        .subscribe({
          next: (created) => {
            this.unidades.update((list) => [...list, created]);
            this.cancelarEdicionUnidad();
          },
          error: (err) => (this.errorMensaje = err?.error?.mensaje || 'Error al registrar unidad'),
        });
    }
  }

  toggleEstadoUnidad(u: UnidadMedida): void {
    this.catalogoService.toggleUnidadActivo(u.id).subscribe({
      next: (updated) => {
        this.unidades.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      },
    });
  }
}
