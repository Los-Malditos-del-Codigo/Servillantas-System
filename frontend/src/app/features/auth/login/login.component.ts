import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="brand-header">
          <img src="servillantaslogo.png" alt="Servillantas RV" class="login-brand-logo" />
          <h1 class="brand-name">Servillantas RV</h1>
        </div>

        @if (errorMensaje) {
          <div class="alert-box alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMensaje }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-group">
            <label for="correo">
              Correo electrónico
              <span class="required-mark">*</span>
            </label>
            <input
              id="correo"
              type="email"
              class="form-control"
              [class.has-error]="esCampoInvalido('correo')"
              formControlName="correo"
              placeholder="nombre@servillantas.pe"
              autocomplete="email"
            />
            @if (esCampoInvalido('correo')) {
              <span class="form-error">Ingrese un correo electrónico válido</span>
            }
          </div>

          <div class="form-group">
            <label for="password">
              Contraseña
              <span class="required-mark">*</span>
            </label>
            <input
              id="password"
              type="password"
              class="form-control"
              [class.has-error]="esCampoInvalido('password')"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            @if (esCampoInvalido('password')) {
              <span class="form-error">La contraseña es obligatoria</span>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-submit"
            [disabled]="cargando || loginForm.invalid"
          >
            @if (cargando) {
              <span class="spinner"></span>
              <span>Iniciando sesión...</span>
            } @else {
              <span>Ingresar al sistema</span>
            }
          </button>
        </form>

        <div class="demo-accounts">
          <span class="demo-title">Cuentas de acceso rápido (Mocks):</span>
          <div class="demo-buttons">
            <button
              type="button"
              class="btn-demo"
              (click)="cargarCuenta('admin@servillantas.pe', 'admin123')"
            >
              <strong>Propietario:</strong> admin&#64;servillantas.pe
            </button>
            <button
              type="button"
              class="btn-demo"
              (click)="cargarCuenta('operador@servillantas.pe', 'operador123')"
            >
              <strong>Personal:</strong> operador&#64;servillantas.pe
            </button>
          </div>
        </div>


      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-app);
      padding: 24px;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background-color: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 36px 32px;
      box-shadow: 0 4px 16px rgba(30, 36, 48, 0.04);
    }

    .brand-header {
      margin-bottom: 28px;
      text-align: center;
    }

    .login-brand-logo {
      height: 60px;
      width: auto;
      margin: 0 auto 12px;
      display: block;
      object-fit: contain;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .alert-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      margin-bottom: 20px;

      &.alert-error {
        background-color: var(--state-danger-bg);
        border: 1px solid var(--state-danger-border);
        color: var(--state-danger);
      }
    }

    .btn-submit {
      width: 100%;
      height: 40px;
      margin-top: 8px;
      font-size: 14px;
    }

    .demo-accounts {
      margin-top: 26px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .demo-title {
      display: block;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .demo-buttons {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .btn-demo {
      text-align: left;
      background-color: var(--surface-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 7px 10px;
      font-size: 12px;
      color: var(--text-primary);
      cursor: pointer;
      transition: background-color var(--transition-fast), border-color var(--transition-fast);

      &:hover {
        background-color: #E6EAEF;
        border-color: var(--border-strong);
      }

      strong {
        color: var(--accent-primary);
      }
    }


  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  cargando = false;
  errorMensaje = '';

  esCampoInvalido(campo: string): boolean {
    const control = this.loginForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  cargarCuenta(correo: string, pass: string): void {
    this.loginForm.patchValue({ correo, password: pass });
    this.errorMensaje = '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/productos']);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje =
          err?.error?.message ||
          err?.error?.mensaje || 'Credenciales incorrectas. Verifique su correo o contraseña.';
      },
    });
  }
}
