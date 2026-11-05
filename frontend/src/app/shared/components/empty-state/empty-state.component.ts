import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-container">
      <div class="empty-icon-circle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h4 class="empty-title">{{ title }}</h4>
      <p class="empty-description">{{ message }}</p>
      @if (actionText) {
        <button type="button" class="btn btn-primary" (click)="actionClick.emit()">
          {{ actionText }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state-container {
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--surface-card);
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-md);
      margin: 16px 0;
    }

    .empty-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background-color: var(--surface-subtle);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
    }

    .empty-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .empty-description {
      font-size: 13px;
      color: var(--text-secondary);
      max-width: 420px;
      margin-bottom: 18px;
      line-height: 1.4;
    }
  `],
})
export class EmptyStateComponent {
  @Input() title = 'No se encontraron registros';
  @Input() message = 'Aún no registraste información en esta sección.';
  @Input() actionText = '';

  @Output() actionClick = new EventEmitter<void>();
}
