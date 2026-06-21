import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
} from '@angular/core';
import { prefersReducedMotion } from './motion.utils';

/**
 * Cinematic looping open/close for the 3D book.
 *
 * While the host is in view it runs a gentle loop: toggles the `is-open`
 * class so the cover + pages flip open (CSS handles the staggered turn),
 * holds on the readable spread, then closes back over to the blue cover and
 * holds — forever, until scrolled out of view (then it rests closed).
 *
 * Reduced-motion / no-IntersectionObserver: opens once, statically, with no
 * animation so the content is still presented. Timers run outside the Angular
 * zone so the loop never triggers change detection.
 */
@Directive({
  selector: '[paBookOpen]',
  standalone: true,
})
export class BookOpenDirective implements OnInit, OnDestroy {
  /** Delay in ms after entering view before the first open. */
  @Input() paBookOpenDelay: string | number = 550;
  /** How long to hold the open spread (ms) — includes the flip-open time. */
  @Input() paBookOpenHold: string | number = 4800;
  /** How long to rest on the closed blue cover (ms) — includes the close time. */
  @Input() paBookClosedHold: string | number = 3000;

  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private renderer = inject(Renderer2);
  private observer?: IntersectionObserver;
  private timer = 0;
  private running = false;

  ngOnInit(): void {
    const node = this.el.nativeElement;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      this.renderer.addClass(node, 'is-open'); // static, readable, no animation
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) this.start();
            else this.stop();
          }
        },
        { threshold: 0.3 }
      );
      this.observer.observe(node);
    });
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    this.timer = window.setTimeout(() => this.open(), Number(this.paBookOpenDelay) || 0);
  }

  private open(): void {
    if (!this.running) return;
    this.renderer.addClass(this.el.nativeElement, 'is-open');
    this.timer = window.setTimeout(() => this.close(), Number(this.paBookOpenHold) || 0);
  }

  private close(): void {
    if (!this.running) return;
    this.renderer.removeClass(this.el.nativeElement, 'is-open');
    this.timer = window.setTimeout(() => this.open(), Number(this.paBookClosedHold) || 0);
  }

  private stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = 0;
    }
    this.renderer.removeClass(this.el.nativeElement, 'is-open'); // rest on the blue cover
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.stop();
  }
}
