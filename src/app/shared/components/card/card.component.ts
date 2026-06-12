import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { isTouchDevice, prefersReducedMotion } from '../../motion';

export type CardVariant = 'navy' | 'surface' | 'ivory' | 'outlined';

@Component({
  selector: 'pa-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #card class="pa-card pa-card--{{variant}}" [class.pa-card--hover]="hoverable">
      @if (label) {
        <span class="pa-card__label">{{label}}</span>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .pa-card {
      position: relative;
      padding: var(--space-6);
      border-radius: var(--border-radius-md);
      transition: transform var(--duration) var(--ease-out),
                  box-shadow var(--duration) var(--ease-out),
                  border-color var(--duration) var(--ease-out);

      // Gradient hairline border: the card background paints the padding-box
      // and a gold-to-transparent gradient paints the border-box, giving a
      // lit top-left edge that reads as premium against the navy canvas.
      &--navy {
        border: 1px solid transparent;
        background:
          linear-gradient(var(--color-navy), var(--color-navy)) padding-box,
          linear-gradient(150deg, rgba(201,169,97,0.5), rgba(201,169,97,0.1) 45%, rgba(244,239,230,0.06)) border-box;
        box-shadow: var(--shadow-card);
      }
      &--surface {
        border: 1px solid transparent;
        background:
          linear-gradient(rgba(34,39,74,0.92), rgba(34,39,74,0.92)) padding-box,
          linear-gradient(150deg, rgba(201,169,97,0.5), rgba(201,169,97,0.1) 45%, rgba(244,239,230,0.06)) border-box;
        box-shadow: var(--shadow-card);
      }
      // "ivory" stays in the navy family (all screens keep the navy canvas);
      // it now reads as the brightest elevation tier.
      &--ivory {
        border: 1px solid transparent;
        background:
          linear-gradient(var(--color-surface-2), var(--color-surface-2)) padding-box,
          linear-gradient(150deg, rgba(201,169,97,0.55), rgba(201,169,97,0.12) 45%, rgba(244,239,230,0.08)) border-box;
        color: var(--color-ivory);
        box-shadow: var(--shadow-card);
      }
      &--outlined {
        background: transparent;
        border: 1px solid rgba(201,169,97,0.3);
      }

      // Pointer-tracking spotlight. --mx/--my are set from a zone-free
      // pointermove listener; the overlay never intercepts events.
      &--hover::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        opacity: 0;
        transition: opacity 350ms var(--ease-out);
        background: radial-gradient(
          480px circle at var(--mx, 50%) var(--my, 50%),
          rgba(201, 169, 97, 0.1),
          transparent 65%
        );
      }

      &--hover {
        cursor: pointer;
        &:hover {
          transform: translateY(-4px);
          border-color: rgba(201,169,97,0.4);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 24px rgba(201,169,97,0.08);

          &::after { opacity: 1; }
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

    @media (prefers-reduced-motion: reduce) {
      .pa-card--hover:hover { transform: none; }
    }
  `]
})
export class CardComponent implements AfterViewInit, OnDestroy {
  @Input() variant: CardVariant = 'surface';
  @Input() hoverable = false;
  @Input() label?: string;

  @ViewChild('card') private cardRef?: ElementRef<HTMLElement>;
  private zone = inject(NgZone);
  private detach?: () => void;

  ngAfterViewInit(): void {
    if (!this.hoverable || prefersReducedMotion() || isTouchDevice()) return;
    const node = this.cardRef?.nativeElement;
    if (!node) return;

    this.zone.runOutsideAngular(() => {
      const onMove = (ev: PointerEvent) => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--mx', `${ev.clientX - rect.left}px`);
        node.style.setProperty('--my', `${ev.clientY - rect.top}px`);
      };
      node.addEventListener('pointermove', onMove, { passive: true });
      this.detach = () => node.removeEventListener('pointermove', onMove);
    });
  }

  ngOnDestroy(): void {
    this.detach?.();
  }
}
