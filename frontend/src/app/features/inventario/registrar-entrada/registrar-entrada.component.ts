import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { Producto } from '../../../core/models/producto.model';
import { Inventario } from '../../../core/models/inventario.model';
import { CurrencyPenPipe } from '../../../shared/pipes/currency-pen.pipe';

// Lista de referencia para proveedores (sin CRUD, tal como se solicitó)
const PROVEEDORES_REFERENCIALES = [
  'Distribuidora Michelin del Perú S.A.',
  'Goodyear del Perú S.A.',
  'Bridgestone Tire Latin America',
  'Castrol Lubricantes - Distribuidor Central',
  'Robert Bosch del Perú S.A.',
  'Baterías Etna Fábrica Nacional',
  'Importaciones Vulcanizadoras Lima E.I.R.L.',
];

@Component({
  selector: 'app-registrar-entrada',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPenPipe],
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
        <h1 class="form-title">Registrar Entrada de Inventario (HU-07)</h1>
        <p class="form-subtitle">
          Recepción de mercadería por compras, devoluciones o ajustes que incrementan el stock físico.
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

        <form [formGroup]="entradaForm" (ngSubmit)="onSubmit()" novalidate>
          <!-- Selección de Producto -->
          <div class="form-group">
            <label for="productoId">
              Producto a Ingresar
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

          <!-- Indicador de Stock Previo -->
          @if (productoSeleccionado) {
            <div class="stock-preview-box">
              <div class="preview-item">
                <span class="preview-label">Stock Físico Actual:</span>
                <span class="preview-value font-mono highlight">{{ stockActualProducto }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Nuevo Stock Proyectado:</span>
                <span class="preview-value font-mono text-success">
                  {{ stockActualProducto + (entradaForm.get('cantidad')?.value || 0) }}
                </span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Precio de Venta Base:</span>
                <span class="preview-value font-mono">
                  {{ productoSeleccionado.precioVenta | currencyPen }}
                </span>
              </div>
            </div>
          }

          <!-- Cantidad y Costo -->
          <div class="form-grid-2">
            <div class="form-group">
              <label for="cantidad">
                Cantidad a Ingresar
                <span class="required-mark">*</span>
              </label>
              <input
                id="cantidad"
                type="number"
                min="1"
                max="999999"
                step="1"
                class="form-control font-mono"
                [class.has-error]="esInvalido('cantidad')"
                formControlName="cantidad"
                placeholder="1"
              />
              @if (esInvalido('cantidad')) {
                <span class="form-error">La cantidad debe ser mayor a 0.</span>
              }
            </div>

            <div class="form-group">
              <label for="costoUnitario">
                Costo Unitario de Adquisición (S/. opcional)
              </label>
              <input
                id="costoUnitario"
                type="number"
                min="0"
                max="10000000"
                step="0.01"
                class="form-control font-mono"
                [class.has-error]="esInvalido('costoUnitario')"
                formControlName="costoUnitario"
                placeholder="0.00"
              />
              @if (esInvalido('costoUnitario')) {
                <span class="form-error">El costo unitario no puede ser negativo.</span>
              }
            </div>
          </div>

          <!-- Motivo y Proveedor -->
          <div class="form-grid-2">
            <div class="form-group">
              <label for="motivo">
                Motivo de Entrada
                <span class="required-mark">*</span>
              </label>
              <select
                id="motivo"
                class="form-control"
                [class.has-error]="esInvalido('motivo')"
                formControlName="motivo"
              >
                <option value="Compra">Compra a distribuidor / mayorista</option>
                <option value="Devolución de cliente">Devolución de cliente</option>
                <option value="Ajuste de inventario">Ajuste de inventario (conteo físico)</option>
                <option value="Otro">Otro (especificar abajo)</option>
              </select>
              @if (esInvalido('motivo')) {
                <span class="form-error">El motivo es obligatorio.</span>
              }
            </div>

            <div class="form-group">
              <label for="proveedor">Proveedor Referencial (Opcional)</label>
              <select id="proveedor" class="form-control" formControlName="proveedor">
                <option value="">-- Sin proveedor asociado / Ajuste interno --</option>
                @for (prov of proveedores; track prov) {
                  <option [value]="prov">{{ prov }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Si el motivo es Otro, pedir detalle libre -->
          @if (entradaForm.get('motivo')?.value === 'Otro') {
            <div class="form-group">
              <label for="motivoOtro">
                Especifique el motivo de entrada
                <span class="required-mark">*</span>
              </label>
              <input
                id="motivoOtro"
                type="text"
                class="form-control"
                [class.has-error]="esInvalido('motivoOtro')"
                formControlName="motivoOtro"
                placeholder="Describa el origen no contemplado..."
              />
              @if (esInvalido('motivoOtro')) {
                <span class="form-error">Debe especificar el motivo si selecciona 'Otro'.</span>
              }
            </div>
          }

          <!-- Observaciones -->
          <div class="form-group">
            <label for="observaciones">Observaciones o Notas de Recepción (Opcional)</label>
            <textarea
              id="observaciones"
              rows="3"
              class="form-control"
              formControlName="observaciones"
              placeholder="Número de guía de remisión, factura de proveedor, condiciones del lote o paquete..."
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
              [disabled]="guardando || entradaForm.invalid"
            >
              @if (guardando) {
                <span class="spinner"></span>
                <span>Procesando entrada...</span>
              } @else {
                <span>Guardar Entrada de Inventario</span>
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
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
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

      &.highlight {
        color: var(--accent-primary);
      }
    }

    .text-success {
      color: var(--state-success) !important;
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
export class RegistrarEntradaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private inventarioService = inject(InventarioService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  proveedores = PROVEEDORES_REFERENCIALES;
  productos = signal<Producto[]>([]);
  inventarios = signal<Inventario[]>([]);

  productoSeleccionado: Producto | null = null;
  stockActualProducto = 0;

  guardando = false;
  errorMensaje = '';
  exitoMensaje = '';

  entradaForm: FormGroup = this.fb.group({
    productoId: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1), Validators.max(999999), Validators.pattern(/^\d+$/)]],
    costoUnitario: [null, [Validators.min(0), Validators.max(10000000), Validators.pattern(/^\d+(?:\.\d{1,2})?$/)]],
    proveedor: [''],
    motivo: ['Compra', Validators.required],
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

        // Preseleccionar si viene por queryParams ?productoId=...
        const paramId = this.route.snapshot.queryParams['productoId'];
        if (paramId && prods.some((p) => p.id === paramId)) {
          this.entradaForm.patchValue({ productoId: paramId });
          this.onProductoSeleccionado();
        }
      });
    });
  }

  onProductoSeleccionado(): void {
    const prodId = this.entradaForm.get('productoId')?.value;
    const p = this.productos().find((item) => item.id === prodId) || null;
    this.productoSeleccionado = p;

    if (p) {
      const inv = this.inventarios().find((i) => i.productoId === p.id);
      this.stockActualProducto = inv ? inv.stockActual : 0;
    } else {
      this.stockActualProducto = 0;
    }
  }

  esInvalido(campo: string): boolean {
    const c = this.entradaForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onSubmit(): void {
    if (this.entradaForm.invalid) {
      this.entradaForm.markAllAsTouched();
      return;
    }

    const val = this.entradaForm.value;

    let motivoFinal = val.motivo;
    if (motivoFinal === 'Otro') {
      if (!val.motivoOtro?.trim()) {
        this.errorMensaje = 'Especifique el motivo de la entrada.';
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
      costoUnitario: val.costoUnitario !== null && val.costoUnitario !== '' ? Number(val.costoUnitario) : null,
      proveedor: val.proveedor || null,
      motivo: motivoFinal,
      observaciones: val.observaciones?.trim() || null,
    };

    this.inventarioService.registrarEntrada(payload).subscribe({
      next: (res) => {
        this.guardando = false;
        this.exitoMensaje = `Entrada de ${payload.cantidad} unidades registrada con éxito. Nuevo stock: ${res.inventario.stockActual}.`;
        setTimeout(() => {
          this.router.navigate(['/inventario']);
        }, 1200);
      },
      error: (err) => {
        this.guardando = false;
        this.errorMensaje = err?.error?.mensaje || 'Error al procesar la entrada en inventario.';
      },
    });
  }
}
