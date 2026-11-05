import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto } from '../../core/models/producto.model';
import { ServicioTaller, EstadoServicioTaller } from '../../core/models/servicio-taller.model';
import { InventarioService } from '../../core/services/inventario.service';
import { ProductoService } from '../../core/services/producto.service';
import { ServiciosTallerService } from '../../core/services/servicios-taller.service';
import { BoletaPrintService } from '../../core/services/boleta-print.service';
import { documentoPeruanoValidator, soloDigitos, telefonoPeruanoValidator } from '../../core/validators/datos-contacto.validators';
import { CurrencyPenPipe } from '../../shared/pipes/currency-pen.pipe';

interface MaterialDraft { productoId: string; cantidad: number; }

@Component({
  selector: 'app-servicios-taller',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPenPipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Servicios de taller</h1>
          <p class="page-subtitle">Registra trabajos, materiales consumidos y el estado de cada servicio.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="mostrarFormulario = !mostrarFormulario">
          {{ mostrarFormulario ? 'Cerrar formulario' : 'Nuevo servicio' }}
        </button>
      </div>
      @if (error) { <div class="alert-box alert-error" role="alert">{{ error }}</div> }
      @if (exito) { <div class="alert-box alert-success" role="status">{{ exito }}</div> }

      @if (mostrarFormulario) {
        <section class="panel">
          <h2 class="section-title">Registrar servicio</h2>
          <form [formGroup]="form" (ngSubmit)="registrar()">
            <div class="form-grid">
              <div class="form-group">
                <label for="cliente">Cliente *</label>
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
                <label for="placa">Placa *</label>
                <input id="placa" class="form-control" formControlName="placa" maxlength="8" placeholder="Ej. ABC-123" (input)="normalizarPlaca($event)" />
                @if (form.controls.placa.invalid && form.controls.placa.touched) {
                  <span class="form-error">Ingresa una placa de 5 a 8 letras, números o guion.</span>
                }
              </div>
              <div class="form-group">
                <label for="vehiculo">Vehículo *</label>
                <input id="vehiculo" class="form-control" formControlName="vehiculo" placeholder="Marca, modelo y año" />
              </div>
              <div class="form-group">
                <label for="descripcion">Trabajo realizado *</label>
                <input id="descripcion" class="form-control" formControlName="descripcion" maxlength="250" />
              </div>
              <div class="form-group">
                <label for="manoObra">Mano de obra (S/) *</label>
                <input id="manoObra" class="form-control" formControlName="manoObra" type="number" min="0" max="10000000" step="0.01" />
              </div>
              <div class="form-group">
                <label for="medioPago">Medio de pago *</label>
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
              <h3 class="section-title">Materiales utilizados</h3>
              <button type="button" class="btn btn-secondary btn-sm" (click)="agregarMaterial()">+ Agregar material</button>
            </div>
            <p class="hint">Al registrar el servicio, estos materiales se descontarán del inventario.</p>
            @for (material of materiales; track $index; let i = $index) {
              <div class="line-row">
                <div class="form-group product-field">
                  <label [for]="'producto-' + i">Producto</label>
                  <select class="form-control" [id]="'producto-' + i" [value]="material.productoId" (change)="seleccionarProducto(i, $event)">
                    <option value="">Selecciona producto</option>
                    @for (producto of productosActivos; track producto.id) {
                      <option [value]="producto.id">{{ producto.codigo }} · {{ producto.nombre }} (stock {{ stockDisponible(producto.id) }})</option>
                    }
                  </select>
                </div>
                <div class="form-group quantity-field">
                  <label [for]="'cantidad-' + i">Cantidad</label>
                  <input class="form-control" [id]="'cantidad-' + i" type="number" min="1" max="999999" step="1" [value]="material.cantidad" (input)="actualizarCantidad(i, $event)" />
                </div>
                <div class="material-info"><span>Valor estimado</span><strong>{{ subtotalMaterial(material) | currencyPen }}</strong></div>
                <button type="button" class="btn btn-ghost" [disabled]="materiales.length < 2" (click)="quitarMaterial(i)" [attr.aria-label]="'Quitar material ' + (i + 1)">Quitar</button>
              </div>
            }
            <div class="total-row"><span>Total estimado del servicio</span><strong>{{ totalDraft | currencyPen }}</strong></div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="guardando">{{ guardando ? 'Registrando...' : 'Registrar servicio' }}</button>
              <button type="button" class="btn btn-secondary" (click)="cancelarFormulario()">Cancelar</button>
            </div>
          </form>
        </section>
      }

      <section class="panel">
        <div class="list-heading">
          <h2 class="section-title">Órdenes de servicio</h2>
          <div class="filters">
            <input class="form-control search" type="search" placeholder="Buscar por orden, cliente o placa..." [value]="busqueda" (input)="actualizarBusqueda($event)" />
            <select class="form-control status-filter" [value]="filtroEstado" (change)="actualizarEstado($event)" aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              <option value="en_proceso">En proceso</option>
              <option value="completado">Completados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>
        @if (cargando) {
          <div class="loading-state"><span class="spinner spinner-dark"></span><span>Cargando servicios...</span></div>
        } @else if (serviciosFiltrados.length === 0) {
          <div class="empty-state"><strong>No hay órdenes de servicio</strong><p>Los servicios del taller aparecerán aquí.</p></div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead><tr><th>ORDEN</th><th>FECHA</th><th>CLIENTE / VEHÍCULO</th><th>TRABAJO</th><th>MATERIALES</th><th class="text-right">TOTAL</th><th>ESTADO</th><th>ACCIONES</th></tr></thead>
              <tbody>
                @for (servicio of serviciosFiltrados; track servicio.id) {
                  <tr>
                    <td class="font-mono text-strong">{{ servicio.codigo }}</td>
                    <td>{{ servicio.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ servicio.cliente }}<div class="text-muted">{{ servicio.placa }} · {{ servicio.vehiculo }}</div></td>
                    <td>{{ servicio.descripcion }}</td>
                    <td>{{ servicio.materiales.length }} ítem(s)</td>
                    <td class="text-right">{{ servicio.total | currencyPen }}</td>
                    <td><span class="badge" [class.badge-warning]="servicio.estado === 'en_proceso'" [class.badge-success]="servicio.estado === 'completado'" [class.badge-danger]="servicio.estado === 'cancelado'">{{ etiquetaEstado(servicio.estado) }}</span></td>
                    <td>
                      @if (servicio.estado === 'en_proceso') {
                        <div class="actions-cell">
                          <button type="button" class="btn btn-primary btn-sm" [disabled]="accionandoId === servicio.id" (click)="cambiarEstado(servicio, 'completado')">Completar</button>
                          <button type="button" class="btn btn-danger btn-sm" [disabled]="accionandoId === servicio.id" (click)="cambiarEstado(servicio, 'cancelado')">Cancelar</button>
                        </div>
                      } @else if (servicio.estado === 'completado') {
                        <button type="button" class="btn btn-secondary btn-sm" (click)="imprimirBoleta(servicio)">Boleta PDF</button>
                      } @else { <span class="text-muted">—</span> }
                    </td>
                  </tr>
                  @if (servicio.observaciones) { <tr><td class="detail-note" colspan="8"><strong>Observaciones:</strong> {{ servicio.observaciones }}</td></tr> }
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
    .line-header { margin-top: 6px; }
    .line-header .section-title { margin-bottom: 4px; }
    .hint { margin: 0 0 12px; color: var(--text-secondary); }
    .line-row { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(110px, .7fr) minmax(120px, .8fr) auto; gap: 12px; align-items: end; border-top: 1px solid var(--border-color); padding-top: 12px; }
    .material-info { display: flex; flex-direction: column; padding-bottom: 18px; color: var(--text-secondary); font-size: 12px; }
    .material-info strong { color: var(--text-primary); font-size: 14px; }
    .total-row { display: flex; justify-content: flex-end; gap: 18px; padding: 16px 0; font-size: 16px; }
    .form-actions, .filters { display: flex; gap: 8px; }
    .search { width: 300px; }
    .status-filter { width: 160px; }
    .empty-state { text-align: center; padding: 32px; color: var(--text-secondary); }
    .empty-state strong { color: var(--text-primary); }
    .detail-note { padding: 8px 12px; color: var(--text-secondary); background: var(--surface-hover); }
    .alert-box { padding: 10px 14px; margin-bottom: 14px; border-radius: var(--radius-md); }
    .alert-error { color: var(--state-danger); background: var(--state-danger-bg); }
    .alert-success { color: var(--state-success); background: var(--state-success-bg); }
    @media (max-width: 760px) { .form-grid { grid-template-columns: 1fr 1fr; } .line-row { grid-template-columns: 2fr 1fr; } }
    @media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } .notes { grid-column: auto; } .list-heading, .filters { width: 100%; flex-direction: column; } .search, .status-filter { width: 100%; } .line-row { grid-template-columns: 1fr 1fr; } .product-field { grid-column: 1 / -1; } }
  `],
})
export class ServiciosTallerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ServiciosTallerService);
  private readonly boletaPrint = inject(BoletaPrintService);
  private readonly productosService = inject(ProductoService);
  private readonly inventarioService = inject(InventarioService);
  readonly form = this.fb.nonNullable.group({
    cliente: ['', [Validators.required, Validators.maxLength(160)]],
    telefono: ['', telefonoPeruanoValidator()],
    documentoCliente: ['', documentoPeruanoValidator()],
    placa: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]{5,8}$/i)]],
    vehiculo: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.required, Validators.maxLength(250)]],
    manoObra: [0, [Validators.required, Validators.min(0), Validators.max(10000000), Validators.pattern(/^\d+(?:\.\d{1,2})?$/)]],
    medioPago: ['', Validators.required],
    observaciones: [''],
  });
  servicios: ServicioTaller[] = [];
  productos: Producto[] = [];
  stock: Record<string, number> = {};
  materiales: MaterialDraft[] = [this.nuevoMaterial()];
  busqueda = '';
  filtroEstado = '';
  cargando = true;
  guardando = false;
  mostrarFormulario = false;
  error = '';
  exito = '';
  accionandoId = '';

  get productosActivos(): Producto[] { return this.productos.filter((producto) => producto.activo); }
  get serviciosFiltrados(): ServicioTaller[] {
    const texto = this.busqueda.trim().toLocaleLowerCase();
    return this.servicios.filter((servicio) => {
      const coincideTexto = `${servicio.codigo} ${servicio.cliente} ${servicio.placa}`.toLocaleLowerCase().includes(texto);
      return coincideTexto && (!this.filtroEstado || servicio.estado === this.filtroEstado);
    });
  }
  get totalDraft(): number {
    return Number(this.form.controls.manoObra.value || 0) +
      this.materiales.reduce((sum, material) => sum + this.subtotalMaterial(material), 0);
  }

  ngOnInit(): void {
    let remaining = 3;
    const done = (): void => { remaining -= 1; if (remaining === 0) this.cargando = false; };
    this.service.listar().subscribe({
      next: (items) => { this.servicios = items; done(); },
      error: (err: { error?: { mensaje?: string; message?: string } }) => { this.error = err.error?.mensaje || err.error?.message || 'No se pudieron cargar los servicios.'; done(); },
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
  subtotalMaterial(material: MaterialDraft): number {
    return this.precio(material.productoId) * (Number.isFinite(material.cantidad) ? material.cantidad : 0);
  }
  agregarMaterial(): void { this.materiales = [...this.materiales, this.nuevoMaterial()]; }
  quitarMaterial(index: number): void { if (this.materiales.length > 1) this.materiales = this.materiales.filter((_, i) => i !== index); }
  seleccionarProducto(index: number, event: Event): void { this.materiales[index].productoId = (event.target as HTMLSelectElement).value; }
  actualizarCantidad(index: number, event: Event): void { this.materiales[index].cantidad = (event.target as HTMLInputElement).valueAsNumber; }
  actualizarBusqueda(event: Event): void { this.busqueda = (event.target as HTMLInputElement).value; }
  normalizarDigitos(event: Event, control: 'telefono' | 'documentoCliente', maxLength: number): void {
    const input = event.target as HTMLInputElement;
    const value = soloDigitos(input.value, maxLength);
    input.value = value;
    this.form.controls[control].setValue(value);
  }
  normalizarPlaca(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8);
    input.value = value;
    this.form.controls.placa.setValue(value);
  }
  actualizarEstado(event: Event): void { this.filtroEstado = (event.target as HTMLSelectElement).value; }
  etiquetaEstado(estado: EstadoServicioTaller): string {
    return estado === 'en_proceso' ? 'En proceso' : estado === 'completado' ? 'Completado' : 'Cancelado';
  }

  registrar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error = 'Completa los datos obligatorios del servicio.'; return; }
    if (this.materiales.some((material) => !material.productoId || !Number.isInteger(material.cantidad) || material.cantidad < 1 || material.cantidad > 999999)) {
      this.error = 'Selecciona los materiales y cantidades enteras mayores a cero.'; return;
    }
    if (!Number.isFinite(this.form.controls.manoObra.value) || this.form.controls.manoObra.value > 10000000) {
      this.error = 'La mano de obra debe estar entre S/ 0.00 y S/ 10,000,000.00.'; return;
    }
    if (new Set(this.materiales.map((material) => material.productoId)).size !== this.materiales.length) {
      this.error = 'Cada material debe aparecer una sola vez en el servicio.'; return;
    }
    const sinStock = this.materiales.find((material) => material.cantidad > this.stockDisponible(material.productoId));
    if (sinStock) { this.error = `Stock insuficiente para ${this.nombreProducto(sinStock.productoId)}.`; return; }
    const valores = this.form.getRawValue();
    this.guardando = true; this.error = ''; this.exito = '';
    this.service.registrar({
      ...valores,
      manoObra: Number(valores.manoObra),
      materiales: this.materiales.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
    }).subscribe({
      next: (servicio) => {
        this.servicios = [servicio, ...this.servicios];
        for (const material of servicio.materiales) this.stock[material.productoId] -= material.cantidad;
        this.guardando = false;
        this.exito = `Servicio ${servicio.codigo} registrado; inventario actualizado.`;
        this.cancelarFormulario();
      },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.guardando = false;
        this.error = err.error?.mensaje || err.error?.message || 'No se pudo registrar el servicio.';
      },
    });
  }

  nombreProducto(id: string): string { return this.productos.find((producto) => producto.id === id)?.nombre ?? 'Producto no encontrado'; }

  cambiarEstado(servicio: ServicioTaller, estado: 'completado' | 'cancelado'): void {
    this.accionandoId = servicio.id; this.error = ''; this.exito = '';
    this.service.actualizarEstado(servicio.id, estado).subscribe({
      next: (actualizado) => {
        this.servicios = this.servicios.map((item) => item.id === actualizado.id ? actualizado : item);
        this.accionandoId = '';
        this.exito = `El servicio ${actualizado.codigo} fue ${estado === 'completado' ? 'completado' : 'cancelado'}.`;
      },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.accionandoId = '';
        this.error = err.error?.mensaje || err.error?.message || 'No se pudo actualizar el servicio.';
      },
    });
  }

  imprimirBoleta(servicio: ServicioTaller): void {
    try {
      const lineas = servicio.materiales.map((material) => ({
        codigo: this.productos.find((producto) => producto.id === material.productoId)?.codigo ?? material.productoId,
        descripcion: this.nombreProducto(material.productoId),
        unidad: 'UND',
        cantidad: material.cantidad,
        precio: this.precio(material.productoId),
      }));
      if (servicio.manoObra > 0) {
        lineas.push({
          codigo: 'SERV-MO',
          descripcion: `Mano de obra: ${servicio.descripcion}`,
          unidad: 'SERV',
          cantidad: 1,
          precio: servicio.manoObra,
        });
      }
      this.boletaPrint.imprimir({
        codigo: servicio.codigo,
        fecha: servicio.fechaCompletado ?? servicio.fecha,
        cliente: servicio.cliente,
        documentoCliente: servicio.documentoCliente,
        telefono: servicio.telefono,
        formaPago: this.etiquetaPago(servicio.medioPago),
        observaciones: `${servicio.placa} · ${servicio.vehiculo}${servicio.observaciones ? ` · ${servicio.observaciones}` : ''}`,
        lineas,
        total: servicio.total,
      });
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo abrir la boleta.';
    }
  }

  private etiquetaPago(value: string): string {
    return ({ efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', yape_plin: 'Yape / Plin' } as Record<string, string>)[value] ?? value;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.form.reset({ cliente: '', telefono: '', documentoCliente: '', placa: '', vehiculo: '', descripcion: '', manoObra: 0, medioPago: '', observaciones: '' });
    this.materiales = [this.nuevoMaterial()];
  }

  private nuevoMaterial(): MaterialDraft { return { productoId: '', cantidad: 1 }; }
}
