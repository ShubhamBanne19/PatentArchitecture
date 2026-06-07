import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type BtnSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'pa-btn',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (href) {
      <a
        [href]="href"
        [target]="external ? '_blank' : '_self'"
        [rel]="external ? 'noopener noreferrer' : undefined"
        class="pa-btn pa-btn--{{variant}} pa-btn--{{size}}"
        [class.pa-btn--full]="fullWidth"
      >
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </a>
    } @else if (routerLink) {
      <a
        [routerLink]="routerLink"
        class="pa-btn pa-btn--{{variant}} pa-btn--{{size}}"
        [class.pa-btn--full]="fullWidth"
      >
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </a>
    } @else {
      <button
        class="pa-btn pa-btn--{{variant}} pa-btn--{{size}}"
        [class.pa-btn--full]="fullWidth"
        [type]="type"
        [disabled]="disabled"
        (click)="clicked.emit($event)"
      >
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </button>
    }

    <ng-template #content>
      @if (iconLeft) {
        <span class="pa-btn__icon pa-btn__icon--left">{{iconLeft}}</span>
      }
      <span class="pa-btn__label"><ng-content></ng-content></span>
      @if (iconRight) {
        <span class="pa-btn__icon pa-btn__icon--right">{{iconRight}}</span>
      }
    </ng-template>
  `,
  styles: [`
    .pa-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-body);
      font-weight: 600;
      letter-spacing: 0.04em;
      text-decoration: none;
      border-radius: var(--border-radius);
      transition: all var(--duration) var(--ease-out);
      cursor: pointer;
      white-space: nowrap;
      border: 2px solid transparent;
      outline: none;

      &:focus-visible {
        outline: 2px solid var(--color-gold);
        outline-offset: 3px;
      }

      // Sizes
      &--sm  { padding: 0.4rem 1rem;    font-size: var(--text-sm); }
      &--md  { padding: 0.65rem 1.5rem; font-size: var(--text-sm); }
      &--lg  { padding: 0.875rem 2rem;  font-size: var(--text-base); }

      &--full { width: 100%; justify-content: center; }

      // Variants
      &--primary {
        background: var(--color-gold);
        color: var(--color-navy);
        border-color: var(--color-gold);

        &:hover:not(:disabled) {
          background: var(--color-gold-light);
          border-color: var(--color-gold-light);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(201,169,97,0.35);
        }
        &:active:not(:disabled) {
          background: var(--color-gold-dark);
          transform: translateY(0);
        }
      }

      &--secondary {
        background: var(--color-surface-1);
        color: var(--color-ivory);
        border-color: var(--color-surface-2);

        &:hover:not(:disabled) {
          background: var(--color-surface-2);
          border-color: var(--color-gold);
        }
      }

      &--outline {
        background: transparent;
        color: var(--color-gold);
        border-color: var(--color-gold);

        &:hover:not(:disabled) {
          background: rgba(201,169,97,0.1);
          transform: translateY(-1px);
        }
      }

      &--ghost {
        background: transparent;
        color: var(--color-ivory);
        border-color: transparent;

        &:hover:not(:disabled) {
          color: var(--color-gold);
          background: rgba(201,169,97,0.06);
        }
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      &__icon {
        display: inline-flex;
        align-items: center;
        font-size: 1.1em;
      }
    }
  `]
})
export class BtnComponent {
  @Input() variant: BtnVariant = 'primary';
  @Input() size: BtnSize = 'md';
  @Input() href?: string;
  @Input() routerLink?: string | string[];
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() external = false;
  @Input() iconLeft?: string;
  @Input() iconRight?: string;
  @Output() clicked = new EventEmitter<MouseEvent>();
}
