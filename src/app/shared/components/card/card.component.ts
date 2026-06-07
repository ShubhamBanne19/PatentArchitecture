import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'navy' | 'surface' | 'ivory' | 'outlined';

@Component({
  selector: 'pa-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pa-card pa-card--{{variant}}" [class.pa-card--hover]="hoverable">
      @if (label) {
        <span class="pa-card__label">{{label}}</span>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .pa-card {
      padding: var(--space-6);
      border-radius: var(--border-radius-md);
      transition: transform var(--duration) var(--ease-out),
                  box-shadow var(--duration) var(--ease-out);

      &--navy {
        background: var(--color-navy);
        border: 1px solid rgba(201,169,97,0.15);
        box-shadow: var(--shadow-card);
      }
      &--surface {
        background: var(--color-surface-1);
        border: 1px solid rgba(201,169,97,0.15);
        box-shadow: var(--shadow-card);
      }
      &--ivory {
        background: var(--color-ivory);
        border: 1px solid var(--color-ivory-dim);
        color: var(--color-text-dark);
        box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      }
      &--outlined {
        background: transparent;
        border: 1px solid rgba(201,169,97,0.3);
      }

      &--hover {
        cursor: pointer;
        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,169,97,0.3);
        }
      }

      &__label {
        display: block;
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--color-gold);
        margin-bottom: var(--space-3);
      }
    }
  `]
})
export class CardComponent {
  @Input() variant: CardVariant = 'surface';
  @Input() hoverable = false;
  @Input() label?: string;
}
