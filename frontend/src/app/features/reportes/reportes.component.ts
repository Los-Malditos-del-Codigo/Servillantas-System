import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompraResumen } from '../../core/models/compra.model';
import { Inventario } from '../../core/models/inventario.model';
import { Producto } from '../../core/models/producto.model';
import { ServicioResumen } from '../../core/models/servicio.model';
import { VentaResumen } from '../../core/models/venta.model';
import { CompraService } from '../../core/services/compra.service';
import { InventarioService } from '../../core/services/inventario.service';
import { ProductoService } from '../../core/services/producto.service';
import { ServicioService } from '../../core/services/servicio.service';
import { VentaService } from '../../core/services/venta.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { CurrencyPenPipe } from '../../shared/pipes/currency-pen.pipe';

type TipoReporte = 'inventario' | 'ventas' | 'compras' | 'taller';
interface FilaReporte {
  fecha: string;
  referencia: string;
  descripcion: string;
  estado: string;
  monto: number;
  cantidad: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPenPipe],
  template: `
    <div class="page-container">
      <div class="print-header">
        <div class="print-brand">
          <img src="servillantaslogo.png" alt="" />
          <div><strong>Servillantas RV</strong><span>Gestión de inventario y operaciones</span></div>
        </div>
        <div class="print-report-title">
          <span>REPORTE DE GESTIÓN</span>
          <h1>{{ tituloReporte }}</h1>
          <p>Generado el {{ fechaGeneracion | date:'dd/MM/yyyy · HH:mm' }}</p>
        </div>
      </div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Reportes</h1>
          <p class="page-subtitle">Consulta y exporta información consolidada de inventario y operaciones.</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="exportarExcel()" [disabled]="cargando">Exportar Excel (.xlsx)</button>
          <button type="button" class="btn btn-secondary" (click)="exportarCsv()" [disabled]="cargando">Exportar CSV</button>
          <button type="button" class="btn btn-primary" (click)="imprimir()" [disabled]="cargando">Imprimir / Guardar PDF</button>
        </div>
      </div>
      @if (error) { <div class="alert-box alert-error" role="alert">{{ error }}</div> }

      <section class="panel filters">
        <div class="form-group">
          <label for="tipo">Reporte</label>
          <select id="tipo" class="form-control" [(ngModel)]="tipo">
            <option value="inventario">Inventario actual</option>
            <option value="ventas">Ventas</option>
            <option value="compras">Compras</option>
            <option value="taller">Servicios de taller</option>
          </select>
        </div>
        @if (tipo !== 'inventario') {
          <div class="form-group">
            <label for="desde">Desde</label>
            <input id="desde" type="date" class="form-control" [(ngModel)]="desde" />
          </div>
          <div class="form-group">
            <label for="hasta">Hasta</label>
            <input id="hasta" type="date" class="form-control" [(ngModel)]="hasta" />
          </div>
        }
        <div class="form-group search-group">
          <label for="buscar">Buscar</label>
          <input id="buscar" type="search" class="form-control" [(ngModel)]="busqueda" placeholder="Filtrar resultados..." />
        </div>
        <button type="button" class="btn btn-secondary refresh" (click)="cargarDatos()">Actualizar datos</button>
      </section>

      <section class="panel report-results">
        <div class="result-heading">
          <div><h2>{{ tituloReporte }}</h2><p>{{ filasFiltradas.length }} resultado(s)</p></div>
          @if (tipo !== 'inventario') { <strong class="sum">Total: {{ totalFiltrado | currencyPen }}</strong> }
        </div>
        @if (cargando) {
          <div class="loading-state"><span class="spinner spinner-dark"></span><span>Cargando datos del reporte...</span></div>
        } @else if (filasFiltradas.length === 0) {
          <div class="empty-state">No hay información que coincida con los filtros seleccionados.</div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead><tr>
                <th>{{ tipo === 'inventario' ? 'CÓDIGO' : 'FECHA' }}</th>
                <th>{{ tipo === 'inventario' ? 'PRODUCTO' : 'REFERENCIA' }}</th>
                <th>{{ tipo === 'inventario' ? 'STOCK' : 'DETALLE' }}</th>
                <th>ESTADO</th>
                <th class="text-right">{{ tipo === 'inventario' ? 'STOCK' : 'CANTIDAD' }}</th>
                <th class="text-right">{{ tipo === 'inventario' ? 'VALOR REFERENCIAL' : 'TOTAL' }}</th>
              </tr></thead>
              <tbody>@for (fila of filasFiltradas; track fila.referencia) {
                <tr>
                  <td>{{ tipo === 'inventario' ? fila.fecha : (fila.fecha | date:'dd/MM/yyyy HH:mm') }}</td>
                  <td>{{ fila.referencia }}</td>
                  <td>{{ fila.descripcion }}</td>
                  <td>{{ fila.estado }}</td>
                  <td class="text-right">{{ fila.cantidad }}</td>
                  <td class="text-right">{{ fila.monto | currencyPen }}</td>
                </tr>
              }</tbody>
              @if (tipo !== 'inventario') {
                <tfoot><tr><th colspan="5" class="text-right">Total del reporte</th><th class="text-right">{{ totalFiltrado | currencyPen }}</th></tr></tfoot>
              }
            </table>
          </div>
        }
      </section>
      <p class="export-note">Excel descarga un libro .xlsx. CSV abre en hojas de cálculo. Para PDF, elige Guardar como PDF en el diálogo de impresión.</p>
    </div>
  `,
  styles: [`
    .panel { background: var(--surface-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 18px; }
    .filters { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
    .form-group { min-width: 170px; margin-bottom: 0; }
    .search-group { flex: 1; }
    .refresh { margin-bottom: 16px; }
    .header-actions { display: flex; flex-wrap: wrap; gap: 14px; }
    .result-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 14px; }
    .result-heading h2 { font-size: 17px; }
    .result-heading p { color: var(--text-secondary); font-size: 13px; }
    .sum { font-size: 16px; }
    .empty-state { text-align: center; padding: 32px; color: var(--text-secondary); }
    .export-note { color: var(--text-muted); font-size: 12px; }
    .alert-box { padding: 10px 14px; margin-bottom: 14px; border-radius: var(--radius-md); }
    .alert-error { color: var(--state-danger); background: var(--state-danger-bg); }
    .print-header { display: none; }
    @media print {
      :host { color: #1e2430; background: #fff; }
      .page-header, .filters, .header-actions, .export-note, .alert-box, app-inventory-assistant { display: none !important; }
      .page-container { padding: 0 !important; color: #1e2430; }
      .print-header { display: block; margin-bottom: 22px; border-bottom: 2px solid #2e5a6c; }
      .print-brand { display: flex; align-items: center; gap: 12px; padding: 0 0 16px; }
      .print-brand img { width: 52px; height: 52px; object-fit: contain; }
      .print-brand strong { display: block; color: #1e2430; font-size: 16px; }
      .print-brand span { display: block; color: #5b6472; font-size: 10px; }
      .print-report-title { padding: 12px 16px; color: #fff; background: #2e5a6c !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .print-report-title > span { font-size: 9px; font-weight: 700; letter-spacing: .12em; opacity: .8; }
      .print-report-title h1 { margin: 3px 0; font-size: 18px; }
      .print-report-title p { font-size: 10px; opacity: .85; }
      .report-results.panel { border: 0; padding: 0; box-shadow: none; }
      .result-heading { margin: 0 0 12px; }
      .result-heading h2 { color: #244857; font-size: 14px; }
      .table-container { overflow: visible; border: 1px solid #d5dce0; border-radius: 0; box-shadow: none; }
      .data-table { width: 100%; border-collapse: collapse; font-size: 9px; }
      .data-table thead { display: table-header-group; }
      .data-table th { padding: 8px; color: #244857; background: #eaf0f3 !important; font-size: 8px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .data-table td { padding: 7px 8px; border-bottom: 1px solid #e2e5e9; color: #1e2430; }
      .data-table tbody tr:nth-child(even) { background: #f6f7f8 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .data-table tfoot th { padding: 9px 8px; border-top: 2px solid #9cb5c1; color: #244857; }
      .panel { page-break-inside: avoid; }
      @page { size: landscape; margin: 14mm; }
    }
  `],
})
export class ReportesComponent implements OnInit {
  private readonly inventarioService = inject(InventarioService);
  private readonly productoService = inject(ProductoService);
  private readonly compraService = inject(CompraService);
  private readonly ventaService = inject(VentaService);
  private readonly servicioService = inject(ServicioService);
  private readonly excelExport = inject(ExcelExportService);
  productos: Producto[] = [];
  stock: Inventario[] = [];
  compras: CompraResumen[] = [];
  ventas: VentaResumen[] = [];
  servicios: ServicioResumen[] = [];
  tipo: TipoReporte = 'inventario';
  desde = '';
  hasta = '';
  busqueda = '';
  cargando = true;
  error = '';
  readonly fechaGeneracion = new Date();

  get tituloReporte(): string {
    return ({
      inventario: 'Estado actual del inventario',
      ventas: 'Reporte de ventas',
      compras: 'Reporte de compras',
      taller: 'Reporte de servicios de taller',
    } as Record<TipoReporte, string>)[this.tipo];
  }

  get filas(): FilaReporte[] {
    switch (this.tipo) {
      case 'inventario':
        return this.stock.map((item) => {
          const producto = this.productos.find((p) => p.id === item.productoId);
          return {
            fecha: producto?.codigo ?? item.productoId,
            referencia: producto?.nombre ?? 'Producto no encontrado',
            descripcion: producto?.descripcion ?? 'Referencia sin producto asociado',
            estado: !producto?.activo ? 'Inactivo' : item.stockActual <= (producto?.stockMinimo ?? 0) ? 'Stock bajo' : 'Saludable',
            cantidad: item.stockActual,
            monto: item.stockActual * (producto?.precioVenta ?? 0),
          };
        });
      case 'ventas':
        return this.ventas.map((venta) => ({
          fecha: venta.fecha,
          referencia: `${venta.id} · ${venta.observacion ?? 'Venta'}`,
          descripcion: `${venta.cantidadItems} ítem(s)`,
          estado: venta.estado,
          cantidad: venta.cantidadItems,
          monto: venta.total,
        }));
      case 'compras':
        return this.compras.map((compra) => ({
          fecha: compra.fecha,
          referencia: `${compra.id} · ${compra.proveedorNombre}`,
          descripcion: `${compra.cantidadItems} ítem(s)`,
          estado: compra.estado,
          cantidad: compra.cantidadItems,
          monto: compra.total,
        }));
      case 'taller':
        return this.servicios.map((servicio) => ({
          fecha: servicio.fecha,
          referencia: `${servicio.id} · ${servicio.tipoServicioNombre}`,
          descripcion: `${servicio.cantidadMateriales} material(es)${servicio.observacion ? ` · ${servicio.observacion}` : ''}`,
          estado: servicio.estado,
          cantidad: servicio.cantidadMateriales,
          monto: servicio.precio,
        }));
    }
  }

  get filasFiltradas(): FilaReporte[] {
    const texto = this.busqueda.trim().toLocaleLowerCase();
    return this.filas.filter((fila) => {
      const fecha = this.tipo === 'inventario' ? '' : fila.fecha.slice(0, 10);
      const coincideDesde = !this.desde || !fecha || fecha >= this.desde;
      const coincideHasta = !this.hasta || !fecha || fecha <= this.hasta;
      const coincideTexto = `${fila.fecha} ${fila.referencia} ${fila.descripcion} ${fila.estado}`.toLocaleLowerCase().includes(texto);
      return coincideDesde && coincideHasta && coincideTexto;
    });
  }

  get totalFiltrado(): number {
    return this.filasFiltradas.reduce((sum, fila) => sum + fila.monto, 0);
  }

  ngOnInit(): void { this.cargarDatos(); }

  exportarCsv(): void {
    const headers = this.tipo === 'inventario'
      ? ['Codigo', 'Producto', 'Descripcion', 'Estado', 'Stock', 'Valor referencial PEN']
      : ['Fecha', 'Referencia', 'Detalle', 'Estado', 'Cantidad', 'Total PEN'];
    const data = this.filasFiltradas.map((fila) => [
      fila.fecha,
      fila.referencia,
      fila.descripcion,
      fila.estado,
      String(fila.cantidad),
      fila.monto.toFixed(2),
    ]);
    const csv = [headers, ...data]
      .map((row) => row.map((value) => {
        const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
        return `"${safeValue.replace(/"/g, '""')}"`;
      }).join(','))
      .join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${this.tipo}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  exportarExcel(): void {
    const headers = this.tipo === 'inventario'
      ? ['Código', 'Producto', 'Descripción', 'Estado', 'Stock', 'Valor referencial (PEN)']
      : ['Fecha', 'Referencia', 'Detalle', 'Estado', 'Cantidad', 'Total (PEN)'];
    const rows: Array<Array<string | number>> = [
      headers,
      ...this.filasFiltradas.map((fila) => [
        this.tipo === 'inventario' ? fila.fecha : new Date(fila.fecha).toLocaleString('es-PE'),
        fila.referencia,
        fila.descripcion,
        fila.estado,
        fila.cantidad,
        fila.monto,
      ]),
    ];
    this.excelExport.exportar(
      this.nombreHoja,
      `reporte-${this.tipo}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      rows,
      this.tituloReporte
    );
  }

  private get nombreHoja(): string {
    return ({
      inventario: 'Inventario',
      ventas: 'Ventas',
      compras: 'Compras',
      taller: 'Servicios taller',
    } as Record<TipoReporte, string>)[this.tipo];
  }

  imprimir(): void { window.print(); }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';
    let remaining = 5;
    const done = (): void => { remaining -= 1; if (remaining === 0) this.cargando = false; };
    this.productoService.listar({ includeInactivos: true }).subscribe({
      next: (items) => { this.productos = items; done(); },
      error: () => { this.error = 'No se pudieron cargar los productos.'; done(); },
    });
    this.inventarioService.obtenerStock().subscribe({
      next: (items) => { this.stock = items; done(); },
      error: () => { this.error = 'No se pudo cargar el inventario.'; done(); },
    });
    this.compraService.listar({ size: 500 }).subscribe({
      next: (res) => { this.compras = res.content; done(); },
      error: () => { this.error = 'No se pudieron cargar las compras.'; done(); },
    });
    this.ventaService.listar({ size: 500 }).subscribe({
      next: (res) => { this.ventas = res.content; done(); },
      error: () => { this.error = 'No se pudieron cargar las ventas.'; done(); },
    });
    this.servicioService.listar({ size: 500 }).subscribe({
      next: (res) => { this.servicios = res.content; done(); },
      error: () => { this.error = 'No se pudieron cargar los servicios.'; done(); },
    });
  }
}
