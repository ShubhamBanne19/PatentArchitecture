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
 * Scroll-triggered reveal animation.
 *
 * Usage:
 *   <div paReveal></div>                    fade-up on enter
 *   <div paReveal="fade"></div>             plain fade
 *   <div paReveal paRevealDelay="120"></div> staggered (ms)
 *
 * Purely presentational: content is always in the DOM and accessible.
 * Falls back to instantly-visible when IntersectionObserver is missing
 * or the user prefers reduced motion. Runs outside the Angular zone so
 * it never triggers change detection.
 */
@Directive({
  selector: '[paReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  /** Animation style: 'up' (default) | 'fade' | 'left' | 'right' | 'scale' */
  @Input('paReveal') variant: string = '';
  /** Delay in ms before the reveal plays (for stagger effects). */
  @Input() paRevealDelay: string | number = 0;

  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private renderer = inject(Renderer2);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      // No animation: element stays fully visible, nothing to clean up.
      return;
    }

    const variant = this.variant || 'up';
    this.renderer.addClass(node, 'pa-reveal');
    this.renderer.addClass(node, `pa-reveal--${variant}`);
    const delay = Number(this.paRevealDelay) || 0;
    if (delay > 0) {
      this.renderer.setStyle(node, 'transition-delay', `${delay}ms`);
    }

    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.renderer.addClass(node, 'pa-reveal--in');
              this.observer?.unobserve(node);
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      );
      this.observer.observe(node);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
