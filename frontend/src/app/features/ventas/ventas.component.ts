import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto } from '../../core/models/producto.model';
import { Venta } from '../../core/models/venta.model';
import { InventarioService } from '../../core/services/inventario.service';
import { ProductoService } from '../../core/services/producto.service';
import { VentasService } from '../../core/services/ventas.service';
import { BoletaPrintService } from '../../core/services/boleta-print.service';
import { documentoPeruanoValidator, soloDigitos, telefonoPeruanoValidator } from '../../core/validators/datos-contacto.validators';
import { CurrencyPenPipe } from '../../shared/pipes/currency-pen.pipe';

interface LineaVentaDraft {
  productoId: string;
  cantidad: number;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPenPipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Ventas</h1>
          <p class="page-subtitle">Registra ventas y descuenta los productos del inventario.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="mostrarFormulario = !mostrarFormulario">
          {{ mostrarFormulario ? 'Cerrar venta' : 'Registrar venta' }}
        </button>
      </div>
      @if (error) { <div class="alert-box alert-error" role="alert">{{ error }}</div> }
      @if (exito) { <div class="alert-box alert-success" role="status">{{ exito }}</div> }

      @if (mostrarFormulario) {
        <section class="panel">
          <h2 class="section-title">Nueva venta</h2>
          <form [formGroup]="form" (ngSubmit)="registrarVenta()">
            <div class="form-grid">
              <div class="form-group">
                <label for="cliente">Cliente <span class="required-mark">*</span></label>
                <input id="cliente" class="form-control" formControlName="cliente" maxlength="160" />
              </div>
              <div class="form-group">
                <label for="telefono">Teléfono</label>
                <input id="telefono" type="tel" inputmode="numeric" class="form-control" formControlName="telefono" maxlength="15" placeholder="7 a 15 dígitos" (input)="normalizarDigitos($event, 'telefono', 15)" />
                @if (form.controls.telefono.invalid && form.controls.telefono.touched) {
                  <span class="form-error">Ingresa entre 7 y 15 dígitos.</span>
                }
              </div>
              <div class="form-group">
                <label for="documentoCliente">DNI / RUC del cliente</label>
                <input id="documentoCliente" type="text" inputmode="numeric" class="form-control" formControlName="documentoCliente" maxlength="11" placeholder="DNI (8) o RUC (11)" (input)="normalizarDigitos($event, 'documentoCliente', 11)" />
                @if (form.controls.documentoCliente.invalid && form.controls.documentoCliente.touched) {
                  <span class="form-error">Ingresa 8 dígitos para DNI o 11 para RUC.</span>
                }
              </div>
              <div class="form-group">
                <label for="medioPago">Medio de pago <span class="required-mark">*</span></label>
                <select id="medioPago" class="form-control" formControlName="medioPago">
                  <option value="">Selecciona el medio de pago</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="yape_plin">Yape / Plin</option>
                </select>
              </div>
              <div class="form-group notes">
                <label for="observaciones">Observaciones</label>
                <input id="observaciones" class="form-control" formControlName="observaciones" maxlength="300" />
              </div>
            </div>
            <div class="line-header">
              <h3 class="section-title">Productos</h3>
              <button type="button" class="btn btn-secondary btn-sm" (click)="agregarLinea()">+ Agregar producto</button>
            </div>
            @for (linea of lineas; track $index; let i = $index) {
              <div class="line-row">
                <div class="form-group">
                  <label [for]="'producto-' + i">Producto</label>
                  <select class="form-control" [id]="'producto-' + i" [value]="linea.productoId" (change)="seleccionarProducto(i, $event)">
                    <option value="">Selecciona producto</option>
                    @for (producto of productosActivos; track producto.id) {
                      <option [value]="producto.id">{{ producto.codigo }} · {{ producto.nombre }} (stock {{ stockDisponible(producto.id) }})</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label [for]="'cantidad-' + i">Cantidad</label>
                  <input class="form-control" [id]="'cantidad-' + i" type="number" min="1" max="999999" step="1" [value]="linea.cantidad" (input)="actualizarCantidad(i, $event)" />
                </div>
                <div class="line-price"><span>Precio unitario</span><strong>{{ precio(linea.productoId) | currencyPen }}</strong></div>
                <div class="line-price"><span>Subtotal</span><strong>{{ subtotal(linea) | currencyPen }}</strong></div>
                <button type="button" class="btn btn-ghost" [disabled]="lineas.length < 2" (click)="quitarLinea(i)" [attr.aria-label]="'Quitar producto ' + (i + 1)">Quitar</button>
              </div>
            }
            <div class="total-row"><span>Total a cobrar</span><strong>{{ totalDraft | currencyPen }}</strong></div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="guardando || productosActivos.length === 0">{{ guardando ? 'Registrando...' : 'Confirmar venta' }}</button>
              <button type="button" class="btn btn-secondary" (click)="cancelarFormulario()">Cancelar</button>
            </div>
          </form>
        </section>
      }

      <section class="panel">
        <div class="list-heading">
          <h2 class="section-title">Historial de ventas</h2>
          <input class="form-control search" type="search" placeholder="Buscar por código o cliente..." [value]="busqueda" (input)="actualizarBusqueda($event)" />
        </div>
        @if (cargando) {
          <div class="loading-state"><span class="spinner spinner-dark"></span><span>Cargando ventas...</span></div>
        } @else if (ventasFiltradas.length === 0) {
          <div class="empty-state"><strong>Aún no hay ventas</strong><p>Las ventas registradas aparecerán aquí.</p></div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead><tr><th>VENTA</th><th>FECHA</th><th>CLIENTE</th><th>MEDIO DE PAGO</th><th>PRODUCTOS</th><th class="text-right">TOTAL</th><th></th></tr></thead>
              <tbody>
                @for (venta of ventasFiltradas; track venta.id) {
                  <tr>
                    <td class="font-mono text-strong">{{ venta.codigo }}</td>
                    <td>{{ venta.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ venta.cliente }}<div class="text-muted">{{ venta.telefono || 'Sin teléfono' }}</div></td>
                    <td>{{ etiquetaPago(venta.medioPago) }}</td>
                    <td>{{ venta.detalles.length }} ítem(s)</td>
                    <td class="text-right">{{ venta.total | currencyPen }}</td>
                    <td>
                      <div class="actions-cell">
                        <button type="button" class="btn btn-secondary btn-sm" (click)="imprimirBoleta(venta)">Boleta PDF</button>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="ventaExpandidaId = ventaExpandidaId === venta.id ? '' : venta.id">{{ ventaExpandidaId === venta.id ? 'Ocultar' : 'Detalle' }}</button>
                      </div>
                    </td>
                  </tr>
                  @if (ventaExpandidaId === venta.id) {
                    <tr class="detail-row"><td colspan="7">
                      <div class="detail-box">
                        <table class="detail-table">
                          <thead><tr><th>PRODUCTO</th><th class="text-right">CANTIDAD</th><th class="text-right">PRECIO</th><th class="text-right">SUBTOTAL</th></tr></thead>
                          <tbody>@for (detalle of venta.detalles; track detalle.productoId) {
                            <tr><td>{{ nombreProducto(detalle.productoId) }}</td><td class="text-right">{{ detalle.cantidad }}</td><td class="text-right">{{ detalle.precioUnitario | currencyPen }}</td><td class="text-right">{{ detalle.subtotal | currencyPen }}</td></tr>
                          }</tbody>
                        </table>
                        @if (venta.observaciones) { <p class="text-secondary">{{ venta.observaciones }}</p> }
                      </div>
                    </td></tr>
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
    .line-header, .list-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .line-row { display: grid; grid-template-columns: minmax(220px, 2fr) minmax(110px, .7fr) minmax(110px, .8fr) minmax(110px, .8fr) auto; gap: 12px; align-items: end; border-top: 1px solid var(--border-color); padding-top: 12px; }
    .line-price { display: flex; flex-direction: column; padding-bottom: 18px; color: var(--text-secondary); font-size: 12px; }
    .line-price strong { color: var(--text-primary); font-size: 14px; }
    .total-row { display: flex; justify-content: flex-end; gap: 18px; padding: 16px 0; font-size: 16px; }
    .form-actions, .header-actions { display: flex; gap: 8px; }
    .search { width: 320px; }
    .empty-state { text-align: center; padding: 32px; color: var(--text-secondary); }
    .empty-state strong { color: var(--text-primary); }
    .detail-row td { padding: 0; background: var(--surface-hover); }
    .detail-box { padding: 14px 20px; }
    .detail-table { width: 100%; border-collapse: collapse; }
    .detail-table th, .detail-table td { text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color); }
    .detail-table .text-right { text-align: right; }
    .alert-box { padding: 10px 14px; margin-bottom: 14px; border-radius: var(--radius-md); }
    .alert-error { color: var(--state-danger); background: var(--state-danger-bg); }
    .alert-success { color: var(--state-success); background: var(--state-success-bg); }
    @media (max-width: 760px) { .form-grid { grid-template-columns: 1fr 1fr; } .line-row { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } .notes { grid-column: auto; } .list-heading { align-items: stretch; flex-direction: column; } .search { width: 100%; } .line-row { grid-template-columns: 1fr 1fr; } .line-row .form-group:first-child { grid-column: 1 / -1; } }
  `],
})
export class VentasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ventasService = inject(VentasService);
  private readonly boletaPrint = inject(BoletaPrintService);
  private readonly productosService = inject(ProductoService);
  private readonly inventarioService = inject(InventarioService);
  readonly form = this.fb.nonNullable.group({
    cliente: ['', [Validators.required, Validators.maxLength(160)]],
    telefono: ['', telefonoPeruanoValidator()],
    documentoCliente: ['', documentoPeruanoValidator()],
    medioPago: ['', Validators.required],
    observaciones: [''],
  });
  ventas: Venta[] = [];
  productos: Producto[] = [];
  stock: Record<string, number> = {};
  lineas: LineaVentaDraft[] = [this.nuevaLinea()];
  busqueda = '';
  cargando = true;
  guardando = false;
  mostrarFormulario = false;
  error = '';
  exito = '';
  ventaExpandidaId = '';

  get productosActivos(): Producto[] { return this.productos.filter((producto) => producto.activo); }
  get ventasFiltradas(): Venta[] {
    const texto = this.busqueda.trim().toLocaleLowerCase();
    return this.ventas.filter((venta) => `${venta.codigo} ${venta.cliente}`.toLocaleLowerCase().includes(texto));
  }
  get totalDraft(): number { return this.lineas.reduce((sum, linea) => sum + this.subtotal(linea), 0); }

  ngOnInit(): void {
    let remaining = 3;
    const done = (): void => { remaining -= 1; if (remaining === 0) this.cargando = false; };
    this.ventasService.listar().subscribe({
      next: (items) => { this.ventas = items; done(); },
      error: (err: { error?: { mensaje?: string; message?: string } }) => { this.error = err.error?.mensaje || err.error?.message || 'No se pudieron cargar las ventas.'; done(); },
    });
    this.productosService.listar().subscribe({
      next: (items) => { this.productos = items; done(); },
      error: (err: { error?: { mensaje?: string; message?: string } }) => { this.error = err.error?.mensaje || err.error?.message || 'No se pudieron cargar los productos.'; done(); },
    });
    this.inventarioService.obtenerStock().subscribe({
      next: (items) => { this.stock = Object.fromEntries(items.map((item) => [item.productoId, item.stockActual])); done(); },
      error: (err: { error?: { mensaje?: string; message?: string } }) => { this.error = err.error?.mensaje || err.error?.message || 'No se pudo consultar el inventario.'; done(); },
    });
  }

  stockDisponible(id: string): number { return this.stock[id] ?? 0; }
  precio(id: string): number { return this.productos.find((producto) => producto.id === id)?.precioVenta ?? 0; }
  nombreProducto(id: string): string { return this.productos.find((producto) => producto.id === id)?.nombre ?? 'Producto no encontrado'; }
  subtotal(linea: LineaVentaDraft): number { return this.precio(linea.productoId) * (Number.isFinite(linea.cantidad) ? linea.cantidad : 0); }
  etiquetaPago(value: string): string {
    return ({ efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', yape_plin: 'Yape / Plin' } as Record<string, string>)[value] ?? value;
  }
  agregarLinea(): void { this.lineas = [...this.lineas, this.nuevaLinea()]; }
  quitarLinea(index: number): void { if (this.lineas.length > 1) this.lineas = this.lineas.filter((_, i) => i !== index); }
  seleccionarProducto(index: number, event: Event): void { this.lineas[index].productoId = (event.target as HTMLSelectElement).value; }
  actualizarCantidad(index: number, event: Event): void { this.lineas[index].cantidad = (event.target as HTMLInputElement).valueAsNumber; }
  actualizarBusqueda(event: Event): void { this.busqueda = (event.target as HTMLInputElement).value; }
  normalizarDigitos(event: Event, control: 'telefono' | 'documentoCliente', maxLength: number): void {
    const input = event.target as HTMLInputElement;
    const value = soloDigitos(input.value, maxLength);
    input.value = value;
    this.form.controls[control].setValue(value);
  }

  registrarVenta(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error = 'Completa el cliente y el medio de pago.'; return; }
    if (this.lineas.some((linea) => !linea.productoId || !Number.isInteger(linea.cantidad) || linea.cantidad < 1 || linea.cantidad > 999999)) {
      this.error = 'Selecciona productos y cantidades enteras mayores a cero.'; return;
    }
    if (new Set(this.lineas.map((linea) => linea.productoId)).size !== this.lineas.length) {
      this.error = 'Cada producto debe aparecer una sola vez en la venta.'; return;
    }
    const sinStock = this.lineas.find((linea) => linea.cantidad > this.stockDisponible(linea.productoId));
    if (sinStock) { this.error = `Stock insuficiente para ${this.nombreProducto(sinStock.productoId)}.`; return; }
    this.error = ''; this.exito = ''; this.guardando = true;
    this.ventasService.registrar({
      ...this.form.getRawValue(),
      detalles: this.lineas.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
    }).subscribe({
      next: (venta) => {
        this.ventas = [venta, ...this.ventas];
        for (const linea of venta.detalles) this.stock[linea.productoId] -= linea.cantidad;
        this.guardando = false;
        this.exito = `Venta ${venta.codigo} registrada por ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(venta.total)}.`;
        this.cancelarFormulario();
      },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.guardando = false;
        this.error = err.error?.mensaje || err.error?.message || 'No se pudo registrar la venta.';
      },
    });
  }

  imprimirBoleta(venta: Venta): void {
    try {
      this.boletaPrint.imprimir({
        codigo: venta.codigo,
        fecha: venta.fecha,
        cliente: venta.cliente,
        documentoCliente: venta.documentoCliente,
        telefono: venta.telefono,
        formaPago: this.etiquetaPago(venta.medioPago),
        observaciones: venta.observaciones,
        lineas: venta.detalles.map((detalle) => ({
          codigo: this.productos.find((producto) => producto.id === detalle.productoId)?.codigo ?? detalle.productoId,
          descripcion: this.nombreProducto(detalle.productoId),
          unidad: 'UND',
          cantidad: detalle.cantidad,
          precio: detalle.precioUnitario,
        })),
        total: venta.total,
      });
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo abrir la boleta.';
    }
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.form.reset({ cliente: '', telefono: '', documentoCliente: '', medioPago: '', observaciones: '' });
    this.lineas = [this.nuevaLinea()];
  }

  private nuevaLinea(): LineaVentaDraft { return { productoId: '', cantidad: 1 }; }
}
