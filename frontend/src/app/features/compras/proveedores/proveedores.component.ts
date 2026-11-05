import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ComprasService, ProveedorForm } from '../../../core/services/compras.service';
import { Proveedor } from '../../../core/models/proveedor.model';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Proveedores</h1>
          <p class="page-subtitle">Administra los datos de contacto de tus proveedores.</p>
        </div>
        <a routerLink="/compras" class="btn btn-secondary">Volver a compras</a>
      </div>

      @if (error) {
        <div class="alert-box alert-error" role="alert">{{ error }}</div>
      }
      @if (exito) {
        <div class="alert-box alert-success" role="status">{{ exito }}</div>
      }

      <section class="panel">
        <h2 class="section-title">{{ editando ? 'Editar proveedor' : 'Registrar proveedor' }}</h2>
        <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid">
          <div class="form-group">
            <label for="ruc">RUC <span class="required-mark">*</span></label>
            <input id="ruc" type="text" class="form-control" formControlName="ruc" maxlength="11" inputmode="numeric" autocomplete="off" placeholder="11 dígitos" (input)="normalizarDigitos($event, 'ruc', 11)" />
            @if (form.controls.ruc.invalid && form.controls.ruc.touched) {
              <span class="form-error">Ingresa un RUC válido de 11 dígitos.</span>
            }
          </div>
          <div class="form-group">
            <label for="razonSocial">Razón social <span class="required-mark">*</span></label>
            <input id="razonSocial" class="form-control" formControlName="razonSocial" maxlength="160" />
          </div>
          <div class="form-group">
            <label for="contacto">Contacto</label>
            <input id="contacto" class="form-control" formControlName="nombreContacto" maxlength="100" />
          </div>
          <div class="form-group">
            <label for="telefono">Teléfono</label>
            <input id="telefono" type="tel" inputmode="numeric" class="form-control" formControlName="telefono" maxlength="15" placeholder="7 a 15 dígitos" (input)="normalizarDigitos($event, 'telefono', 15)" />
            @if (form.controls.telefono.invalid && form.controls.telefono.touched) {
              <span class="form-error">Ingresa entre 7 y 15 dígitos.</span>
            }
          </div>
          <div class="form-group">
            <label for="email">Correo</label>
            <input id="email" type="email" class="form-control" formControlName="email" />
          </div>
          <div class="form-group">
            <label for="direccion">Dirección</label>
            <input id="direccion" class="form-control" formControlName="direccion" maxlength="220" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="guardando">
              {{ guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar proveedor' }}
            </button>
            @if (editando) {
              <button type="button" class="btn btn-secondary" (click)="limpiarFormulario()">Cancelar edición</button>
            }
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="table-heading">
          <h2 class="section-title">Directorio de proveedores</h2>
          <input
            class="form-control search"
            type="search"
            placeholder="Buscar por RUC, razón social o contacto..."
            [value]="busqueda"
            (input)="actualizarBusqueda($event)"
          />
        </div>
        @if (cargando) {
          <div class="loading-state"><span class="spinner spinner-dark"></span><span>Cargando proveedores...</span></div>
        } @else if (proveedoresFiltrados.length === 0) {
          <p class="empty-state">No hay proveedores que coincidan con la búsqueda.</p>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr><th>RUC</th><th>RAZÓN SOCIAL</th><th>CONTACTO</th><th>TELÉFONO</th><th>ESTADO</th><th class="text-right">ACCIONES</th></tr>
              </thead>
              <tbody>
                @for (proveedor of proveedoresFiltrados; track proveedor.id) {
                  <tr [class.row-inactive]="!proveedor.activo">
                    <td class="font-mono">{{ proveedor.ruc }}</td>
                    <td>
                      <div class="supplier-name">{{ proveedor.razonSocial }}</div>
                      <div class="text-muted">{{ proveedor.email || 'Sin correo' }}</div>
                    </td>
                    <td>{{ proveedor.nombreContacto || '—' }}</td>
                    <td>{{ proveedor.telefono || '—' }}</td>
                    <td><span class="badge" [class.badge-success]="proveedor.activo" [class.badge-danger]="!proveedor.activo">{{ proveedor.activo ? 'Activo' : 'Inactivo' }}</span></td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button type="button" class="btn btn-secondary btn-sm" (click)="editar(proveedor)">Editar</button>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="cambiarEstado(proveedor)">
                          {{ proveedor.activo ? 'Desactivar' : 'Activar' }}
                        </button>
                      </div>
                    </td>
                  </tr>
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
    .form-actions { display: flex; align-items: flex-start; gap: 14px; grid-column: 1 / -1; padding-top: 4px; }
    .table-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
    .actions-cell { display: inline-flex; gap: 10px; }
    .table-heading .section-title { margin: 0 0 14px; }
    .search { max-width: 360px; margin-bottom: 14px; }
    .supplier-name { font-weight: 600; }
    .empty-state { color: var(--text-secondary); padding: 24px 0; }
    .alert-box { padding: 10px 14px; margin-bottom: 14px; border-radius: var(--radius-md); }
    .alert-error { color: var(--state-danger); background: var(--state-danger-bg); }
    .alert-success { color: var(--state-success); background: var(--state-success-bg); }
    @media (max-width: 800px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } .table-heading { align-items: stretch; flex-direction: column; } .search { max-width: none; } }
  `],
})
export class ProveedoresComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly comprasService = inject(ComprasService);
  readonly form = this.fb.nonNullable.group({
    ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    razonSocial: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    nombreContacto: ['', Validators.maxLength(100)],
    telefono: ['', Validators.pattern(/^\d{7,15}$/)],
    email: ['', Validators.email],
    direccion: [''],
  });
  proveedores: Proveedor[] = [];
  busqueda = '';
  cargando = true;
  guardando = false;
  error = '';
  exito = '';
  editando: Proveedor | null = null;

  get proveedoresFiltrados(): Proveedor[] {
    const term = this.busqueda.trim().toLocaleLowerCase();
    return this.proveedores.filter((p) =>
      `${p.ruc} ${p.razonSocial} ${p.nombreContacto}`.toLocaleLowerCase().includes(term)
    );
  }

  ngOnInit(): void {
    this.cargarProveedores();
  }

  actualizarBusqueda(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
  }

  normalizarDigitos(event: Event, control: 'ruc' | 'telefono', maxLength: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, maxLength);
    input.value = value;
    this.form.controls[control].setValue(value);
  }

  editar(proveedor: Proveedor): void {
    this.editando = proveedor;
    this.error = '';
    this.exito = '';
    this.form.patchValue({
      ruc: proveedor.ruc,
      razonSocial: proveedor.razonSocial,
      nombreContacto: proveedor.nombreContacto,
      telefono: proveedor.telefono.replace(/\D/g, ''),
      email: proveedor.email,
      direccion: proveedor.direccion,
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    this.error = '';
    this.exito = '';
    const dto: ProveedorForm = this.form.getRawValue();
    const request = this.editando
      ? this.comprasService.actualizarProveedor(this.editando.id, dto)
      : this.comprasService.crearProveedor(dto);
    request.subscribe({
      next: (proveedor) => {
        this.guardando = false;
        const index = this.proveedores.findIndex((item) => item.id === proveedor.id);
        if (index >= 0) this.proveedores[index] = proveedor;
        else this.proveedores = [proveedor, ...this.proveedores];
        this.exito = this.editando ? 'Proveedor actualizado.' : 'Proveedor registrado.';
        this.limpiarFormulario();
      },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.guardando = false;
        this.error = err.error?.mensaje || err.error?.message || 'No se pudo guardar el proveedor.';
      },
    });
  }

  cambiarEstado(proveedor: Proveedor): void {
    this.error = '';
    this.exito = '';
    this.comprasService.actualizarProveedor(proveedor.id, { activo: !proveedor.activo }).subscribe({
      next: (actualizado) => {
        this.proveedores = this.proveedores.map((item) => item.id === actualizado.id ? actualizado : item);
        this.exito = actualizado.activo ? 'Proveedor activado.' : 'Proveedor desactivado.';
      },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.error = err.error?.mensaje || err.error?.message || 'No se pudo cambiar el estado del proveedor.';
      },
    });
  }

  limpiarFormulario(): void {
    this.editando = null;
    this.form.reset();
  }

  private cargarProveedores(): void {
    this.cargando = true;
    this.comprasService.listarProveedores().subscribe({
      next: (items) => {
        this.proveedores = items;
        this.cargando = false;
      },
      error: (err: { error?: { mensaje?: string; message?: string } }) => {
        this.error = err.error?.mensaje || err.error?.message || 'No se pudieron cargar los proveedores.';
        this.cargando = false;
      },
    });
  }
}
