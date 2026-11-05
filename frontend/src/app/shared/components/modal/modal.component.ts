import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div
          class="modal-panel"
          [class.modal-drawer]="mode === 'drawer'"
          [class.modal-dialog]="mode === 'dialog'"
          [style.max-width]="maxWidth"
          role="dialog"
          aria-modal="true"
        >
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ title }}</h3>
              @if (subtitle) {
                <p class="modal-subtitle">{{ subtitle }}</p>
              }
            </div>
            <button type="button" class="btn-close" (click)="close()" aria-label="Cerrar ventana">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <ng-content select="[modal-body]"></ng-content>
          </div>

          <div class="modal-footer">
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(30, 36, 48, 0.4);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 150ms ease-out;
    }

    .modal-panel {
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 24px rgba(30, 36, 48, 0.12);
    }

    /* Modal Diálogo Centrado */
    .modal-dialog {
      width: 92%;
      max-height: 90vh;
      border-radius: var(--radius-md);
      animation: zoomIn 180ms ease-out;
    }

    /* Drawer Lateral */
    .modal-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      height: 100vh;
      width: 100%;
      border-radius: 0;
      border-left: 1px solid var(--border-color);
      animation: slideDrawer 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: 16px 20px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--surface-subtle);
    }

    .modal-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .modal-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 15px;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      line-height: 1;

      &:hover {
        background-color: var(--border-color);
        color: var(--text-primary);
      }
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--border-color);
      background-color: #FAFAFA;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes slideDrawer {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `],
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() mode: 'dialog' | 'drawer' = 'drawer';
  @Input() maxWidth = '560px';

  @Output() closeEvent = new EventEmitter<void>();

  @HostListener('window:keydown.escape')
  handleEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  close(): void {
    this.closeEvent.emit();
  }
}
