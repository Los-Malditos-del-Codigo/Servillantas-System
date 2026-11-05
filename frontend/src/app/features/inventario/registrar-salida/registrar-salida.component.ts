import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { Producto } from '../../../core/models/producto.model';
import { Inventario } from '../../../core/models/inventario.model';

@Component({
  selector: 'app-registrar-salida',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-page-container">
      <div class="form-header">
        <div class="breadcrumb-back">
          <a routerLink="/inventario" class="link-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver al panel de stock
          </a>
        </div>
        <h1 class="form-title">Registrar Salida de Inventario (HU-08)</h1>
        <p class="form-subtitle">
          Descargo de existencias físicas por ventas, servicios en taller, mermas o ajustes.
        </p>
      </div>

      <div class="form-card">
        @if (errorMensaje) {
          <div class="alert-box alert-error">
            {{ errorMensaje }}
          </div>
        }

        @if (exitoMensaje) {
          <div class="alert-box alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:6px;">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {{ exitoMensaje }}
          </div>
        }

        <form [formGroup]="salidaForm" (ngSubmit)="onSubmit()" novalidate>
          <!-- Selección de Producto -->
          <div class="form-group">
            <label for="productoId">
              Producto a Descargar
              <span class="required-mark">*</span>
            </label>
            <select
              id="productoId"
              class="form-control"
              [class.has-error]="esInvalido('productoId')"
              formControlName="productoId"
              (change)="onProductoSeleccionado()"
            >
              <option value="">-- Seleccione un producto del catálogo --</option>
              @for (p of productos(); track p.id) {
                <option [value]="p.id">
                  [{{ p.codigo }}] {{ p.nombre }}
                </option>
              }
            </select>
            @if (esInvalido('productoId')) {
              <span class="form-error">Debe seleccionar un producto.</span>
            }
          </div>

          <!-- Monitor de Stock Disponible en Vivo (HU-08) -->
          @if (productoSeleccionado) {
            <div
              class="stock-preview-box"
              [class.danger-box]="stockDisponible <= 0 || esExcesoDeStock"
            >
              <div class="preview-item">
                <span class="preview-label">Stock Disponible Actual:</span>
                <span class="preview-value font-mono" [class.text-danger]="stockDisponible === 0">
                  {{ stockDisponible }} unidades
                </span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Remanente Proyectado:</span>
                <span
                  class="preview-value font-mono"
                  [class.text-danger]="remanenteProyectado < 0"
                  [class.text-warning]="remanenteProyectado <= productoSeleccionado.stockMinimo && remanenteProyectado >= 0"
                >
                  {{ remanenteProyectado }} unidades
                </span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Stock Mínimo Alerta:</span>
                <span class="preview-value font-mono">
                  {{ productoSeleccionado.stockMinimo }}
                </span>
              </div>
            </div>

            @if (stockDisponible <= 0) {
              <div class="alert-inline-danger">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Este producto se encuentra actualmente AGOTADO (0 unidades disponibles). No es posible registrar salidas físicas.
              </div>
            }
          }

          <!-- Cantidad y Motivo -->
          <div class="form-grid-2">
            <div class="form-group">
              <label for="cantidad">
                Cantidad a Descargar
                <span class="required-mark">*</span>
              </label>
              <input
                id="cantidad"
                type="number"
                min="1"
                max="999999"
                step="1"
                class="form-control font-mono"
                [class.has-error]="esInvalido('cantidad') || esExcesoDeStock"
                formControlName="cantidad"
                placeholder="1"
                [disabled]="!productoSeleccionado || stockDisponible <= 0"
              />
              @if (esInvalido('cantidad') && !esExcesoDeStock) {
                <span class="form-error">La cantidad debe ser mayor a 0.</span>
              }
              @if (esExcesoDeStock) {
                <span class="form-error">
                  La cantidad solicitada supera el stock disponible (Disponible: {{ stockDisponible }}).
                </span>
              }
            </div>

            <div class="form-group">
              <label for="motivo">
                Motivo de Salida
                <span class="required-mark">*</span>
              </label>
              <select
                id="motivo"
                class="form-control"
                [class.has-error]="esInvalido('motivo')"
                formControlName="motivo"
              >
                <option value="Venta">Venta directa al cliente</option>
                <option value="Uso en servicio de taller">Uso en servicio de taller / instalación</option>
                <option value="Merma o daño">Merma, rotura o daño en manipulación</option>
                <option value="Ajuste de inventario">Ajuste de inventario (auditoría física)</option>
                <option value="Otro">Otro (especificar abajo)</option>
              </select>
              @if (esInvalido('motivo')) {
                <span class="form-error">El motivo es obligatorio.</span>
              }
            </div>
          </div>

          <!-- Si el motivo es Otro, pedir detalle libre -->
          @if (salidaForm.get('motivo')?.value === 'Otro') {
            <div class="form-group">
              <label for="motivoOtro">
                Especifique el motivo de salida
                <span class="required-mark">*</span>
              </label>
              <input
                id="motivoOtro"
                type="text"
                class="form-control"
                [class.has-error]="esInvalido('motivoOtro')"
                formControlName="motivoOtro"
                placeholder="Describa el causal de la salida..."
              />
              @if (esInvalido('motivoOtro')) {
                <span class="form-error">Debe especificar el motivo si selecciona 'Otro'.</span>
              }
            </div>
          }

          <!-- Observaciones -->
          <div class="form-group">
            <label for="observaciones">Observaciones / Referencia de Destino (Opcional)</label>
            <textarea
              id="observaciones"
              rows="3"
              class="form-control"
              formControlName="observaciones"
              placeholder="Número de orden de trabajo, placa de vehículo, cliente o justificativo de merma..."
            ></textarea>
          </div>

          <!-- Botones de Acción -->
          <div class="form-actions">
            <a routerLink="/inventario" class="btn btn-secondary">
              Cancelar
            </a>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="guardando || salidaForm.invalid || esExcesoDeStock || stockDisponible <= 0"
            >
              @if (guardando) {
                <span class="spinner"></span>
                <span>Procesando salida...</span>
              } @else {
                <span>Confirmar y Registrar Salida</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page-container {
      max-width: 760px;
      margin: 0 auto;
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

    .form-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .form-subtitle {
      font-size: 13.5px;
      color: var(--text-secondary);
      margin-top: 3px;
    }

    .form-card {
      background-color: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 28px 32px;
    }

    .stock-preview-box {
      background-color: var(--surface-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      transition: all var(--transition-fast);

      &.danger-box {
        background-color: var(--state-danger-bg);
        border-color: var(--state-danger-border);
      }
    }

    .preview-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .preview-label {
      font-size: 11.5px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .preview-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .text-danger { color: var(--state-danger) !important; }
    .text-warning { color: var(--state-warning) !important; }

    .alert-inline-danger {
      background-color: var(--state-danger-bg);
      border: 1px solid var(--state-danger-border);
      color: var(--state-danger);
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 12.5px;
      margin-bottom: 18px;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--border-color);
    }

    .alert-box {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      margin-bottom: 20px;

      &.alert-error {
        background-color: var(--state-danger-bg);
        border: 1px solid var(--state-danger-border);
        color: var(--state-danger);
      }

      &.alert-success {
        background-color: var(--state-success-bg);
        border: 1px solid var(--state-success-border);
        color: var(--state-success);
      }
    }
  `],
})
export class RegistrarSalidaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private inventarioService = inject(InventarioService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  inventarios = signal<Inventario[]>([]);

  productoSeleccionado: Producto | null = null;
  stockDisponible = 0;

  guardando = false;
  errorMensaje = '';
  exitoMensaje = '';

  salidaForm: FormGroup = this.fb.group({
    productoId: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1), Validators.max(999999), Validators.pattern(/^\d+$/)]],
    motivo: ['Venta', Validators.required],
    motivoOtro: [''],
    observaciones: [''],
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.productoService.listar({ includeInactivos: false }).subscribe((prods) => {
      this.productos.set(prods);

      this.inventarioService.obtenerStock().subscribe((inv) => {
        this.inventarios.set(inv);

        const paramId = this.route.snapshot.queryParams['productoId'];
        if (paramId && prods.some((p) => p.id === paramId)) {
          this.salidaForm.patchValue({ productoId: paramId });
          this.onProductoSeleccionado();
        }
      });
    });
  }

  onProductoSeleccionado(): void {
    const prodId = this.salidaForm.get('productoId')?.value;
    const p = this.productos().find((item) => item.id === prodId) || null;
    this.productoSeleccionado = p;

    if (p) {
      const inv = this.inventarios().find((i) => i.productoId === p.id);
      this.stockDisponible = inv ? inv.stockActual : 0;
    } else {
      this.stockDisponible = 0;
    }
  }

  get esExcesoDeStock(): boolean {
    if (!this.productoSeleccionado) return false;
    const cant = Number(this.salidaForm.get('cantidad')?.value) || 0;
    return cant > this.stockDisponible;
  }

  get remanenteProyectado(): number {
    const cant = Number(this.salidaForm.get('cantidad')?.value) || 0;
    return this.stockDisponible - cant;
  }

  esInvalido(campo: string): boolean {
    const c = this.salidaForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onSubmit(): void {
    if (this.salidaForm.invalid || this.esExcesoDeStock || this.stockDisponible <= 0) {
      this.salidaForm.markAllAsTouched();
      return;
    }

    const val = this.salidaForm.value;

    let motivoFinal = val.motivo;
    if (motivoFinal === 'Otro') {
      if (!val.motivoOtro?.trim()) {
        this.errorMensaje = 'Especifique el motivo de la salida.';
        return;
      }
      motivoFinal = `Otro: ${val.motivoOtro.trim()}`;
    }

    this.guardando = true;
    this.errorMensaje = '';
    this.exitoMensaje = '';

    const payload = {
      productoId: val.productoId,
      cantidad: Number(val.cantidad),
      motivo: motivoFinal,
      observaciones: val.observaciones?.trim() || null,
    };

    this.inventarioService.registrarSalida(payload).subscribe({
      next: (res) => {
        this.guardando = false;
        this.exitoMensaje = `Salida de ${payload.cantidad} unidades completada. Stock remanente: ${res.inventario.stockActual}.`;
        setTimeout(() => {
          this.router.navigate(['/inventario']);
        }, 1200);
      },
      error: (err) => {
        this.guardando = false;
        this.errorMensaje = err?.error?.mensaje || 'Error al registrar la salida de inventario.';
      },
    });
  }
}
