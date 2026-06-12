import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { isTouchDevice, prefersReducedMotion } from './motion.utils';

/**
 * Magnetic pull: the element eases toward the pointer while hovered and
 * springs back on leave. Applied to CTAs for a premium tactile feel.
 *
 * Usage: <pa-btn paMagnetic ...> or any element.
 *
 * Strength is the max displacement in px. Disabled on touch devices and
 * for reduced-motion users; listeners run outside the Angular zone.
 */
@Directive({
  selector: '[paMagnetic]',
  standalone: true,
})
export class MagneticDirective implements OnInit, OnDestroy {
  @Input() paMagneticStrength = 8;

  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private rafId = 0;
  private detach: Array<() => void> = [];

  ngOnInit(): void {
    if (prefersReducedMotion() || isTouchDevice()) return;
    const node = this.el.nativeElement;
    node.style.display = node.style.display || 'inline-block';
    node.style.willChange = 'transform';

    this.zone.runOutsideAngular(() => {
      const onMove = (ev: PointerEvent) => {
        cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => {
          const rect = node.getBoundingClientRect();
          const dx = (ev.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          const dy = (ev.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
          const s = this.paMagneticStrength;
          node.style.transform = `translate(${(dx * s).toFixed(1)}px, ${(dy * s).toFixed(1)}px)`;
        });
      };
      const onLeave = () => {
        cancelAnimationFrame(this.rafId);
        node.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)';
        node.style.transform = 'translate(0, 0)';
        window.setTimeout(() => (node.style.transition = ''), 440);
      };

      node.addEventListener('pointermove', onMove, { passive: true });
      node.addEventListener('pointerleave', onLeave, { passive: true });
      this.detach.push(
        () => node.removeEventListener('pointermove', onMove),
        () => node.removeEventListener('pointerleave', onLeave)
      );
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    this.detach.forEach(fn => fn());
  }
}
