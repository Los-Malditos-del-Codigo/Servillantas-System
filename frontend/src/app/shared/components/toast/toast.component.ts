import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertasService } from '../../../core/services/alertas.service';
import { Alerta } from '../../../core/models/alerta.model';

@Component({
  selector: 'app-toast-alertas',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toastVisible && currentAlerta) {
      <div class="toast-container" role="alert" aria-live="assertive">
        <div class="toast-header">
          <div class="toast-indicator" [class.danger]="currentAlerta.tipo === 'stock_agotado'"></div>
          <span class="toast-title">
            {{ currentAlerta.tipo === 'stock_agotado' ? 'Stock Agotado' : 'Alerta de Stock Bajo' }}
          </span>
          <div class="toast-actions">
            <button
              type="button"
              class="btn-icon"
              (click)="toggleAudio()"
              [title]="alertasService.sonidoActivo() ? 'Silenciar sonido' : 'Activar sonido'"
            >
              @if (alertasService.sonidoActivo()) {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              } @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              }
            </button>
            <button type="button" class="btn-icon" (click)="cerrar()" aria-label="Cerrar aviso">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="toast-body">
          <p class="toast-msg">{{ currentAlerta.mensaje }}</p>
          <div class="toast-meta">
            <span>Stock actual: <strong>{{ currentAlerta.stockActual }}</strong></span>
            <span>Mínimo: <strong>{{ currentAlerta.stockMinimo }}</strong></span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 68px;
      right: 24px;
      z-index: 1100;
      width: 340px;
      background-color: #FFFFFF;
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--state-warning);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 14px rgba(30, 36, 48, 0.08);
      overflow: hidden;
      animation: slideIn 200ms ease-out;
    }

    .toast-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background-color: var(--surface-subtle);
      border-bottom: 1px solid var(--border-color);
    }

    .toast-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--state-warning);

      &.danger {
        background-color: var(--state-danger);
      }
    }

    .toast-title {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-primary);
      flex: 1;
    }

    .toast-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;

      &:hover {
        background-color: #E2E5E9;
        color: var(--text-primary);
      }
    }

    .toast-body {
      padding: 12px;
    }

    .toast-msg {
      font-size: 13px;
      color: var(--text-primary);
      line-height: 1.4;
      margin-bottom: 8px;
    }

    .toast-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--text-secondary);
      font-family: var(--font-mono);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
})
export class ToastAlertasComponent implements OnInit, OnDestroy {
  readonly alertasService = inject(AlertasService);

  toastVisible = false;
  currentAlerta: Alerta | null = null;
  private timeoutId?: any;
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.alertasService.alertaNueva$.subscribe((alerta) => {
      this.currentAlerta = alerta;
      this.toastVisible = true;

      if (this.timeoutId) clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => {
        this.cerrar();
      }, 7000);
    });
  }

  toggleAudio(): void {
    this.alertasService.toggleSonido();
  }

  cerrar(): void {
    this.toastVisible = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }
}
