import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { ProductoService } from '../../../core/services/producto.service';
import { Categoria, Marca, UnidadMedida } from '../../../core/models/catalogos.model';
import { CurrencyPenPipe } from '../../../shared/pipes/currency-pen.pipe';

@Component({
  selector: 'app-producto-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, CurrencyPenPipe],
  template: `
    <div class="wizard-container">
      <!-- Encabezado del Wizard -->
      <div class="wizard-header">
        <div class="header-titles">
          <div class="breadcrumb-back">
            <a routerLink="/productos" class="link-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver al catálogo de productos
            </a>
          </div>
          <h1 class="wizard-title">Asistente de Creación de Producto</h1>
          <p class="wizard-subtitle">
            Flujo guiado para dar de alta artículos garantizando la jerarquía de catálogo desde cero.
          </p>
        </div>
      </div>

      <!-- Stepper Visual (1 a 5) -->
      <div class="stepper-bar">
        <div class="step-item" [class.active]="pasoActual() === 1" [class.completed]="pasoActual() > 1">
          <div class="step-number">
            @if (pasoActual() > 1) {
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            } @else {
              1
            }
          </div>
          <div class="step-label">Categoría</div>
        </div>
        <div class="step-connector" [class.completed]="pasoActual() > 1"></div>

        <div class="step-item" [class.active]="pasoActual() === 2" [class.completed]="pasoActual() > 2">
          <div class="step-number">
            @if (pasoActual() > 2) {
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            } @else {
              2
            }
          </div>
          <div class="step-label">Marca</div>
        </div>
        <div class="step-connector" [class.completed]="pasoActual() > 2"></div>

        <div class="step-item" [class.active]="pasoActual() === 3" [class.completed]="pasoActual() > 3">
          <div class="step-number">
            @if (pasoActual() > 3) {
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            } @else {
              3
            }
          </div>
          <div class="step-label">Unidad Medida</div>
        </div>
        <div class="step-connector" [class.completed]="pasoActual() > 3"></div>

        <div class="step-item" [class.active]="pasoActual() === 4" [class.completed]="pasoActual() > 4">
          <div class="step-number">
            @if (pasoActual() > 4) {
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            } @else {
              4
            }
          </div>
          <div class="step-label">Datos de Producto</div>
        </div>
        <div class="step-connector" [class.completed]="pasoActual() > 4"></div>

        <div class="step-item" [class.active]="pasoActual() === 5">
          <div class="step-number">5</div>
          <div class="step-label">Confirmación</div>
        </div>
      </div>

      <!-- Contenedor del Paso Activo -->
      <div class="wizard-content-card">
        @if (errorMensaje) {
          <div class="alert-box alert-error">
            <span>{{ errorMensaje }}</span>
          </div>
        }

        <!-- PASO 1: CATEGORÍA -->
        @if (pasoActual() === 1) {
          <div class="step-panel">
            <div class="step-intro">
              <h2 class="step-heading">Paso 1: Seleccionar o Crear Categoría</h2>
              <p class="step-desc">
                Elige la categoría a la que pertenece el producto o crea una nueva inmediatamente.
              </p>
            </div>

            <div class="selection-grid">
              @for (cat of categorias(); track cat.id) {
                <div
                  class="choice-card"
                  [class.selected]="wizardData.categoriaId === cat.id"
                  (click)="seleccionarCategoria(cat)"
                >
                  <div class="choice-title">{{ cat.nombre }}</div>
                  <div class="choice-subtitle">{{ cat.descripcion || 'Sin descripción' }}</div>
                </div>
              }
            </div>

            <!-- Formulario In-situ para crear categoría -->
            <div class="inline-creation-box">
              <h3 class="inline-title">+ ¿No encuentras la categoría? Créala al vuelo:</h3>
              <div class="inline-form-row">
                <input
                  type="text"
                  class="form-control"
                  placeholder="Nombre de la nueva categoría..."
                  [(ngModel)]="nuevaCatNombre"
                />
                <input
                  type="text"
                  class="form-control"
                  placeholder="Descripción breve..."
                  [(ngModel)]="nuevaCatDesc"
                />
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="crearCategoriaInSitu()"
                  [disabled]="!nuevaCatNombre.trim()"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </div>
          </div>
        }

        <!-- PASO 2: MARCA -->
        @if (pasoActual() === 2) {
          <div class="step-panel">
            <div class="step-intro">
              <h2 class="step-heading">Paso 2: Seleccionar o Crear Marca</h2>
              <p class="step-desc">
                Define el fabricante o marca comercial del artículo.
              </p>
            </div>

            <div class="selection-grid">
              @for (m of marcas(); track m.id) {
                <div
                  class="choice-card"
                  [class.selected]="wizardData.marcaId === m.id"
                  (click)="seleccionarMarca(m)"
                >
                  <div class="choice-title">{{ m.nombre }}</div>
                  <div class="choice-subtitle">{{ m.descripcion || 'Sin descripción' }}</div>
                </div>
              }
            </div>

            <!-- Formulario In-situ para crear marca -->
            <div class="inline-creation-box">
              <h3 class="inline-title">+ ¿La marca no está en la lista? Créala ahora:</h3>
              <div class="inline-form-row">
                <input
                  type="text"
                  class="form-control"
                  placeholder="Nombre de la nueva marca (ej. Pirelli, Mobil)..."
                  [(ngModel)]="nuevaMarcaNombre"
                />
                <input
                  type="text"
                  class="form-control"
                  placeholder="Descripción de la marca..."
                  [(ngModel)]="nuevaMarcaDesc"
                />
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="crearMarcaInSitu()"
                  [disabled]="!nuevaMarcaNombre.trim()"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </div>
          </div>
        }

        <!-- PASO 3: UNIDAD DE MEDIDA -->
        @if (pasoActual() === 3) {
          <div class="step-panel">
            <div class="step-intro">
              <h2 class="step-heading">Paso 3: Seleccionar o Crear Unidad de Medida</h2>
              <p class="step-desc">
                Especifica la unidad de conteo para control de existencias (Obligatorio en base de datos).
              </p>
            </div>

            <div class="selection-grid selection-grid-compact">
              @for (um of unidades(); track um.id) {
                <div
                  class="choice-card"
                  [class.selected]="wizardData.unidadMedidaId === um.id"
                  (click)="seleccionarUnidad(um)"
                >
                  <div class="choice-title font-mono">{{ um.abreviatura }}</div>
                  <div class="choice-subtitle">{{ um.nombre }}</div>
                </div>
              }
            </div>

            <!-- Formulario In-situ para crear unidad -->
            <div class="inline-creation-box">
              <h3 class="inline-title">+ Crear nueva unidad de medida:</h3>
              <div class="inline-form-row">
                <input
                  type="text"
                  class="form-control"
                  placeholder="Nombre completo (ej. Galón, Rollo)..."
                  [(ngModel)]="nuevaUnidadNombre"
                />
                <input
                  type="text"
                  class="form-control font-mono"
                  placeholder="Abreviatura (ej. GLN, RLL)..."
                  [(ngModel)]="nuevaUnidadAbrev"
                />
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="crearUnidadInSitu()"
                  [disabled]="!nuevaUnidadNombre.trim() || !nuevaUnidadAbrev.trim()"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </div>
          </div>
        }

        <!-- PASO 4: DATOS DEL PRODUCTO -->
        @if (pasoActual() === 4) {
          <div class="step-panel">
            <div class="step-intro">
              <h2 class="step-heading">Paso 4: Datos del Producto</h2>
              <p class="step-desc">
                Ingresa el código identificador único, nombre comercial, precios y stock mínimo de alerta.
              </p>
            </div>

            <form [formGroup]="datosForm" class="step-form">
              <div class="form-grid-2">
                <div class="form-group">
                  <label for="w-codigo">
                    Código de Producto (Único)
                    <span class="required-mark">*</span>
                  </label>
                  <input
                    id="w-codigo"
                    type="text"
                    class="form-control font-mono"
                    [class.has-error]="esInvalido('codigo')"
                    formControlName="codigo"
                    placeholder="Ej. LL-2055516-PIRELLI"
                  />
                  @if (esInvalido('codigo')) {
                    <span class="form-error">Código requerido y sin espacios especiales.</span>
                  }
                </div>

                <div class="form-group">
                  <label for="w-nombre">
                    Nombre del Producto
                    <span class="required-mark">*</span>
                  </label>
                  <input
                    id="w-nombre"
                    type="text"
                    class="form-control"
                    [class.has-error]="esInvalido('nombre')"
                    formControlName="nombre"
                    placeholder="Ej. Llanta Pirelli Cinturato P7 205/55 R16"
                  />
                  @if (esInvalido('nombre')) {
                    <span class="form-error">Nombre requerido (mínimo 3 caracteres).</span>
                  }
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label for="w-precioVenta">
                    Precio de Venta (S/.)
                    <span class="required-mark">*</span>
                  </label>
                  <input
                    id="w-precioVenta"
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
                    <span class="form-error">Ingresa un precio de hasta S/ 10,000,000 con máximo 2 decimales.</span>
                  }
                </div>

                <div class="form-group">
                  <label for="w-stockMinimo">
                    Stock Mínimo de Alerta
                    <span class="required-mark">*</span>
                  </label>
                  <input
                    id="w-stockMinimo"
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
                    <span class="form-error">El stock mínimo debe ser un entero entre 0 y 999,999.</span>
                  }
                </div>
              </div>

              <div class="form-group">
                <label for="w-descripcion">Descripción detallada y especificaciones técnicas</label>
                <textarea
                  id="w-descripcion"
                  rows="3"
                  class="form-control"
                  formControlName="descripcion"
                  placeholder="Detalles sobre medidas, especificaciones de carga, índice de velocidad, composición..."
                ></textarea>
              </div>
            </form>
          </div>
        }

        <!-- PASO 5: CONFIRMACIÓN Y RESUMEN -->
        @if (pasoActual() === 5) {
          <div class="step-panel">
            <div class="step-intro">
              <h2 class="step-heading">Paso 5: Confirmación de Registro</h2>
              <p class="step-desc">
                Revisa los datos consolidados antes de guardar el producto en el catálogo oficial.
              </p>
            </div>

            <div class="summary-card">
              <div class="summary-row">
                <span class="summary-label">Código de Producto:</span>
                <span class="summary-value font-mono highlight">{{ datosForm.get('codigo')?.value }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Nombre del Producto:</span>
                <span class="summary-value text-strong">{{ datosForm.get('nombre')?.value }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Categoría Seleccionada:</span>
                <span class="summary-value">{{ resumenCategoria() }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Marca Seleccionada:</span>
                <span class="summary-value">{{ resumenMarca() }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Unidad de Medida:</span>
                <span class="summary-value font-mono">{{ resumenUnidad() }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Precio de Venta al Público:</span>
                <span class="summary-value font-mono text-strong">
                  {{ datosForm.get('precioVenta')?.value | currencyPen }}
                </span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Stock Mínimo de Alerta:</span>
                <span class="summary-value font-mono">{{ datosForm.get('stockMinimo')?.value }} unidades</span>
              </div>
              @if (datosForm.get('descripcion')?.value) {
                <div class="summary-row">
                  <span class="summary-label">Especificaciones:</span>
                  <span class="summary-value text-muted">{{ datosForm.get('descripcion')?.value }}</span>
                </div>
              }
            </div>

            <div class="confirmation-note">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>
                El producto se guardará con estado <strong>Activo</strong> e inventario inicial en 0 unidades listo para recibir entradas en el módulo de Inventario.
              </span>
            </div>
          </div>
        }

        <!-- Botones de Navegación del Wizard -->
        <div class="wizard-actions">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="retrocederPaso()"
            [disabled]="pasoActual() === 1 || guardando"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Paso Anterior
          </button>

          <div class="actions-right">
            @if (pasoActual() < 5) {
              <button
                type="button"
                class="btn btn-primary"
                (click)="avanzarPaso()"
                [disabled]="!puedeAvanzar()"
              >
                <span>Continuar al Paso {{ pasoActual() + 1 }}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-left:4px;">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            } @else {
              <button
                type="button"
                class="btn btn-primary"
                (click)="finalizarRegistro()"
                [disabled]="guardando"
              >
                @if (guardando) {
                  <span class="spinner"></span>
                  <span>Guardando en catálogo...</span>
                } @else {
                  <span>Confirmar y Guardar Producto</span>
                }
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wizard-container {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .breadcrumb-back {
      margin-bottom: 8px;
    }

    .link-back {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
      &:hover {
        color: var(--accent-primary);
      }
    }

    .wizard-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .wizard-subtitle {
      font-size: 13.5px;
      color: var(--text-secondary);
      margin-top: 3px;
    }

    /* Stepper */
    .stepper-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 16px 24px;
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0.55;
      transition: opacity var(--transition-fast);

      &.active {
        opacity: 1;

        .step-number {
          background-color: var(--accent-primary);
          color: #FFFFFF;
          border-color: var(--accent-primary);
        }

        .step-label {
          color: var(--text-primary);
          font-weight: 600;
        }
      }

      &.completed {
        opacity: 0.9;

        .step-number {
          background-color: var(--state-success-bg);
          color: var(--state-success);
          border-color: var(--state-success-border);
          font-weight: 700;
        }

        .step-label {
          color: var(--text-secondary);
        }
      }
    }

    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.5px solid var(--border-strong);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      background-color: var(--surface-subtle);
    }

    .step-label {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .step-connector {
      flex: 1;
      height: 2px;
      background-color: var(--border-color);
      margin: 0 12px;

      &.completed {
        background-color: var(--state-success);
      }
    }

    /* Card de contenido */
    .wizard-content-card {
      background-color: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 28px 32px;
    }

    .step-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .step-heading {
      font-size: 17px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .step-desc {
      font-size: 13.5px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    /* Grilla de Opciones */
    .selection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;

      &.selection-grid-compact {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      }
    }

    .choice-card {
      background-color: var(--surface-subtle);
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 14px;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--border-strong);
        background-color: #ECEEF1;
      }

      &.selected {
        border-color: var(--accent-primary);
        background-color: var(--accent-subtle);

        .choice-title {
          color: var(--accent-primary);
          font-weight: 600;
        }
      }
    }

    .choice-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .choice-subtitle {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.3;
    }

    /* Creación In-Situ */
    .inline-creation-box {
      margin-top: 10px;
      padding: 16px;
      background-color: #FAFAFA;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-md);
    }

    .inline-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 10px;
    }

    .inline-form-row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;

      .form-control {
        flex: 1;
        min-width: 160px;
      }
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    /* Resumen de Confirmación */
    .summary-card {
      background-color: var(--surface-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
    }

    .summary-label {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .summary-value {
      font-size: 13.5px;
      color: var(--text-primary);

      &.highlight {
        color: var(--accent-primary);
        font-weight: 600;
      }
    }

    .confirmation-note {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background-color: var(--accent-subtle);
      border: 1px solid var(--accent-border);
      border-radius: var(--radius-md);
      font-size: 13px;
      color: var(--accent-primary);
    }

    /* Botones de acción inferiores */
    .wizard-actions {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .alert-box {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      margin-bottom: 16px;

      &.alert-error {
        background-color: var(--state-danger-bg);
        border: 1px solid var(--state-danger-border);
        color: var(--state-danger);
      }
    }
  `],
})
export class ProductoWizardComponent implements OnInit {
  private catalogoService = inject(CatalogoService);
  private productoService = inject(ProductoService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  pasoActual = signal<number>(1);
  categorias = signal<Categoria[]>([]);
  marcas = signal<Marca[]>([]);
  unidades = signal<UnidadMedida[]>([]);

  // Datos seleccionados en los pasos
  wizardData = {
    categoriaId: null as string | null,
    marcaId: null as string | null,
    unidadMedidaId: '' as string,
  };

  // Formulario del Paso 4
  datosForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-_]+$/)]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    precioVenta: [0, [Validators.required, Validators.min(0), Validators.max(10000000), Validators.pattern(/^\d+(?:\.\d{1,2})?$/)]],
    stockMinimo: [0, [Validators.required, Validators.min(0), Validators.max(999999), Validators.pattern(/^\d+$/)]],
  });

  // Campos de creación in-situ
  nuevaCatNombre = '';
  nuevaCatDesc = '';
  nuevaMarcaNombre = '';
  nuevaMarcaDesc = '';
  nuevaUnidadNombre = '';
  nuevaUnidadAbrev = '';

  guardando = false;
  errorMensaje = '';

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.catalogoService.getCategorias().subscribe((c) => this.categorias.set(c));
    this.catalogoService.getMarcas().subscribe((m) => this.marcas.set(m));
    this.catalogoService.getUnidades().subscribe((u) => {
      this.unidades.set(u);
      if (!this.wizardData.unidadMedidaId && u.length > 0) {
        this.wizardData.unidadMedidaId = u[0].id;
      }
    });
  }

  // Paso 1
  seleccionarCategoria(cat: Categoria): void {
    this.wizardData.categoriaId = cat.id;
    this.errorMensaje = '';
  }

  crearCategoriaInSitu(): void {
    if (!this.nuevaCatNombre.trim()) return;
    this.catalogoService
      .crearCategoria({ nombre: this.nuevaCatNombre.trim(), descripcion: this.nuevaCatDesc.trim() })
      .subscribe({
        next: (cat) => {
          this.categorias.update((list) => [...list, cat]);
          this.wizardData.categoriaId = cat.id;
          this.nuevaCatNombre = '';
          this.nuevaCatDesc = '';
        },
        error: (err) => (this.errorMensaje = err?.error?.mensaje || 'Error al crear la categoría.'),
      });
  }

  // Paso 2
  seleccionarMarca(m: Marca): void {
    this.wizardData.marcaId = m.id;
    this.errorMensaje = '';
  }

  crearMarcaInSitu(): void {
    if (!this.nuevaMarcaNombre.trim()) return;
    this.catalogoService
      .crearMarca({ nombre: this.nuevaMarcaNombre.trim(), descripcion: this.nuevaMarcaDesc.trim() })
      .subscribe({
        next: (m) => {
          this.marcas.update((list) => [...list, m]);
          this.wizardData.marcaId = m.id;
          this.nuevaMarcaNombre = '';
          this.nuevaMarcaDesc = '';
        },
        error: (err) => (this.errorMensaje = err?.error?.mensaje || 'Error al crear la marca.'),
      });
  }

  // Paso 3
  seleccionarUnidad(um: UnidadMedida): void {
    this.wizardData.unidadMedidaId = um.id;
    this.errorMensaje = '';
  }

  crearUnidadInSitu(): void {
    if (!this.nuevaUnidadNombre.trim() || !this.nuevaUnidadAbrev.trim()) return;
    this.catalogoService
      .crearUnidad({ nombre: this.nuevaUnidadNombre.trim(), abreviatura: this.nuevaUnidadAbrev.trim() })
      .subscribe({
        next: (um) => {
          this.unidades.update((list) => [...list, um]);
          this.wizardData.unidadMedidaId = um.id;
          this.nuevaUnidadNombre = '';
          this.nuevaUnidadAbrev = '';
        },
        error: (err) => (this.errorMensaje = err?.error?.mensaje || 'Error al crear unidad.'),
      });
  }

  esInvalido(campo: string): boolean {
    const c = this.datosForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  puedeAvanzar(): boolean {
    const p = this.pasoActual();
    if (p === 1) return !!this.wizardData.categoriaId;
    if (p === 2) return !!this.wizardData.marcaId;
    if (p === 3) return !!this.wizardData.unidadMedidaId;
    if (p === 4) return this.datosForm.valid;
    return true;
  }

  avanzarPaso(): void {
    this.errorMensaje = '';
    const p = this.pasoActual();

    if (p === 1 && !this.wizardData.categoriaId) {
      this.errorMensaje = 'Debe seleccionar o crear una categoría para continuar.';
      return;
    }
    if (p === 2 && !this.wizardData.marcaId) {
      this.errorMensaje = 'Debe seleccionar o crear una marca para continuar.';
      return;
    }
    if (p === 3 && !this.wizardData.unidadMedidaId) {
      this.errorMensaje = 'Debe seleccionar una unidad de medida para el control de inventario.';
      return;
    }
    if (p === 4) {
      if (this.datosForm.invalid) {
        this.datosForm.markAllAsTouched();
        return;
      }
    }

    if (p < 5) {
      this.pasoActual.update((curr) => curr + 1);
    }
  }

  retrocederPaso(): void {
    this.errorMensaje = '';
    if (this.pasoActual() > 1) {
      this.pasoActual.update((curr) => curr - 1);
    }
  }

  // Resumen helpers para paso 5
  resumenCategoria(): string {
    const c = this.categorias().find((cat) => cat.id === this.wizardData.categoriaId);
    return c ? c.nombre : '—';
  }

  resumenMarca(): string {
    const m = this.marcas().find((mar) => mar.id === this.wizardData.marcaId);
    return m ? m.nombre : '—';
  }

  resumenUnidad(): string {
    const u = this.unidades().find((um) => um.id === this.wizardData.unidadMedidaId);
    return u ? `${u.nombre} (${u.abreviatura})` : '—';
  }

  finalizarRegistro(): void {
    this.guardando = true;
    this.errorMensaje = '';

    const payload = {
      codigo: this.datosForm.get('codigo')?.value.trim().toUpperCase(),
      nombre: this.datosForm.get('nombre')?.value.trim(),
      descripcion: this.datosForm.get('descripcion')?.value?.trim() || '',
      categoriaId: this.wizardData.categoriaId,
      marcaId: this.wizardData.marcaId,
      unidadMedidaId: this.wizardData.unidadMedidaId,
      precioVenta: Number(this.datosForm.get('precioVenta')?.value),
      stockMinimo: Number(this.datosForm.get('stockMinimo')?.value),
      activo: true,
    };

    this.productoService.crear(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/productos']);
      },
      error: (err) => {
        this.guardando = false;
        this.errorMensaje =
          err?.error?.mensaje || 'Error al guardar el producto. Verifique que el código no esté duplicado.';
      },
    });
  }
}
