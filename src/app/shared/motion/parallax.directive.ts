import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { prefersReducedMotion } from './motion.utils';

/**
 * Subtle scroll parallax (transform-only, never affects layout).
 *
 * Usage:
 *   <div paParallax></div>                  default speed 0.12
 *   <div paParallax [paParallaxSpeed]="-0.08"></div>  reverse drift
 *
 * Positive speed: element drifts up slower than scroll (appears deeper).
 * Disabled for reduced-motion users; scroll listener is passive and runs
 * outside the Angular zone with rAF batching.
 */
@Directive({
  selector: '[paParallax]',
  standalone: true,
})
export class ParallaxDirective implements OnInit, OnDestroy {
  @Input() paParallaxSpeed = 0.12;
  /** Max displacement in px, to keep the drift tasteful. */
  @Input() paParallaxClamp = 60;

  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private rafId = 0;
  private active = false;
  private onScroll = () => {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.update());
  };

  ngOnInit(): void {
    if (prefersReducedMotion() || typeof window === 'undefined') return;
    this.active = true;

    const node = this.el.nativeElement;
    node.style.willChange = 'transform';

    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onScroll, { passive: true });
      this.update();
    });
  }

  private update(): void {
    const node = this.el.nativeElement;
    const rect = node.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < -200 || rect.top > vh + 200) return; // offscreen

    // Progress of the element's centre through the viewport: -1 .. 1
    const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
    const raw = progress * this.paParallaxSpeed * vh * 0.5;
    const offset = Math.max(-this.paParallaxClamp, Math.min(this.paParallaxClamp, raw));
    node.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  }

  ngOnDestroy(): void {
    if (!this.active) return;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
  }
}
