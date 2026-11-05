import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Compra, EstadoCompra } from '../../../core/models/compra.model';
import { Producto } from '../../../core/models/producto.model';
import { Proveedor } from '../../../core/models/proveedor.model';
import { ComprasService, CrearCompra } from '../../../core/services/compras.service';
import { ProductoService } from '../../../core/services/producto.service';
import { CurrencyPenPipe } from '../../../shared/pipes/currency-pen.pipe';

interface LineaCompraDraft {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
}

@Component({
  selector: 'app-compras-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPenPipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Compras y proveedores</h1>
          <p class="page-subtitle">Registra órdenes de compra y recibe productos en el inventario.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/compras/proveedores" class="btn btn-secondary">Administrar proveedores</a>
          <button type="button" class="btn btn-primary" (click)="alternarFormulario()">
            {{ mostrarFormulario ? 'Cerrar formulario' : 'Nueva compra' }}
          </button>
        </div>
      </div>

      @if (error) {
        <div class="alert-box alert-error" role="alert">{{ error }}</div>
      }
      @if (exito) {
        <div class="alert-box alert-success" role="status">{{ exito }}</div>
      }

      @if (mostrarFormulario) {
        <section class="panel">
          <h2 class="section-title">Registrar orden de compra</h2>
          @if (proveedoresActivos.length === 0) {
            <p class="hint">Primero registra o activa un proveedor para crear una compra.</p>
          }
          <form [formGroup]="form" (ngSubmit)="guardarCompra()">
            <div class="form-grid">
              <div class="form-group">
                <label for="proveedor">Proveedor <span class="required-mark">*</span></label>
                <select id="proveedor" class="form-control" formControlName="proveedorId">
                  <option value="">Selecciona un proveedor</option>
                  @for (proveedor of proveedoresActivos; track proveedor.id) {
                    <option [value]="proveedor.id">{{ proveedor.razonSocial }} · {{ proveedor.ruc }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="fecha">Fecha <span class="required-mark">*</span></label>
                <input id="fecha" class="form-control" type="date" formControlName="fecha" />
              </div>
              <div class="form-group notes">
                <label for="observaciones">Observaciones</label>
                <input id="observaciones" class="form-control" formControlName="observaciones" maxlength="500" />
              </div>
            </div>

            <div class="line-header">
              <h3 class="section-title">Productos de la orden</h3>
              <button type="button" class="btn btn-secondary btn-sm" (click)="agregarLinea()">+ Agregar producto</button>
            </div>
            @if (productosActivos.length === 0) {
              <p class="hint">No hay productos activos disponibles. Registra productos antes de crear compras.</p>
            }
            <div class="line-list">
              @for (linea of lineas; track $index; let i = $index) {
                <div class="line-row">
                  <div class="form-group product-field">
                    <label [for]="'producto-' + i">Producto</label>
                    <select class="form-control" [id]="'producto-' + i" [value]="linea.productoId" (change)="seleccionarProducto(i, $event)">
                      <option value="">Selecciona producto</option>
                      @for (producto of productosActivos; track producto.id) {
                        <option [value]="producto.id">{{ producto.codigo }} · {{ producto.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group quantity-field">
                    <label [for]="'cantidad-' + i">Cantidad</label>
                    <input class="form-control" [id]="'cantidad-' + i" type="number" min="1" max="999999" step="1" [value]="linea.cantidad" (input)="actualizarCantidad(i, $event)" />
                  </div>
                  <div class="form-group cost-field">
                    <label [for]="'costo-' + i">Costo unitario (S/)</label>
                    <input class="form-control" [id]="'costo-' + i" type="number" min="0" max="10000000" step="0.01" [value]="linea.costoUnitario" (input)="actualizarCosto(i, $event)" />
                  </div>
                  <div class="line-subtotal">
                    <span>Subtotal</span>
                    <strong>{{ subtotal(linea) | currencyPen }}</strong>
                  </div>
                  <button type="button" class="btn btn-ghost remove-line" [disabled]="lineas.length < 2" (click)="quitarLinea(i)" [attr.aria-label]="'Quitar producto ' + (i + 1)">Quitar</button>
                </div>
              }
            </div>
            <div class="total-row"><span>Total estimado</span><strong>{{ totalDraft | currencyPen }}</strong></div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="guardando || proveedoresActivos.length === 0 || productosActivos.length === 0">
                {{ guardando ? 'Guardando...' : 'Crear orden pendiente' }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="cerrarFormulario()">Cancelar</button>
            </div>
          </form>
        </section>
      }

      <section class="panel">
        <div class="list-heading">
          <h2 class="section-title">Órdenes de compra</h2>
          <div class="filters">
            <input class="form-control search" type="search" placeholder="Buscar por código o proveedor..." [value]="busqueda" (input)="actualizarBusqueda($event)" />
            <select class="form-control status-filter" [value]="filtroEstado" (change)="actualizarEstado($event)" aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="recibida">Recibidas</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>
        </div>
        @if (cargando) {
          <div class="loading-state"><span class="spinner spinner-dark"></span><span>Cargando órdenes de compra...</span></div>
        } @else if (comprasFiltradas.length === 0) {
          <div class="empty-state">
            <strong>No hay órdenes de compra</strong>
            <p>Crea una orden y aparecerá aquí para darle seguimiento.</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr><th>ORDEN</th><th>PROVEEDOR</th><th>FECHA</th><th>PRODUCTOS</th><th class="text-right">TOTAL</th><th>ESTADO</th><th class="text-right">ACCIONES</th></tr>
              </thead>
              <tbody>
                @for (compra of comprasFiltradas; track compra.id) {
                  <tr>
                    <td class="font-mono text-strong">{{ compra.codigo }}</td>
                    <td>{{ nombreProveedor(compra.proveedorId) }}</td>
                    <td>{{ compra.fecha | date:'dd/MM/yyyy' }}</td>
                    <td>{{ compra.detalles.length }} ítem(s)</td>
                    <td class="text-right">{{ compra.total | currencyPen }}</td>
                    <td><span class="badge" [class.badge-warning]="compra.estado === 'pendiente'" [class.badge-success]="compra.estado === 'recibida'" [class.badge-danger]="compra.estado === 'anulada'">{{ etiquetaEstado(compra.estado) }}</span></td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button type="button" class="btn btn-secondary btn-sm" (click)="alternarDetalle(compra)">{{ compraExpandidaId === compra.id ? 'Ocultar' : 'Detalle' }}</button>
                        @if (compra.estado === 'pendiente') {
                          <button type="button" class="btn btn-primary btn-sm" [disabled]="accionandoId === compra.id" (click)="recibir(compra)">Recibir</button>
                          <button type="button" class="btn btn-danger btn-sm" (click)="prepararAnulacion(compra)">Anular</button>
                        }
                      </div>
                    </td>
                  </tr>
                  @if (compraExpandidaId === compra.id) {
                    <tr class="detail-row">
                      <td colspan="7">
                        <div class="detail-box">
                          <div class="detail-title">
                            <strong>Detalle de {{ compra.codigo }}</strong>
                            @if (compra.fechaRecepcion) { <span>Recibida el {{ compra.fechaRecepcion | date:'dd/MM/yyyy HH:mm' }}</span> }
                          </div>
                          <table class="detail-table">
                            <thead><tr><th>PRODUCTO</th><th class="text-right">CANTIDAD</th><th class="text-right">COSTO UNITARIO</th><th class="text-right">SUBTOTAL</th></tr></thead>
                            <tbody>
                              @for (detalle of compra.detalles; track detalle.productoId) {
                                <tr><td>{{ nombreProducto(detalle.productoId) }}</td><td class="text-right">{{ detalle.cantidad }}</td><td class="text-right">{{ detalle.costoUnitario | currencyPen }}</td><td class="text-right">{{ detalle.subtotal | currencyPen }}</td></tr>
                              }
                            </tbody>
                          </table>
                          @if (compra.observaciones) { <p class="detail-note"><strong>Observaciones:</strong> {{ compra.observaciones }}</p> }
                          @if (compra.estado === 'anulada' && compra.motivoAnulacion) { <p class="detail-note"><strong>Motivo de anulación:</strong> {{ compra.motivoAnulacion }}</p> }
                          @if (anulacionId === compra.id) {
                            <div class="cancel-form">
                              <label [for]="'motivo-' + compra.id">Motivo de anulación</label>
                              <input class="form-control" [id]="'motivo-' + compra.id" maxlength="250" [value]="motivoAnulacion" (input)="actualizarMotivo($event)" />
                              <button type="button" class="btn btn-danger btn-sm" [disabled]="!motivoAnulacion.trim() || accionandoId === compra.id" (click)="anular(compra)">Confirmar anulación</button>
                              <button type="button" class="btn btn-secondary btn-sm" (click)="anulacionId = ''; motivoAnulacion = ''">Cancelar</button>
                            </div>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .panel { background: var(--surface-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 20px; }
    .section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 16px; }
    .notes { grid-column: span 1; }
    .line-header, .list-heading, .detail-title { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .line-header { margin-top: 8px; }
    .line-header .section-title { margin-bottom: 10px; }
    .line-list { border-top: 1px solid var(--border-color); }
    .line-row { display: grid; grid-template-columns: minmax(220px, 2fr) minmax(100px, .7fr) minmax(145px, 1fr) minmax(100px, .8fr) auto; align-items: end; gap: 12px; padding: 12px 0 0; border-bottom: 1px solid var(--border-color); }
    .line-row .form-group { margin-bottom: 12px; }
    .line-subtotal { display: flex; flex-direction: column; padding-bottom: 18px; font-size: 12px; color: var(--text-secondary); }
    .line-subtotal strong { color: var(--text-primary); font-size: 14px; }
    .remove-line { margin-bottom: 13px; }
    .total-row { display: flex; justify-content: flex-end; gap: 18px; padding: 16px 0; font-size: 15px; }
    .form-actions, .header-actions { display: flex; gap: 16px; }
    .list-heading { align-items: flex-start; }
    .filters { display: flex; gap: 8px; }
    .search { width: 300px; }
    .status-filter { width: 165px; }
    .empty-state { text-align: center; padding: 36px 12px; color: var(--text-secondary); }
    .empty-state strong { color: var(--text-primary); }
    .empty-state p { margin-top: 5px; }
    .detail-row td { padding: 0; background: var(--surface-hover); }
    .detail-box { padding: 16px 20px; }
    .detail-title { justify-content: flex-start; margin-bottom: 12px; }
    .detail-title span, .detail-note { color: var(--text-secondary); font-size: 13px; }
    .detail-table { width: 100%; border-collapse: collapse; }
    .detail-table th, .detail-table td { text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color); }
    .detail-table th { font-size: 11px; color: var(--text-secondary); }
    .detail-table .text-right { text-align: right; }
    .detail-note { margin-top: 10px; }
    .cancel-form { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .cancel-form label { font-weight: 500; }
    .cancel-form .form-control { flex: 1; min-width: 180px; }
    .hint { margin: 0 0 14px; color: var(--text-secondary); }
    .alert-box { padding: 10px 14px; margin-bottom: 14px; border-radius: var(--radius-md); }
    .alert-error { color: var(--state-danger); background: var(--state-danger-bg); }
    .alert-success { color: var(--state-success); background: var(--state-success-bg); }
    @media (max-width: 900px) { .line-row { grid-template-columns: 2fr 1fr 1fr; } .line-subtotal { padding-bottom: 12px; } .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 650px) { .form-grid { grid-template-columns: 1fr; } .notes { grid-column: auto; } .list-heading, .filters { flex-direction: column; width: 100%; } .search, .status-filter { width: 100%; } .line-row { grid-template-columns: 1fr 1fr; } .product-field { grid-column: 1 / -1; } .header-actions { flex-wrap: wrap; } }
  `],
})
export class ComprasListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly comprasService = inject(ComprasService);
  private readonly productoService = inject(ProductoService);
  readonly form = this.fb.nonNullable.group({
    proveedorId: ['', Validators.required],
    fecha: [new Date().toISOString().slice(0, 10), Validators.required],
    observaciones: [''],
  });
  proveedores: Proveedor[] = [];
  productos: Producto[] = [];
  compras: Compra[] = [];
  lineas: LineaCompraDraft[] = [this.nuevaLinea()];
  busqueda = '';
  filtroEstado = '';
  cargando = true;
  guardando = false;
  mostrarFormulario = false;
  error = '';
  exito = '';
  compraExpandidaId = '';
  anulacionId = '';
  motivoAnulacion = '';
  accionandoId = '';

  get proveedoresActivos(): Proveedor[] {
    return this.proveedores.filter((proveedor) => proveedor.activo);
  }

  get productosActivos(): Producto[] {
    return this.productos.filter((producto) => producto.activo);
  }

  get comprasFiltradas(): Compra[] {
    const term = this.busqueda.trim().toLocaleLowerCase();
    return this.compras.filter((compra) => {
      const coincideTexto = `${compra.codigo} ${this.nombreProveedor(compra.proveedorId)}`
        .toLocaleLowerCase().includes(term);
      return coincideTexto && (!this.filtroEstado || compra.estado === this.filtroEstado);
    });
  }

  get totalDraft(): number {
    return this.lineas.reduce((total, linea) => total + this.subtotal(linea), 0);
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  alternarFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.error = '';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.form.reset({ proveedorId: '', fecha: new Date().toISOString().slice(0, 10), observaciones: '' });
    this.lineas = [this.nuevaLinea()];
  }

  agregarLinea(): void {
    this.lineas = [...this.lineas, this.nuevaLinea()];
  }

  quitarLinea(index: number): void {
    if (this.lineas.length > 1) this.lineas = this.lineas.filter((_, i) => i !== index);
  }

  seleccionarProducto(index: number, event: Event): void {
    this.lineas[index].productoId = (event.target as HTMLSelectElement).value;
  }

  actualizarCantidad(index: number, event: Event): void {
    this.lineas[index].cantidad = (event.target as HTMLInputElement).valueAsNumber;
  }

  actualizarCosto(index: number, event: Event): void {
    this.lineas[index].costoUnitario = (event.target as HTMLInputElement).valueAsNumber;
  }

  subtotal(linea: LineaCompraDraft): number {
    return Number.isFinite(linea.cantidad) && Number.isFinite(linea.costoUnitario)
      ? linea.cantidad * linea.costoUnitario
      : 0;
  }

  actualizarBusqueda(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
  }

  actualizarEstado(event: Event): void {
    this.filtroEstado = (event.target as HTMLSelectElement).value;
  }

  guardarCompra(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Selecciona un proveedor y una fecha para la compra.';
      return;
    }
    if (this.lineas.some((linea) => !linea.productoId || !Number.isInteger(linea.cantidad) ||
      linea.cantidad < 1 || linea.cantidad > 999999 || !Number.isFinite(linea.costoUnitario) ||
      linea.costoUnitario < 0 || linea.costoUnitario > 10000000 || Math.round(linea.costoUnitario * 100) !== linea.costoUnitario * 100)) {
      this.error = 'Completa cada producto con cantidad válida y costo unitario igual o mayor a cero.';
      return;
    }
    if (new Set(this.lineas.map((linea) => linea.productoId)).size !== this.lineas.length) {
      this.error = 'Cada producto debe aparecer una sola vez en la orden.';
      return;
    }
    const dto: CrearCompra = {
      ...this.form.getRawValue(),
      detalles: this.lineas.map(({ productoId, cantidad, costoUnitario }) => ({ productoId, cantidad, costoUnitario })),
    };
    this.guardando = true;
    this.error = '';
    this.exito = '';
    this.comprasService.crearCompra(dto).subscribe({
      next: (compra) => {
        this.compras = [compra, ...this.compras];
        this.guardando = false;
        this.exito = `Se creó la orden ${compra.codigo}.`;
        this.cerrarFormulario();
      },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.guardando = false;
        this.error = err.error?.mensaje || err.error?.message || 'No se pudo crear la orden de compra.';
      },
    });
  }

  nombreProveedor(id: string): string {
    return this.proveedores.find((proveedor) => proveedor.id === id)?.razonSocial ?? 'Proveedor no encontrado';
  }

  nombreProducto(id: string): string {
    return this.productos.find((producto) => producto.id === id)?.nombre ?? 'Producto no encontrado';
  }

  etiquetaEstado(estado: EstadoCompra): string {
    return estado === 'pendiente' ? 'Pendiente' : estado === 'recibida' ? 'Recibida' : 'Anulada';
  }

  alternarDetalle(compra: Compra): void {
    this.compraExpandidaId = this.compraExpandidaId === compra.id ? '' : compra.id;
    this.anulacionId = '';
    this.motivoAnulacion = '';
  }

  recibir(compra: Compra): void {
    this.error = '';
    this.exito = '';
    this.accionandoId = compra.id;
    this.comprasService.recibirCompra(compra.id).subscribe({
      next: (actualizada) => {
        this.actualizarCompra(actualizada);
        this.accionandoId = '';
        this.exito = `La orden ${actualizada.codigo} fue recibida y el inventario fue actualizado.`;
      },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.accionandoId = '';
        this.error = err.error?.mensaje || err.error?.message || 'No se pudo recibir la compra.';
      },
    });
  }

  prepararAnulacion(compra: Compra): void {
    this.compraExpandidaId = compra.id;
    this.anulacionId = compra.id;
    this.motivoAnulacion = '';
    this.error = '';
  }

  actualizarMotivo(event: Event): void {
    this.motivoAnulacion = (event.target as HTMLInputElement).value;
  }

  anular(compra: Compra): void {
    this.accionandoId = compra.id;
    this.error = '';
    this.exito = '';
    this.comprasService.anularCompra(compra.id, this.motivoAnulacion).subscribe({
      next: (actualizada) => {
        this.actualizarCompra(actualizada);
        this.accionandoId = '';
        this.anulacionId = '';
        this.motivoAnulacion = '';
        this.exito = `La orden ${actualizada.codigo} fue anulada.`;
      },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.accionandoId = '';
        this.error = err.error?.mensaje || err.error?.message || 'No se pudo anular la compra.';
      },
    });
  }

  private nuevaLinea(): LineaCompraDraft {
    return { productoId: '', cantidad: 1, costoUnitario: 0 };
  }

  private actualizarCompra(compra: Compra): void {
    this.compras = this.compras.map((item) => item.id === compra.id ? compra : item);
  }

  private cargarDatos(): void {
    this.cargando = true;
    let pendientes = 3;
    const finalizarCarga = (): void => {
      pendientes -= 1;
      if (pendientes === 0) this.cargando = false;
    };
    this.comprasService.listarProveedores().subscribe({
      next: (items) => { this.proveedores = items; finalizarCarga(); },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.error = err.error?.mensaje || err.error?.message || 'No se pudieron cargar los proveedores.';
        finalizarCarga();
      },
    });
    this.productoService.listar().subscribe({
      next: (items) => { this.productos = items; finalizarCarga(); },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.error = err.error?.mensaje || err.error?.message || 'No se pudieron cargar los productos.';
        finalizarCarga();
      },
    });
    this.comprasService.listarCompras().subscribe({
      next: (items) => { this.compras = items; finalizarCarga(); },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.error = err.error?.mensaje || err.error?.message || 'No se pudieron cargar las compras.';
        finalizarCarga();
      },
    });
  }
}
