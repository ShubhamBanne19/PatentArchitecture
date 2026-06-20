import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { prefersReducedMotion } from './shared/motion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div #progress class="scroll-progress" aria-hidden="true"></div>
    <pa-header></pa-header>
    <main id="main-content">
      <router-outlet></router-outlet>
    </main>
    <pa-footer></pa-footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    main { flex: 1; }

    // Thin gold reading-progress line above the header. Purely decorative.
    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 2px;
      width: 100%;
      z-index: 300;
      pointer-events: none;
      background: linear-gradient(90deg, var(--color-gold-dark), var(--color-gold), var(--color-gold-light));
      transform-origin: left center;
      transform: scaleX(0);
    }
  `]
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('progress') private progressRef?: ElementRef<HTMLElement>;
  private zone = inject(NgZone);
  private detach?: () => void;

  ngAfterViewInit(): void {
    if (prefersReducedMotion() || typeof window === 'undefined') return;
    const bar = this.progressRef?.nativeElement;
    if (!bar) return;

    this.zone.runOutsideAngular(() => {
      let raf = 0;
      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
      };
      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(update);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
      this.detach = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    });
  }

  ngOnDestroy(): void {
    this.detach?.();
  }
}
