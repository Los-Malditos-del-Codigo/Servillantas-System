import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CompraService } from '../../core/services/compra.service';
import { ProductoService } from '../../core/services/producto.service';
import { ProveedorService } from '../../core/services/proveedor.service';
import { CompraResumen } from '../../core/models/compra.model';
import { Producto } from '../../core/models/producto.model';
import { Proveedor } from '../../core/models/proveedor.model';
import { DocumentoLocal, LineaOperacion } from './operaciones-local.service';

interface CompraVista {
  id: string;
  fecha: string;
  proveedor: string;
  proveedorId: string;
  cantidadItems: number;
  total: number;
  estado: 'pendiente' | 'recibida' | 'anulada';
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container operations-page">
      <header class="page-header">
        <div>
          <span class="page-kicker">ABASTECIMIENTO</span>
          <h1 class="page-title">Compras y proveedores</h1>
          <p class="page-subtitle">Directorio de proveedores y control de reposiciones.</p>
        </div>
        @if (vista() === 'proveedores') {
          <button class="btn btn-primary" type="button" (click)="abrirProveedor()">＋ Nuevo proveedor</button>
        } @else {
          <button class="btn btn-primary" type="button" (click)="abrirCompra()">＋ Registrar compra</button>
        }
      </header>

      <nav class="section-tabs" aria-label="Secciones de compras">
        <button type="button" [class.active]="vista() === 'proveedores'" (click)="vista.set('proveedores')">Proveedores <span>{{ proveedores().length }}</span></button>
        <button type="button" [class.active]="vista() === 'compras'" (click)="vista.set('compras')">Órdenes de compra <span>{{ compras().length }}</span></button>
      </nav>

      @if (mensaje()) {
        <div class="notice" [class.notice-error]="esError()">{{ mensaje() }}</div>
      }

      @if (vista() === 'proveedores') {
        <section class="metric-row" aria-label="Resumen de proveedores">
          <div class="metric"><span>Proveedores registrados</span><strong>{{ proveedores().length }}</strong></div>
          <div class="metric"><span>Activos</span><strong>{{ proveedoresActivos }}</strong></div>
          <div class="metric"><span>Órdenes pendientes</span><strong>{{ comprasPendientes }}</strong></div>
        </section>
        <div class="filters-card operation-filters">
          <form class="operation-search" role="search" (submit)="aplicarBusqueda($event, 'proveedores')">
            <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
            <input class="search-input" type="search" aria-label="Buscar proveedores" placeholder="Nombre, RUC, correo o teléfono" [value]="textoProveedor()" (input)="textoProveedor.set($any($event.target).value)" />
            @if (textoProveedor() || busquedaProveedor()) { <button class="clear-search" type="button" aria-label="Limpiar búsqueda" title="Limpiar búsqueda" (click)="limpiarBusqueda('proveedores')">×</button> }
            <button class="search-submit" type="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg><span>Buscar</span></button>
          </form>
          <label class="checkbox-label"><input type="checkbox" [checked]="mostrarInactivos()" (change)="mostrarInactivos.set($any($event.target).checked)" /> <span>Incluir inactivos</span></label>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>PROVEEDOR</th><th>RUC / DOC.</th><th>CONTACTO</th><th>DIRECCIÓN</th><th>ESTADO</th><th class="text-right">ACCIONES</th></tr></thead>
            <tbody>
              @for (item of proveedoresFiltrados; track item.id) {
                <tr [class.row-inactive]="!item.activo">
                  <td><strong>{{ item.nombre }}</strong></td><td class="font-mono">{{ item.ruc || '—' }}</td>
                  <td><span>{{ item.telefono || 'Sin teléfono' }}</span><small>{{ item.email || 'Sin correo' }}</small></td>
                  <td>{{ item.direccion || '—' }}</td>
                  <td><span class="badge" [class.badge-success]="item.activo" [class.badge-neutral]="!item.activo">{{ item.activo ? 'Activo' : 'Inactivo' }}</span></td>
                  <td class="text-right"><div class="row-actions"><button class="btn-action action-edit" type="button" (click)="abrirProveedor(item)">Editar</button><button class="btn-action" [class.action-danger]="item.activo" [class.action-enable]="!item.activo" type="button" (click)="cambiarEstadoProveedor(item)">{{ item.activo ? 'Desactivar' : 'Activar' }}</button></div></td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-cell">No hay proveedores que coincidan con la búsqueda.</td></tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <section class="metric-row" aria-label="Resumen de compras">
          <div class="metric"><span>Órdenes registradas</span><strong>{{ compras().length }}</strong></div>
          <div class="metric"><span>Pendientes de recepción</span><strong>{{ comprasPendientes }}</strong></div>
          <div class="metric"><span>Recibidas</span><strong>{{ comprasRecibidas }}</strong></div>
        </section>
        <div class="filters-card operation-filters">
          <form class="operation-search" role="search" (submit)="aplicarBusqueda($event, 'compras')">
            <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
            <input class="search-input" type="search" aria-label="Buscar órdenes" placeholder="Número de orden o proveedor" [value]="textoCompra()" (input)="textoCompra.set($any($event.target).value)" />
            @if (textoCompra() || busquedaCompra()) { <button class="clear-search" type="button" aria-label="Limpiar búsqueda" title="Limpiar búsqueda" (click)="limpiarBusqueda('compras')">×</button> }
            <button class="search-submit" type="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg><span>Buscar</span></button>
          </form>
          <select class="form-control filter-select" aria-label="Filtrar por estado" [value]="estadoCompra()" (change)="estadoCompra.set($any($event.target).value)">
            <option value="">Todos los estados</option><option value="pendiente">Pendiente</option><option value="recibida">Recibida</option><option value="anulada">Anulada</option>
          </select>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>ORDEN</th><th>FECHA</th><th>PROVEEDOR</th><th>ARTÍCULOS</th><th class="text-right">TOTAL</th><th>ESTADO</th><th class="text-right">ACCIONES</th></tr></thead>
            <tbody>
              @for (item of comprasFiltradas; track item.id) {
                <tr>
                  <td class="font-mono text-strong">{{ item.id }}</td><td>{{ item.fecha | date:'dd/MM/yyyy' }}</td><td>{{ item.proveedor }}</td><td>{{ item.cantidadItems }} productos</td>
                  <td class="text-right font-mono text-strong">{{ item.total | currency:'PEN':'symbol':'1.2-2' }}</td><td><span class="badge" [class.badge-warning]="item.estado === 'pendiente'" [class.badge-success]="item.estado === 'recibida'" [class.badge-neutral]="item.estado === 'anulada'">{{ etiquetaEstado(item.estado) }}</span></td>
                  <td class="text-right"><div class="row-actions">
                    @if (item.estado === 'pendiente') { <button type="button" class="btn-action action-receive" [disabled]="guardando()" (click)="recibirCompra(item)">Confirmar recepción</button><button type="button" class="btn-action action-danger" (click)="anularCompra(item)">Anular</button> }
                  </div></td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty-cell">No hay órdenes para mostrar. Registra una compra para comenzar.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (modalProveedor()) {
      <div class="modal-backdrop" (click)="cerrarModales()">
        <section class="operation-modal" role="dialog" aria-modal="true" aria-labelledby="provider-title" (click)="$event.stopPropagation()">
          <header class="modal-heading"><div><span class="page-kicker">DIRECTORIO</span><h2 id="provider-title">{{ proveedorEditando ? 'Editar proveedor' : 'Nuevo proveedor' }}</h2></div><button class="icon-close" type="button" aria-label="Cerrar" (click)="cerrarModales()">×</button></header>
          <form [formGroup]="proveedorForm" (ngSubmit)="guardarProveedor()">
            <div class="form-grid-2">
              <div class="form-group span-two"><label for="provider-name">Razón social <i>*</i></label><input id="provider-name" class="form-control" formControlName="nombre" placeholder="Nombre o razón social" /></div>
              <div class="form-group"><label for="provider-doc">RUC / documento</label><input id="provider-doc" class="form-control" formControlName="documento" inputmode="numeric" placeholder="RUC" /></div>
              <div class="form-group"><label for="provider-phone">Teléfono</label><input id="provider-phone" class="form-control" formControlName="telefono" placeholder="Teléfono de contacto" /></div>
              <div class="form-group span-two"><label for="provider-email">Correo electrónico</label><input id="provider-email" type="email" class="form-control" formControlName="correo" placeholder="compras@proveedor.pe" /></div>
              <div class="form-group span-two"><label for="provider-address">Dirección</label><input id="provider-address" class="form-control" formControlName="direccion" placeholder="Dirección fiscal o comercial" /></div>
            </div>
            <footer class="modal-actions"><button type="button" class="btn btn-secondary" (click)="cerrarModales()">Cancelar</button><button type="submit" class="btn btn-primary" [disabled]="proveedorForm.invalid">{{ proveedorEditando ? 'Guardar cambios' : 'Crear proveedor' }}</button></footer>
          </form>
        </section>
      </div>
    }

    @if (modalCompra()) {
      <div class="modal-backdrop" (click)="cerrarModales()">
        <section class="operation-modal purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title" (click)="$event.stopPropagation()">
          <header class="modal-heading"><div><span class="page-kicker">REPOSICIÓN</span><h2 id="purchase-title">Registrar compra</h2><p>La recepción confirmada genera movimientos de entrada.</p></div><button class="icon-close" type="button" aria-label="Cerrar" (click)="cerrarModales()">×</button></header>
          <div class="form-group"><label for="purchase-supplier">Proveedor <i>*</i></label><select id="purchase-supplier" class="form-control" [value]="proveedorSeleccionado()" (change)="proveedorSeleccionado.set($any($event.target).value)"><option value="">Seleccionar proveedor activo</option>@for (provider of proveedoresActivosLista; track provider.id) {<option [value]="provider.id">{{ provider.nombre }}</option>}</select></div>
          <div class="item-entry-grid">
            <div class="form-group"><label for="purchase-product">Producto</label><select id="purchase-product" class="form-control" [value]="productoSeleccionado()" (change)="productoSeleccionado.set($any($event.target).value)"><option value="">Seleccionar producto</option>@for (product of productos(); track product.id) {<option [value]="product.id">{{ product.codigo }} · {{ product.nombre }}</option>}</select></div>
            <div class="form-group"><label for="purchase-quantity">Cantidad</label><input id="purchase-quantity" class="form-control" type="number" min="1" step="1" [value]="cantidadItem()" (input)="cantidadItem.set(+$any($event.target).value)" /></div>
            <div class="form-group"><label for="purchase-cost">Costo unitario (S/)</label><input id="purchase-cost" class="form-control" type="number" min="0" step="0.01" [value]="costoItem()" (input)="costoItem.set(+$any($event.target).value)" /></div>
            <button class="btn btn-secondary add-line" type="button" (click)="agregarLineaCompra()">＋ Agregar</button>
          </div>
          <div class="lines-table-wrap"><table class="data-table compact-table"><thead><tr><th>PRODUCTO</th><th>CANT.</th><th class="text-right">COSTO</th><th class="text-right">IMPORTE</th><th></th></tr></thead><tbody>@for (line of lineasCompra(); track line.productoId) {<tr><td>{{ line.codigo }} · {{ line.producto }}</td><td>{{ line.cantidad }}</td><td class="text-right">{{ line.costoUnitario | currency:'PEN':'symbol':'1.2-2' }}</td><td class="text-right">{{ line.cantidad * line.costoUnitario | currency:'PEN':'symbol':'1.2-2' }}</td><td><button class="btn-action text-danger" type="button" aria-label="Quitar producto" (click)="quitarLineaCompra(line.productoId)">Quitar</button></td></tr>} @empty {<tr><td colspan="5" class="empty-cell">Agrega productos a la orden.</td></tr>}</tbody></table></div>
          <div class="attachment-box"><label for="purchase-documents">Documentos de sustento</label><input id="purchase-documents" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" (change)="cargarDocumentos($event)" /><p>PDF, imágenes u Office. Máximo 1 MB por archivo.</p>@if (documentos().length) {<ul>@for (doc of documentos(); track doc.nombre) {<li>{{ doc.nombre }} <button class="btn-action text-danger" type="button" (click)="quitarDocumento(doc.nombre)">Quitar</button></li>}</ul>}</div>
          <footer class="modal-actions purchase-footer"><strong>Total de orden <span>{{ totalBorradorCompra | currency:'PEN':'symbol':'1.2-2' }}</span></strong><div><button type="button" class="btn btn-secondary" (click)="cerrarModales()">Cancelar</button><button type="button" class="btn btn-primary" [disabled]="guardando() || !proveedorSeleccionado() || !lineasCompra().length" (click)="guardarCompra()">{{ guardando() ? 'Guardando…' : 'Registrar orden' }}</button></div></footer>
        </section>
      </div>
    }
  `,
  styles: [`
    .operations-page { max-width: 1360px; margin: 0 auto; }
    .page-kicker { display:block; margin-bottom:5px; color:var(--accent-primary); font-size:10px; font-weight:700; letter-spacing:1px; }
    .section-tabs { display:flex; gap:4px; border-bottom:1px solid var(--border-color); margin:0 0 20px; }
    .section-tabs button { display:flex; gap:9px; align-items:center; padding:12px 15px; border:0; border-bottom:2px solid transparent; background:none; color:var(--text-secondary); cursor:pointer; }
    .section-tabs button.active { color:var(--accent-primary); border-bottom-color:var(--accent-primary); font-weight:600; }
    .section-tabs span { min-width:20px; padding:1px 6px; border-radius:10px; background:var(--surface-subtle); font:11px var(--font-mono); text-align:center; }
    .metric-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
    .metric { padding:14px 16px; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--surface-card); display:flex; flex-direction:column; gap:6px; }
    .metric span { color:var(--text-secondary); font-size:12px; }.metric strong { font:600 22px var(--font-mono); }
    .operation-filters { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:14px; }
    .operation-search { display:flex; align-items:center; gap:9px; flex:1; min-width:0; max-width:620px; height:44px; padding:4px 5px 4px 12px; background:#fff; border:1px solid var(--border-strong); border-radius:var(--radius-md); transition:border-color var(--transition-fast),box-shadow var(--transition-fast),background-color var(--transition-fast); }
    .operation-search:focus-within { border-color:var(--accent-primary); box-shadow:0 0 0 3px var(--focus-ring); }
    .search-icon { flex:0 0 18px; width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; color:var(--text-muted); }
    .search-input { flex:1; min-width:0; width:100%; height:100%; padding:0; border:0; outline:none; background:transparent; color:var(--text-primary); font-size:13px; }
    .search-input::placeholder { color:var(--text-muted); opacity:1; }.search-input::-webkit-search-cancel-button { display:none; }
    .clear-search { display:grid; place-items:center; flex:0 0 28px; width:28px; height:28px; padding:0; border:0; border-radius:4px; background:transparent; color:var(--text-secondary); font-size:20px; line-height:1; cursor:pointer; }.clear-search:hover { background:var(--surface-subtle); color:var(--text-primary); }
    .search-submit { display:inline-flex; align-items:center; justify-content:center; gap:7px; flex:0 0 auto; height:34px; padding:0 13px; border:1px solid var(--accent-primary); border-radius:4px; background:var(--accent-primary); color:#fff; font-size:12px; font-weight:600; cursor:pointer; transition:background-color var(--transition-fast),border-color var(--transition-fast); }.search-submit:hover { background:var(--accent-hover); border-color:var(--accent-hover); }.search-submit:active { background:var(--accent-active); }.search-submit svg { width:15px; height:15px; fill:none; stroke:currentColor; stroke-width:2; }
    .operation-filters .filter-select { width:min(220px,45%); }
    .data-table small { display:block; color:var(--text-muted); font-size:12px; }
    .row-actions { display:flex; justify-content:flex-end; flex-wrap:wrap; gap:6px; }
    .row-actions .btn-action, .compact-table .btn-action, .attachment-box .btn-action { display:inline-flex; min-height:30px; align-items:center; justify-content:center; padding:5px 9px; border:1px solid var(--border-color); border-radius:4px; background:#fff; color:var(--text-secondary); font-size:11px; font-weight:600; line-height:1.2; text-decoration:none; white-space:nowrap; cursor:pointer; transition:background-color var(--transition-fast),border-color var(--transition-fast),color var(--transition-fast),box-shadow var(--transition-fast); }
    .row-actions .btn-action:hover, .compact-table .btn-action:hover, .attachment-box .btn-action:hover { border-color:var(--accent-border); background:var(--accent-subtle); color:var(--accent-primary); }
    .row-actions .btn-action:focus-visible, .compact-table .btn-action:focus-visible, .attachment-box .btn-action:focus-visible { outline:2px solid var(--accent-primary); outline-offset:2px; }
    .row-actions .btn-action:disabled { opacity:.5; cursor:wait; }
    .row-actions .action-danger, .compact-table .action-danger, .attachment-box .action-danger { color:var(--state-danger); border-color:var(--state-danger-border); }
    .row-actions .action-danger:hover, .compact-table .action-danger:hover, .attachment-box .action-danger:hover { color:var(--state-danger); border-color:var(--state-danger); background:var(--state-danger-bg); }
    .row-actions .action-enable { color:var(--state-success); border-color:var(--state-success-border); }
    .row-actions .action-enable:hover { color:var(--state-success); border-color:var(--state-success); background:var(--state-success-bg); }
    .row-actions .action-receive { color:var(--accent-primary); border-color:var(--accent-border); background:var(--accent-subtle); }
    .document-link { display:inline-flex; align-items:center; }
    .empty-cell { padding:32px!important; text-align:center; color:var(--text-secondary); }.notice { padding:11px 14px; margin-bottom:14px; border:1px solid var(--state-success-border); background:var(--state-success-bg); color:var(--state-success); border-radius:var(--radius-sm); }.notice-error { color:var(--state-danger); border-color:var(--state-danger-border); background:var(--state-danger-bg); }
    .modal-backdrop { position:fixed; inset:0; z-index:1200; display:grid; place-items:center; padding:20px; background:rgba(18,28,34,.46); }
    .operation-modal { width:min(620px,100%); max-height:min(92vh,900px); overflow:auto; padding:22px; background:var(--surface-card); border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:0 18px 48px rgba(16,24,40,.2); }
    .purchase-modal { width:min(850px,100%); }.modal-heading { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }.modal-heading h2 { margin:0; font-size:20px; }.modal-heading p { margin-top:5px; color:var(--text-secondary); font-size:13px; }
    .icon-close { width:32px; height:32px; border:1px solid var(--border-color); border-radius:4px; background:#fff; font-size:22px; cursor:pointer; }.form-grid-2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 14px; }.span-two { grid-column:span 2; }.form-group i { color:var(--state-danger); font-style:normal; }
    .modal-actions { display:flex; justify-content:flex-end; gap:9px; padding-top:16px; border-top:1px solid var(--border-color); margin-top:16px; }.item-entry-grid { display:grid; grid-template-columns:minmax(180px,1fr) 100px 150px auto; align-items:end; gap:10px; }.add-line { height:38px; margin-bottom:16px; white-space:nowrap; }
    .lines-table-wrap { overflow:auto; max-height:200px; border:1px solid var(--border-color); border-radius:var(--radius-sm); }.compact-table { min-width:550px; }.compact-table th,.compact-table td { padding:9px 10px; }.attachment-box { padding:14px 0; }.attachment-box label { display:block; margin-bottom:7px; font-weight:600; }.attachment-box input { max-width:100%; }.attachment-box p { margin-top:5px; color:var(--text-muted); font-size:12px; }.attachment-box ul { margin:8px 0 0; list-style:none; }.attachment-box li { display:flex; justify-content:space-between; gap:10px; padding:5px 0; border-bottom:1px solid var(--border-color); font-size:12px; }
    .purchase-footer { justify-content:space-between; align-items:center; }.purchase-footer strong { display:flex; flex-direction:column; gap:3px; font-size:12px; color:var(--text-secondary); }.purchase-footer strong span { color:var(--text-primary); font:600 19px var(--font-mono); }.purchase-footer div { display:flex; gap:8px; }
    @media(max-width:760px) { .metric-row { grid-template-columns:1fr; }.operation-filters { align-items:stretch; flex-direction:column; }.operation-search { width:100%; max-width:none; }.operation-filters .filter-select { width:100%; }.item-entry-grid { grid-template-columns:1fr 1fr; }.item-entry-grid .form-group:first-child { grid-column:span 2; }.add-line { margin:0 0 16px; }.table-container { overflow-x:auto; }.data-table { min-width:790px; }.operation-modal { padding:16px; }.purchase-footer { align-items:stretch; flex-direction:column; }.purchase-footer div { justify-content:flex-end; }.row-actions { justify-content:flex-start; gap:5px; }.row-actions .btn-action { min-height:34px; padding:6px 9px; } }
    @media(max-width:460px) { .form-grid-2 { grid-template-columns:1fr; }.span-two { grid-column:auto; }.page-header { align-items:flex-start; flex-direction:column; }.page-header .btn { width:100%; } }
  `],
})
export class ComprasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly proveedoresApi = inject(ProveedorService);
  private readonly comprasApi = inject(CompraService);
  private readonly productosApi = inject(ProductoService);

  readonly vista = signal<'proveedores' | 'compras'>('proveedores');
  readonly proveedores = signal<Proveedor[]>([]);
  readonly compras = signal<CompraVista[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly modalProveedor = signal(false);
  readonly modalCompra = signal(false);
  readonly proveedorSeleccionado = signal('');
  readonly productoSeleccionado = signal('');
  readonly cantidadItem = signal(1);
  readonly costoItem = signal(0);
  readonly lineasCompra = signal<LineaOperacion[]>([]);
  readonly documentos = signal<DocumentoLocal[]>([]);
  readonly busquedaProveedor = signal('');
  readonly busquedaCompra = signal('');
  readonly textoProveedor = signal('');
  readonly textoCompra = signal('');
  readonly estadoCompra = signal('');
  readonly mostrarInactivos = signal(false);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly guardando = signal(false);
  proveedorEditando?: Proveedor;

  readonly proveedorForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    documento: ['', [Validators.maxLength(20)]],
    telefono: ['', [Validators.maxLength(30)]],
    correo: ['', [Validators.email, Validators.maxLength(120)]],
    direccion: ['', [Validators.maxLength(180)]],
  });

  ngOnInit(): void {
    this.refrescarListas();
    this.productosApi.listar().subscribe({ next: (items) => this.productos.set(items), error: () => this.notificar('No fue posible cargar el catálogo de productos.', true) });
  }

  get proveedoresActivos(): number { return this.proveedores().filter((item) => item.activo).length; }
  get proveedoresActivosLista(): Proveedor[] { return this.proveedores().filter((item) => item.activo); }
  get comprasPendientes(): number { return this.compras().filter((item) => item.estado === 'pendiente').length; }
  get comprasRecibidas(): number { return this.compras().filter((item) => item.estado === 'recibida').length; }
  get totalBorradorCompra(): number { return this.lineasCompra().reduce((sum, line) => sum + line.cantidad * line.costoUnitario, 0); }
  get proveedoresFiltrados(): Proveedor[] {
    const query = this.busquedaProveedor().trim().toLowerCase();
    return this.proveedores().filter((item) => (this.mostrarInactivos() || item.activo) && `${item.nombre} ${item.ruc ?? ''} ${item.email ?? ''} ${item.telefono ?? ''}`.toLowerCase().includes(query));
  }
  get comprasFiltradas(): CompraVista[] {
    const query = this.busquedaCompra().trim().toLowerCase();
    return this.compras().filter((item) => (!this.estadoCompra() || item.estado === this.estadoCompra()) && `${item.id} ${item.proveedor}`.toLowerCase().includes(query));
  }

  aplicarBusqueda(event: Event, tipo: 'proveedores' | 'compras'): void {
    event.preventDefault();
    if (tipo === 'proveedores') this.busquedaProveedor.set(this.textoProveedor().trim());
    else this.busquedaCompra.set(this.textoCompra().trim());
  }

  limpiarBusqueda(tipo: 'proveedores' | 'compras'): void {
    if (tipo === 'proveedores') { this.textoProveedor.set(''); this.busquedaProveedor.set(''); }
    else { this.textoCompra.set(''); this.busquedaCompra.set(''); }
  }

  abrirProveedor(item?: Proveedor): void {
    this.proveedorEditando = item;
    this.proveedorForm.reset(item ? {
      nombre: item.nombre,
      documento: item.ruc ?? '',
      telefono: item.telefono ?? '',
      correo: item.email ?? '',
      direccion: item.direccion ?? '',
    } : { nombre: '', documento: '', telefono: '', correo: '', direccion: '' });
    this.modalProveedor.set(true);
  }

  guardarProveedor(): void {
    if (this.proveedorForm.invalid) return;
    const values = this.proveedorForm.getRawValue();
    const dto = {
      nombre: values.nombre.trim(),
      ruc: values.documento.trim() || null,
      telefono: values.telefono.trim() || null,
      email: values.correo.trim() || null,
      direccion: values.direccion.trim() || null,
    };
    const request$ = this.proveedorEditando
      ? this.proveedoresApi.actualizar(this.proveedorEditando.id, dto)
      : this.proveedoresApi.crear(dto);

    request$.subscribe({
      next: () => {
        this.refrescarListas();
        this.modalProveedor.set(false);
        this.notificar(this.proveedorEditando ? 'Proveedor actualizado.' : 'Proveedor agregado al directorio.');
      },
      error: (error) => this.notificar(error?.error?.mensaje ?? 'No se pudo guardar el proveedor.', true),
    });
  }

  cambiarEstadoProveedor(item: Proveedor): void {
    if (item.activo && this.compras().some((compra) => compra.proveedorId === item.id && compra.estado === 'pendiente')) {
      this.notificar('No puedes desactivar un proveedor con compras pendientes.', true);
      return;
    }
    this.proveedoresApi.cambiarEstado(item.id).subscribe({
      next: () => {
        this.refrescarListas();
        this.notificar(`Proveedor ${item.activo ? 'desactivado' : 'activado'}.`);
      },
      error: (error) => this.notificar(error?.error?.mensaje ?? 'No se pudo actualizar el estado del proveedor.', true),
    });
  }

  abrirCompra(): void {
    if (!this.proveedoresActivosLista.length) {
      this.vista.set('proveedores');
      this.notificar('Registra o activa un proveedor antes de crear una compra.', true);
      return;
    }
    this.proveedorSeleccionado.set('');
    this.productoSeleccionado.set('');
    this.cantidadItem.set(1);
    this.costoItem.set(0);
    this.lineasCompra.set([]);
    this.documentos.set([]);
    this.modalCompra.set(true);
  }

  agregarLineaCompra(): void {
    const product = this.productos().find((item) => item.id === this.productoSeleccionado());
    const quantity = this.cantidadItem();
    const cost = this.costoItem();
    if (!product || !Number.isInteger(quantity) || quantity < 1 || cost < 0 || !Number.isFinite(cost)) {
      this.notificar('Selecciona un producto e indica cantidad y costo válidos.', true);
      return;
    }
    const line: LineaOperacion = { productoId: product.id, codigo: product.codigo, producto: product.nombre, cantidad: quantity, costoUnitario: cost, precioUnitario: product.precioVenta, devuelta: 0 };
    this.lineasCompra.update((lines) => [...lines.filter((item) => item.productoId !== line.productoId), line]);
    this.productoSeleccionado.set('');
    this.cantidadItem.set(1);
    this.costoItem.set(0);
  }

  quitarLineaCompra(productId: string): void { this.lineasCompra.update((lines) => lines.filter((line) => line.productoId !== productId)); }

  async cargarDocumentos(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    for (const file of files) {
      if (file.size > 1024 * 1024) { this.notificar(`${file.name} supera el límite de 1 MB.`, true); continue; }
      try {
        const dataUrl = await this.leerArchivo(file);
        this.documentos.update((items) => [...items.filter((item) => item.nombre !== file.name), { nombre: file.name, dataUrl, tipo: file.type, bytes: file.size }]);
      } catch { this.notificar(`No se pudo leer ${file.name}.`, true); }
    }
    input.value = '';
  }

  quitarDocumento(name: string): void { this.documentos.update((items) => items.filter((item) => item.nombre !== name)); }

  guardarCompra(): void {
    const provider = this.proveedoresActivosLista.find((item) => item.id === this.proveedorSeleccionado());
    if (!provider || !this.lineasCompra().length) return;
    const dto = {
      proveedorId: provider.id,
      items: this.lineasCompra().map((line) => ({
        productoId: line.productoId,
        cantidad: line.cantidad,
        precioUnitario: line.costoUnitario,
      })),
    };
    this.guardando.set(true);
    this.comprasApi.crear(dto, crypto.randomUUID()).subscribe({
      next: (item) => {
        this.guardando.set(false);
        this.refrescarListas();
        this.vista.set('compras');
        this.modalCompra.set(false);
        this.notificar(`Orden ${item.id} registrada como pendiente de recepción.`);
      },
      error: (error) => {
        this.guardando.set(false);
        this.notificar(error?.error?.mensaje ?? 'No se pudo registrar la compra.', true);
      },
    });
  }

  recibirCompra(item: CompraVista): void {
    if (!confirm(`¿Confirmas la recepción completa de ${item.id}? Se registrarán entradas para sus productos.`)) return;
    this.guardando.set(true);
    this.comprasApi.recibir(item.id, crypto.randomUUID()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.refrescarListas();
        this.notificar(`Compra ${item.id} recibida y entradas registradas.`);
      },
      error: (error) => {
        this.guardando.set(false);
        this.notificar(error?.error?.mensaje ?? 'No se pudo completar la recepción. Revisa el stock y vuelve a intentarlo.', true);
      },
    });
  }

  anularCompra(item: CompraVista): void {
    const motivo = window.prompt(`Motivo de anulación de ${item.id}:`);
    if (!motivo || !motivo.trim()) return;
    this.comprasApi.anular(item.id, motivo.trim(), crypto.randomUUID()).subscribe({
      next: () => {
        this.refrescarListas();
        this.notificar(`Compra ${item.id} anulada.`);
      },
      error: (error) => this.notificar(error?.error?.mensaje ?? 'No se pudo anular la compra.', true),
    });
  }

  etiquetaEstado(estado: CompraVista['estado']): string { return estado === 'pendiente' ? 'Pendiente' : estado === 'recibida' ? 'Recibida' : 'Anulada'; }
  cerrarModales(): void { this.modalProveedor.set(false); this.modalCompra.set(false); }

  private refrescarListas(): void {
    this.proveedoresApi.listar({ size: 100 }).subscribe({
      next: (items) => this.proveedores.set(items),
      error: () => this.notificar('No fue posible cargar los proveedores.', true),
    });
    this.comprasApi.listar({ size: 100 }).subscribe({
      next: (page) => this.compras.set(page.content.map((item) => this.aCompraVista(item))),
      error: () => this.notificar('No fue posible cargar las compras.', true),
    });
  }

  private aCompraVista(item: CompraResumen): CompraVista {
    const estado = item.estado === 'REGISTRADA' ? 'pendiente' : item.estado === 'RECIBIDA' ? 'recibida' : 'anulada';
    return {
      id: item.id,
      fecha: item.fecha,
      proveedor: item.proveedorNombre,
      cantidadItems: item.cantidadItems,
      total: item.total,
      estado,
      proveedorId: item.proveedorId,
    };
  }
  private notificar(text: string, error = false): void { this.mensaje.set(text); this.esError.set(error); window.setTimeout(() => { if (this.mensaje() === text) this.mensaje.set(''); }, 5000); }
  private leerArchivo(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(); reader.onerror = () => reject(); reader.readAsDataURL(file); }); }
}