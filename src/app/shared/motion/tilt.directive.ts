import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { clamp, isTouchDevice, prefersReducedMotion } from './motion.utils';

/**
 * Pointer-tracking 3D tilt with a moving specular highlight.
 *
 * Usage:
 *   <div paTilt></div>
 *   <div paTilt [paTiltMax]="10"></div>
 *
 * Exposes CSS custom properties on the host so stylesheets can derive
 * extra effects (e.g. glare position): --tilt-x, --tilt-y, --pointer-x,
 * --pointer-y (pointer coords as 0..1 fractions of the element box).
 *
 * Disabled on touch devices and for reduced-motion users. Listeners are
 * registered outside the Angular zone; transforms are rAF-throttled.
 */
@Directive({
  selector: '[paTilt]',
  standalone: true,
})
export class TiltDirective implements OnInit, OnDestroy {
  /** Maximum tilt in degrees. */
  @Input() paTiltMax = 7;
  /** Scale applied while hovered. */
  @Input() paTiltScale = 1.02;

  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private rafId = 0;
  private enabled = false;
  private removeListeners: Array<() => void> = [];

  ngOnInit(): void {
    if (prefersReducedMotion() || isTouchDevice()) return;
    this.enabled = true;

    const node = this.el.nativeElement;
    node.style.willChange = 'transform';
    node.style.transformStyle = 'preserve-3d';

    this.zone.runOutsideAngular(() => {
      const onMove = (ev: PointerEvent) => {
        cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => {
          const rect = node.getBoundingClientRect();
          const px = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
          const py = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
          const tiltX = (0.5 - py) * this.paTiltMax * 2; // rotateX
          const tiltY = (px - 0.5) * this.paTiltMax * 2; // rotateY
          node.style.setProperty('--pointer-x', px.toFixed(3));
          node.style.setProperty('--pointer-y', py.toFixed(3));
          node.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
          node.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
          node.style.transform =
            `perspective(900px) rotateX(${tiltX.toFixed(2)}deg) ` +
            `rotateY(${tiltY.toFixed(2)}deg) scale(${this.paTiltScale})`;
        });
      };

      const onLeave = () => {
        cancelAnimationFrame(this.rafId);
        node.style.transition = 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)';
        node.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
        window.setTimeout(() => (node.style.transition = ''), 500);
      };

      const onEnter = () => {
        node.style.transition = '';
      };

      node.addEventListener('pointermove', onMove, { passive: true });
      node.addEventListener('pointerleave', onLeave, { passive: true });
      node.addEventListener('pointerenter', onEnter, { passive: true });
      this.removeListeners.push(
        () => node.removeEventListener('pointermove', onMove),
        () => node.removeEventListener('pointerleave', onLeave),
        () => node.removeEventListener('pointerenter', onEnter)
      );
    });
  }

  ngOnDestroy(): void {
    if (!this.enabled) return;
    cancelAnimationFrame(this.rafId);
    this.removeListeners.forEach(fn => fn());
  }
}
