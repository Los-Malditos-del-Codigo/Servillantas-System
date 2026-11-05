import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { InventarioService } from '../../core/services/inventario.service';
import { ProductoService } from '../../core/services/producto.service';
import { VentaService } from '../../core/services/venta.service';
import { Inventario } from '../../core/models/inventario.model';
import { Producto } from '../../core/models/producto.model';
import { VentaDetalle } from '../../core/models/venta.model';
import { LineaOperacion } from './operaciones-local.service';

interface VentaVista {
  id: string;
  fecha: string;
  estado: 'confirmada' | 'anulada';
  cliente?: string;
  documentoCliente?: string;
  metodoPago?: string;
  condicionPago?: string;
  observaciones?: string;
  cantidadItems: number;
  total: number;
  motivoAnulacion: string;
  items: LineaOperacion[];
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container sales-page">
      <header class="page-header">
        <div><span class="page-kicker">PUNTO DE VENTA</span><h1 class="page-title">Ventas</h1><p class="page-subtitle">Registro de operaciones y comprobantes internos.</p></div>
        <button class="btn btn-primary" type="button" (click)="abrirVenta()">＋ Nueva venta</button>
      </header>

      @if (mensaje()) { <div class="notice" [class.notice-error]="esError()">{{ mensaje() }}</div> }

      <section class="metric-row" aria-label="Resumen de ventas">
        <div class="metric"><span>Ventas registradas</span><strong>{{ ventas().length }}</strong></div>
        <div class="metric"><span>Confirmadas</span><strong>{{ ventasConfirmadas }}</strong></div>
        <div class="metric"><span>Ingresos confirmados</span><strong>{{ totalIngresos | currency:'PEN':'symbol':'1.2-2' }}</strong></div>
      </section>

      <div class="filters-card operation-filters">
        <form class="operation-search" role="search" (submit)="aplicarBusqueda($event)">
          <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
          <input class="search-input" type="search" aria-label="Buscar ventas" placeholder="Número de venta o cliente" [value]="textoBusqueda()" (input)="textoBusqueda.set($any($event.target).value)" />
          @if (textoBusqueda() || busqueda()) { <button class="clear-search" type="button" aria-label="Limpiar búsqueda" title="Limpiar búsqueda" (click)="limpiarBusqueda()">×</button> }
          <button class="search-submit" type="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg><span>Buscar</span></button>
        </form>
        <select class="form-control filter-select" aria-label="Filtrar ventas por estado" [value]="estado()" (change)="estado.set($any($event.target).value)"><option value="">Todos los estados</option><option value="confirmada">Confirmada</option><option value="anulada">Anulada</option></select>
      </div>

      <div class="table-container">
        <table class="data-table sales-table">
          <thead><tr><th>VENTA</th><th>FECHA</th><th>CLIENTE</th><th>ARTÍCULOS</th><th class="text-right">TOTAL</th><th>ESTADO</th><th class="text-right">ACCIONES</th></tr></thead>
          <tbody>
            @for (sale of ventasFiltradas; track sale.id) {
              <tr>
                <td class="font-mono text-strong">{{ sale.id }}</td><td>{{ sale.fecha | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ sale.cliente || 'Cliente general' }}</td>
                <td>{{ sale.cantidadItems }} productos</td>
                <td class="text-right font-mono text-strong">{{ sale.total | currency:'PEN':'symbol':'1.2-2' }}</td>
                <td><span class="badge" [class.badge-success]="sale.estado === 'confirmada'" [class.badge-neutral]="sale.estado === 'anulada'">{{ sale.estado === 'confirmada' ? 'Confirmada' : 'Anulada' }}</span></td>
                <td class="text-right"><div class="row-actions">
                  <button class="btn-action action-document" type="button" (click)="imprimirComprobante(sale)" title="Abrir comprobante para imprimir">Comprobante</button>
                  @if (sale.estado === 'confirmada') {
                    <button class="btn-action action-danger" type="button" (click)="abrirAnulacion(sale)">Anular</button>
                  }
                </div></td>
              </tr>
              @if (sale.estado === 'anulada') { <tr class="detail-row"><td colspan="7"><strong>Motivo de anulación:</strong> {{ sale.motivoAnulacion }}</td></tr> }
            } @empty { <tr><td colspan="7" class="empty-cell">Todavía no hay ventas registradas.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>

    @if (modalVenta()) {
      <div class="modal-backdrop" (click)="cerrarModales()">
        <section class="operation-modal sale-modal" role="dialog" aria-modal="true" aria-labelledby="sale-title" (click)="$event.stopPropagation()">
          <header class="modal-heading"><div><span class="page-kicker">NUEVA OPERACIÓN</span><h2 id="sale-title">Registrar venta</h2><p>Se descontará el stock disponible al confirmar.</p></div><button class="icon-close" type="button" aria-label="Cerrar" (click)="cerrarModales()">×</button></header>
          <div class="form-group"><label for="sale-customer">Cliente <span class="optional-label">(opcional)</span></label><input id="sale-customer" class="form-control" placeholder="Nombre del cliente" [value]="cliente()" (input)="cliente.set($any($event.target).value)" /></div>
          <div class="sale-customer-grid">
            <div class="form-group"><label for="sale-document">DNI / RUC <span class="optional-label">(opcional)</span></label><input id="sale-document" class="form-control" inputmode="numeric" placeholder="Documento del cliente" [value]="documentoCliente()" (input)="documentoCliente.set($any($event.target).value)" /></div>
            <div class="form-group"><label for="sale-payment">Forma de pago</label><select id="sale-payment" class="form-control" [value]="metodoPago()" (change)="metodoPago.set($any($event.target).value)"><option>Efectivo</option><option>Yape</option><option>Plin</option><option>Tarjeta</option><option>Transferencia</option><option>Otro</option></select></div>
            <div class="form-group"><label for="sale-condition">Condición</label><select id="sale-condition" class="form-control" [value]="condicionPago()" (change)="condicionPago.set($any($event.target).value)"><option>Contado</option><option>Crédito</option></select></div>
          </div>
          <div class="form-group"><label for="sale-notes">Observaciones <span class="optional-label">(opcional)</span></label><input id="sale-notes" class="form-control" placeholder="Nota para el comprobante" [value]="observaciones()" (input)="observaciones.set($any($event.target).value)" /></div>
          <div class="sale-entry-grid">
            <div class="form-group"><label for="sale-product">Producto</label><select id="sale-product" class="form-control" [value]="productoSeleccionado()" (change)="seleccionarProducto($any($event.target).value)"><option value="">Seleccionar producto</option>@for (product of productos(); track product.id) {<option [value]="product.id" [disabled]="stockDisponible(product.id) <= 0">{{ product.codigo }} · {{ product.nombre }} ({{ stockDisponible(product.id) }} disp.)</option>}</select></div>
            <div class="form-group"><label for="sale-quantity">Cantidad</label><input id="sale-quantity" class="form-control" type="number" min="1" step="1" [value]="cantidadItem()" (input)="cantidadItem.set(+$any($event.target).value)" /></div>
            <div class="form-group"><label for="sale-price">Precio unitario (S/)</label><input id="sale-price" class="form-control" type="number" min="0.01" step="0.01" [value]="precioItem()" (input)="precioItem.set(+$any($event.target).value)" /></div>
            <button class="btn btn-secondary add-line" type="button" (click)="agregarLinea()">＋ Agregar</button>
          </div>
          <div class="lines-table-wrap"><table class="data-table compact-table"><thead><tr><th>PRODUCTO</th><th>DISP.</th><th>CANT.</th><th class="text-right">PRECIO</th><th class="text-right">IMPORTE</th><th></th></tr></thead><tbody>@for (line of lineas(); track line.productoId) {<tr><td>{{ line.codigo }} · {{ line.producto }}</td><td>{{ stockDisponible(line.productoId) }}</td><td>{{ line.cantidad }}</td><td class="text-right">{{ line.precioUnitario | currency:'PEN':'symbol':'1.2-2' }}</td><td class="text-right">{{ line.cantidad * line.precioUnitario | currency:'PEN':'symbol':'1.2-2' }}</td><td><button class="btn-action text-danger" type="button" (click)="quitarLinea(line.productoId)">Quitar</button></td></tr>} @empty {<tr><td colspan="6" class="empty-cell">Agrega productos a la venta.</td></tr>}</tbody></table></div>
          <footer class="modal-actions sale-footer"><strong>Total <span>{{ totalBorrador | currency:'PEN':'symbol':'1.2-2' }}</span></strong><div><button type="button" class="btn btn-secondary" (click)="cerrarModales()">Cancelar</button><button type="button" class="btn btn-primary" [disabled]="guardando() || !lineas().length" (click)="confirmarVenta()">{{ guardando() ? 'Procesando…' : 'Confirmar venta' }}</button></div></footer>
        </section>
      </div>
    }

    @if (modalAnulacion()) {
      <div class="modal-backdrop" (click)="cerrarModales()"><section class="operation-modal narrow-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title" (click)="$event.stopPropagation()">
        <header class="modal-heading"><div><span class="page-kicker">REVERSIÓN</span><h2 id="cancel-title">Anular {{ ventaSeleccionada()?.id }}</h2><p>Se reintegrarán al inventario las unidades aún no devueltas.</p></div><button class="icon-close" type="button" aria-label="Cerrar" (click)="cerrarModales()">×</button></header>
        <div class="form-group"><label for="cancel-reason">Motivo obligatorio</label><textarea id="cancel-reason" class="form-control text-area" rows="3" placeholder="Explica por qué se anula esta venta" [value]="motivoAnulacion()" (input)="motivoAnulacion.set($any($event.target).value)"></textarea></div>
        <footer class="modal-actions"><button class="btn btn-secondary" type="button" (click)="cerrarModales()">Volver</button><button class="btn btn-danger" type="button" [disabled]="!motivoAnulacion().trim() || guardando()" (click)="confirmarAnulacion()">Anular venta</button></footer>
      </section></div>
    }

  `,
  styles: [`
    .sales-page { max-width:1360px; margin:0 auto; }.page-kicker { display:block; margin-bottom:5px; color:var(--accent-primary); font-size:10px; font-weight:700; letter-spacing:1px; }
    .metric-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }.metric { padding:14px 16px; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--surface-card); display:flex; flex-direction:column; gap:6px; }.metric span { color:var(--text-secondary); font-size:12px; }.metric strong { font:600 22px var(--font-mono); }
    .operation-filters { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:14px; }
    .operation-search { display:flex; align-items:center; gap:9px; flex:1; min-width:0; max-width:620px; height:44px; padding:4px 5px 4px 12px; background:#fff; border:1px solid var(--border-strong); border-radius:var(--radius-md); transition:border-color var(--transition-fast),box-shadow var(--transition-fast),background-color var(--transition-fast); }
    .operation-search:focus-within { border-color:var(--accent-primary); box-shadow:0 0 0 3px var(--focus-ring); }.search-icon { flex:0 0 18px; width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; color:var(--text-muted); }
    .search-input { flex:1; min-width:0; width:100%; height:100%; padding:0; border:0; outline:none; background:transparent; color:var(--text-primary); font-size:13px; }.search-input::placeholder { color:var(--text-muted); opacity:1; }.search-input::-webkit-search-cancel-button { display:none; }
    .clear-search { display:grid; place-items:center; flex:0 0 28px; width:28px; height:28px; padding:0; border:0; border-radius:4px; background:transparent; color:var(--text-secondary); font-size:20px; line-height:1; cursor:pointer; }.clear-search:hover { background:var(--surface-subtle); color:var(--text-primary); }
    .search-submit { display:inline-flex; align-items:center; justify-content:center; gap:7px; flex:0 0 auto; height:34px; padding:0 13px; border:1px solid var(--accent-primary); border-radius:4px; background:var(--accent-primary); color:#fff; font-size:12px; font-weight:600; cursor:pointer; transition:background-color var(--transition-fast),border-color var(--transition-fast); }.search-submit:hover { background:var(--accent-hover); border-color:var(--accent-hover); }.search-submit:active { background:var(--accent-active); }.search-submit svg { width:15px; height:15px; fill:none; stroke:currentColor; stroke-width:2; }
    .operation-filters .filter-select { width:min(220px,45%); }
    .row-actions { display:flex; justify-content:flex-end; flex-wrap:wrap; gap:6px; }
    .row-actions .btn-action, .compact-table .btn-action { display:inline-flex; min-height:30px; align-items:center; justify-content:center; padding:5px 9px; border:1px solid var(--border-color); border-radius:4px; background:#fff; color:var(--text-secondary); font-size:11px; font-weight:600; line-height:1.2; text-decoration:none; white-space:nowrap; cursor:pointer; transition:background-color var(--transition-fast),border-color var(--transition-fast),color var(--transition-fast),box-shadow var(--transition-fast); }
    .row-actions .btn-action:hover, .compact-table .btn-action:hover { border-color:var(--accent-border); background:var(--accent-subtle); color:var(--accent-primary); }
    .row-actions .btn-action:focus-visible, .compact-table .btn-action:focus-visible { outline:2px solid var(--accent-primary); outline-offset:2px; }
    .row-actions .action-danger, .compact-table .action-danger { color:var(--state-danger); border-color:var(--state-danger-border); }
    .row-actions .action-danger:hover, .compact-table .action-danger:hover { color:var(--state-danger); border-color:var(--state-danger); background:var(--state-danger-bg); }
    .row-actions .action-return { color:var(--accent-primary); border-color:var(--accent-border); }
    .row-actions .action-document { color:var(--state-success); border-color:var(--state-success-border); }
    .row-actions .action-document:hover { color:var(--state-success); border-color:var(--state-success); background:var(--state-success-bg); }
    .empty-cell { padding:32px!important; text-align:center; color:var(--text-secondary); }.detail-row td { background:var(--state-danger-bg); color:var(--state-danger); font-size:12px; }.notice { padding:11px 14px; margin-bottom:14px; border:1px solid var(--state-success-border); background:var(--state-success-bg); color:var(--state-success); border-radius:var(--radius-sm); }.notice-error { color:var(--state-danger); border-color:var(--state-danger-border); background:var(--state-danger-bg); }
    .modal-backdrop { position:fixed; inset:0; z-index:1200; display:grid; place-items:center; padding:20px; background:rgba(18,28,34,.46); }.operation-modal { width:min(850px,100%); max-height:min(92vh,900px); overflow:auto; padding:22px; background:var(--surface-card); border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:0 18px 48px rgba(16,24,40,.2); }.narrow-modal { width:min(560px,100%); }.modal-heading { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }.modal-heading h2 { margin:0; font-size:20px; }.modal-heading p { margin-top:5px; color:var(--text-secondary); font-size:13px; }.icon-close { width:32px; height:32px; border:1px solid var(--border-color); border-radius:4px; background:#fff; font-size:22px; cursor:pointer; }.optional-label { color:var(--text-muted); font-weight:400; }.sale-entry-grid { display:grid; grid-template-columns:minmax(180px,1fr) 100px 150px auto; align-items:end; gap:10px; }.add-line { height:38px; margin-bottom:16px; white-space:nowrap; }.lines-table-wrap { overflow:auto; max-height:210px; border:1px solid var(--border-color); border-radius:var(--radius-sm); }.compact-table { min-width:620px; }.compact-table th,.compact-table td { padding:9px 10px; }.modal-actions { display:flex; justify-content:flex-end; gap:9px; padding-top:16px; border-top:1px solid var(--border-color); margin-top:16px; }.sale-footer { justify-content:space-between; align-items:center; }.sale-footer strong { display:flex; flex-direction:column; gap:3px; color:var(--text-secondary); font-size:12px; }.sale-footer strong span { color:var(--text-primary); font:600 19px var(--font-mono); }.sale-footer div { display:flex; gap:8px; }.text-area { height:auto; min-height:90px; padding:10px 12px; resize:vertical; }
    @media(max-width:760px) { .metric-row { grid-template-columns:1fr; }.operation-filters { align-items:stretch; flex-direction:column; }.operation-search { width:100%; max-width:none; }.operation-filters .filter-select { width:100%; }.sale-entry-grid { grid-template-columns:1fr 1fr; }.sale-entry-grid .form-group:first-child { grid-column:span 2; }.add-line { margin:0 0 16px; }.table-container { overflow-x:auto; }.data-table { min-width:850px; }.operation-modal { padding:16px; }.sale-footer { align-items:stretch; flex-direction:column; }.sale-footer div { justify-content:flex-end; }.row-actions { justify-content:flex-start; gap:5px; }.row-actions .btn-action { min-height:34px; padding:6px 9px; } }
    @media(max-width:460px) { .page-header { align-items:flex-start; flex-direction:column; }.page-header .btn { width:100%; } }
  `],
})
export class VentasComponent implements OnInit {
  private readonly ventasApi = inject(VentaService);
  private readonly productosApi = inject(ProductoService);
  private readonly inventarioApi = inject(InventarioService);

  readonly ventas = signal<VentaVista[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly inventarios = signal<Inventario[]>([]);
  readonly modalVenta = signal(false);
  readonly modalAnulacion = signal(false);
  readonly ventaSeleccionada = signal<VentaVista | null>(null);
  readonly productoSeleccionado = signal('');
  readonly cantidadItem = signal(1);
  readonly precioItem = signal(0);
  readonly cliente = signal('');
  readonly documentoCliente = signal('');
  readonly metodoPago = signal('Efectivo');
  readonly condicionPago = signal('Contado');
  readonly observaciones = signal('');
  readonly lineas = signal<LineaOperacion[]>([]);
  readonly busqueda = signal('');
  readonly textoBusqueda = signal('');
  readonly estado = signal('');
  readonly motivoAnulacion = signal('');
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly guardando = signal(false);

  ngOnInit(): void {
    this.refrescarVentas();
    this.productosApi.listar().subscribe({ next: (items) => this.productos.set(items), error: () => this.notificar('No fue posible cargar el catálogo de productos.', true) });
    this.recargarInventario();
  }

  get ventasConfirmadas(): number { return this.ventas().filter((sale) => sale.estado === 'confirmada').length; }
  get totalIngresos(): number { return this.ventas().filter((sale) => sale.estado === 'confirmada').reduce((sum, sale) => sum + sale.total, 0); }
  get totalBorrador(): number { return this.lineas().reduce((sum, line) => sum + line.cantidad * line.precioUnitario, 0); }
  get ventasFiltradas(): VentaVista[] {
    const query = this.busqueda().trim().toLowerCase();
    return this.ventas().filter((sale) => (!this.estado() || sale.estado === this.estado()) && `${sale.id} ${sale.cliente ?? ''}`.toLowerCase().includes(query));
  }

  aplicarBusqueda(event: Event): void {
    event.preventDefault();
    this.busqueda.set(this.textoBusqueda().trim());
  }

  limpiarBusqueda(): void {
    this.textoBusqueda.set('');
    this.busqueda.set('');
  }

  abrirVenta(): void {
    this.cliente.set(''); this.documentoCliente.set(''); this.metodoPago.set('Efectivo'); this.condicionPago.set('Contado'); this.observaciones.set(''); this.lineas.set([]); this.productoSeleccionado.set(''); this.cantidadItem.set(1); this.precioItem.set(0); this.modalVenta.set(true);
  }

  seleccionarProducto(id: string): void {
    this.productoSeleccionado.set(id);
    const product = this.productos().find((item) => item.id === id);
    this.precioItem.set(product?.precioVenta ?? 0);
  }

  stockDisponible(productoId: string): number { return this.inventarios().find((item) => item.productoId === productoId)?.stockActual ?? 0; }

  agregarLinea(): void {
    const product = this.productos().find((item) => item.id === this.productoSeleccionado());
    const quantity = this.cantidadItem();
    const price = this.precioItem();
    if (!product || !Number.isInteger(quantity) || quantity < 1 || price <= 0 || !Number.isFinite(price)) { this.notificar('Selecciona producto e indica cantidad y precio válidos.', true); return; }
    const otherQuantity = this.lineas().find((line) => line.productoId === product.id)?.cantidad ?? 0;
    if (quantity + otherQuantity > this.stockDisponible(product.id)) { this.notificar(`Stock insuficiente. Disponible: ${this.stockDisponible(product.id)} unidades.`, true); return; }
    const line: LineaOperacion = { productoId: product.id, codigo: product.codigo, producto: product.nombre, cantidad: quantity + otherQuantity, costoUnitario: 0, precioUnitario: price, devuelta: 0 };
    this.lineas.update((lines) => [...lines.filter((item) => item.productoId !== product.id), line]);
    this.productoSeleccionado.set(''); this.cantidadItem.set(1); this.precioItem.set(0);
  }

  quitarLinea(productId: string): void { this.lineas.update((items) => items.filter((item) => item.productoId !== productId)); }

  async confirmarVenta(): Promise<void> {
    const lines = this.lineas();
    if (!lines.length) return;
    if (lines.some((line) => line.cantidad > this.stockDisponible(line.productoId))) { this.notificar('El stock cambió; revisa las cantidades antes de confirmar.', true); this.recargarInventario(); return; }
    this.guardando.set(true);
    try {
      const sale = await firstValueFrom(this.ventasApi.crear(
        { items: lines.map((line) => ({ productoId: line.productoId, cantidad: line.cantidad, precioUnitario: line.precioUnitario })), observacion: this.componerObservacion() },
        crypto.randomUUID()
      ));
      this.refrescarVentas(); this.recargarInventario(); this.modalVenta.set(false); this.notificar(`Venta ${sale.id} registrada y stock descontado.`);
    } catch (error: any) { this.notificar(error?.error?.mensaje ?? 'No se pudo completar la venta. Revisa el stock y vuelve a intentarlo.', true); this.recargarInventario(); }
    finally { this.guardando.set(false); }
  }

  abrirAnulacion(sale: VentaVista): void { this.ventaSeleccionada.set(sale); this.motivoAnulacion.set(''); this.modalAnulacion.set(true); }

  async confirmarAnulacion(): Promise<void> {
    const sale = this.ventaSeleccionada();
    const reason = this.motivoAnulacion().trim();
    if (!sale || !reason) return;
    this.guardando.set(true);
    try {
      await firstValueFrom(this.ventasApi.anular(sale.id, reason, crypto.randomUUID()));
      this.refrescarVentas(); this.recargarInventario(); this.modalAnulacion.set(false); this.notificar(`Venta ${sale.id} anulada y stock reintegrado.`);
    } catch (error: any) { this.notificar(error?.error?.mensaje ?? 'No se pudo anular la venta.', true); }
    finally { this.guardando.set(false); }
  }

  async imprimirComprobante(sale: VentaVista): Promise<void> {
    const popup = window.open('', '_blank', 'width=420,height=800');
    if (!popup) { this.notificar('Permite ventanas emergentes para imprimir el comprobante.', true); return; }
    if (!sale.items.length) { sale = await this.vistaConItems(sale); }
    const rows = sale.items.map((line) => `<tr><td class="description"><strong>${this.escapeHtml(line.codigo)}</strong><br>${this.escapeHtml(line.producto)}</td><td class="number">${line.cantidad}</td><td class="number">${this.sol(line.precioUnitario)}</td><td class="number">${this.sol(line.cantidad * line.precioUnitario)}</td></tr>`).join('');
    const date = new Date(sale.fecha);
    const businessLogo = `${window.location.origin}/servillantaslogo.png`;
    const reference = this.escapeHtml(sale.id);
    const total = sale.items.length ? this.totalVenta(sale) : sale.total;
    const tax = total - total / 1.18;
    const taxable = total - tax;
    const customer = this.escapeHtml(sale.cliente?.trim() || 'CLIENTE GENERAL');
    const document = sale.documentoCliente?.trim() ? this.escapeHtml(sale.documentoCliente) : '---';
    const payment = this.escapeHtml(sale.metodoPago || 'Efectivo');
    const condition = this.escapeHtml(sale.condicionPago || 'Contado');
    const notes = sale.observaciones?.trim() ? this.escapeHtml(sale.observaciones) : '---';
    popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comprobante interno ${reference}</title><style>
      *{box-sizing:border-box}html{background:#e9ecef}body{width:80mm;max-width:100%;margin:18px auto;padding:6mm 5mm;background:#fff;color:#111;font:12px/1.35 Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.receipt{text-align:center}.logo{display:block;width:42mm;max-height:18mm;object-fit:contain;margin:0 auto 8px}.business{font-size:15px;font-weight:800;text-transform:uppercase}.business-meta{margin-top:2px;font-size:11px}.internal{display:inline-block;margin:8px 0 5px;padding:3px 7px;border:1px solid #111;font-size:9px;font-weight:700;letter-spacing:.4px}.legal-note{font-size:9px;font-weight:700}.document-title{margin:12px 0 1px;font-size:15px;font-weight:800}.document-number{font-size:16px;font-weight:800}.customer{margin:14px 0 10px}.customer-name{font-size:13px;font-weight:700;text-transform:uppercase}.customer-doc{margin-top:3px;font-weight:700}.date-row{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px solid #222;border-bottom:1px solid #222;font-size:10px}.items{width:100%;margin-top:8px;border-collapse:collapse;text-align:left}.items th{padding:4px 2px;border-bottom:1px solid #111;font-size:9px;text-transform:uppercase}.items td{padding:5px 2px;vertical-align:top;border-bottom:1px dotted #888;font-size:10px}.items .description{width:48%;overflow-wrap:anywhere}.items .number{text-align:right;white-space:nowrap}.summary{margin-top:8px;border-bottom:1px solid #222}.summary-row{display:flex;justify-content:space-between;gap:6px;padding:2px 0;font-weight:700}.summary-row.total{border-top:1px solid #222;margin-top:3px;padding:4px 0;font-size:19px}.amount-words{margin:7px 0;text-align:left;font-size:10px}.payment{text-align:left;padding:6px 0;border-top:1px solid #222;border-bottom:1px solid #222;font-size:10px}.notes{margin-top:8px;text-align:left;font-size:10px;overflow-wrap:anywhere}.footer{margin-top:13px;font-size:9px}.footer strong{display:block;margin-bottom:4px;font-size:10px}.thanks{margin:10px 0 3px;font-weight:700}.internal-disclaimer{margin-top:10px;padding-top:6px;border-top:1px dashed #555;font-size:8px;font-weight:700;text-transform:uppercase}.ref{margin-top:5px;font:8px monospace;color:#444}
      @page{size:80mm auto;margin:0}@media print{html,body{width:80mm;margin:0;background:#fff}body{padding:5mm 4mm}.logo{max-height:17mm}}
      </style></head><body><main class="receipt"><img class="logo" src="${businessLogo}" alt="Servillantas RV"><div class="business">Servillantas RV</div><div class="business-meta">Venta de llantas, lubricantes y accesorios</div><div class="internal">COMPROBANTE INTERNO</div><div class="legal-note">NO VÁLIDO COMO COMPROBANTE TRIBUTARIO</div><div class="document-title">BOLETA INTERNA DE VENTA</div><div class="document-number">${reference}</div><section class="customer"><div class="customer-name">${customer}</div><div class="customer-doc">DNI / RUC: ${document}</div></section><div class="date-row"><span>FECHA: ${date.toLocaleDateString('es-PE')}</span><span>HORA: ${date.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</span></div><table class="items"><thead><tr><th>Descripción</th><th class="number">Cant.</th><th class="number">P. Unit.</th><th class="number">Total</th></tr></thead><tbody>${rows}</tbody></table><section class="summary"><div class="summary-row"><span>OP. GRAVADA</span><span>${this.sol(taxable)}</span></div><div class="summary-row"><span>I.G.V. (18%)</span><span>${this.sol(tax)}</span></div><div class="summary-row total"><span>TOTAL (S/)</span><span>${this.sol(total)}</span></div></section><div class="amount-words"><strong>SON:</strong> ${this.escapeHtml(this.importeEnLetras(total))}</div><div class="payment"><strong>FORMA DE PAGO:</strong> ${payment.toUpperCase()}<br><strong>CONDICIÓN:</strong> ${condition.toUpperCase()}</div><div class="notes"><strong>Observaciones:</strong><br>${notes}</div><footer class="footer"><div class="thanks">¡Gracias por su preferencia!</div><div>Conserve este documento como constancia de su operación.</div><div class="internal-disclaimer">Representación impresa de un comprobante interno.<br>No reemplaza una boleta electrónica autorizada por SUNAT.</div><div class="ref">Referencia: ${reference}</div></footer></main><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  }

  sol(amount: number): string { return amount.toFixed(2); }
  importeEnLetras(amount: number): string {
    const rounded = Math.round(amount * 100);
    const whole = Math.floor(rounded / 100);
    const cents = rounded % 100;
    return `${this.numeroEnLetras(whole)} CON ${String(cents).padStart(2, '0')}/100 SOLES`;
  }
  private numeroEnLetras(value: number): string {
    const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    const underThousand = (number: number): string => {
      if (number === 0) return 'cero';
      if (number === 100) return 'cien';
      if (number < 10) return units[number];
      if (number < 20) return teens[number - 10];
      if (number < 30) return number === 20 ? 'veinte' : `veinti${units[number - 20]}`;
      if (number < 100) return `${tens[Math.floor(number / 10)]}${number % 10 ? ` y ${units[number % 10]}` : ''}`;
      return `${hundreds[Math.floor(number / 100)]}${number % 100 ? ` ${underThousand(number % 100)}` : ''}`;
    };
    if (value >= 1_000_000) return `${value.toLocaleString('es-PE')} soles`;
    if (value >= 1000) {
      const thousands = Math.floor(value / 1000);
      const rest = value % 1000;
      return `${thousands === 1 ? 'mil' : `${underThousand(thousands)} mil`}${rest ? ` ${underThousand(rest)}` : ''}`;
    }
    return underThousand(value);
  }
  totalVenta(sale: VentaVista): number { return sale.items.reduce((sum, line) => sum + line.cantidad * line.precioUnitario, 0); }
  cantidadVendida(sale: VentaVista): number { return sale.items.reduce((sum, line) => sum + line.cantidad, 0); }
  cerrarModales(): void { this.modalVenta.set(false); this.modalAnulacion.set(false); }

  private componerObservacion(): string | null {
    const parts: string[] = [];
    if (this.cliente().trim()) parts.push(`Cliente: ${this.cliente().trim()}`);
    if (this.documentoCliente().trim()) parts.push(`Doc: ${this.documentoCliente().trim()}`);
    parts.push(`Pago: ${this.metodoPago()}`);
    parts.push(`Condición: ${this.condicionPago()}`);
    if (this.observaciones().trim()) parts.push(this.observaciones().trim());
    return parts.join(' | ');
  }

  private parseObservacion(texto: string | null | undefined): { cliente: string; documentoCliente: string; metodoPago: string; condicionPago: string; observaciones: string } {
    const result = { cliente: '', documentoCliente: '', metodoPago: 'Efectivo', condicionPago: 'Contado', observaciones: '' };
    if (!texto) return result;
    const notas: string[] = [];
    for (const token of texto.split(' | ')) {
      if (token.startsWith('Cliente: ')) result.cliente = token.slice(9);
      else if (token.startsWith('Doc: ')) result.documentoCliente = token.slice(5);
      else if (token.startsWith('Pago: ')) result.metodoPago = token.slice(6);
      else if (token.startsWith('Condición: ')) result.condicionPago = token.slice(11);
      else notas.push(token);
    }
    result.observaciones = notas.join(' | ');
    return result;
  }

  private async vistaConItems(sale: VentaVista): Promise<VentaVista> {
    try {
      const detalle = await firstValueFrom(this.ventasApi.obtenerPorId(sale.id));
      const items: LineaOperacion[] = sale.items.length ? sale.items : detalle.items.map((line) => {
        const product = this.productos().find((item) => item.id === line.productoId);
        return { productoId: line.productoId, codigo: product?.codigo ?? '—', producto: product?.nombre ?? 'Producto', cantidad: line.cantidad, costoUnitario: 0, precioUnitario: line.precioUnitario, devuelta: 0 };
      });
      return { ...sale, items };
    } catch { return sale; }
  }

  private refrescarVentas(): void {
    this.ventasApi.listar({ sortBy: 'fecha', sortDir: 'desc', size: 100 }).subscribe({
      next: (page) => this.ventas.set(page.content.map((item) => this.aVista(item))),
      error: () => this.notificar('No fue posible cargar el historial de ventas.', true),
    });
  }

  private aVista(item: { id: string; fecha: string; estado: string; total: number; observacion: string | null; cantidadItems: number }): VentaVista {
    const parsed = this.parseObservacion(item.observacion);
    return {
      id: item.id,
      fecha: item.fecha,
      estado: item.estado === 'ANULADA' ? 'anulada' : 'confirmada',
      cantidadItems: item.cantidadItems,
      total: item.total,
      motivoAnulacion: '',
      items: [],
      ...parsed,
    };
  }
  private recargarInventario(): void { this.inventarioApi.obtenerStock().subscribe({ next: (items) => this.inventarios.set(items), error: () => this.notificar('No fue posible consultar el stock actual.', true) }); }
  private notificar(text: string, error = false): void { this.mensaje.set(text); this.esError.set(error); window.setTimeout(() => { if (this.mensaje() === text) this.mensaje.set(''); }, 5000); }
  private escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char); }
}