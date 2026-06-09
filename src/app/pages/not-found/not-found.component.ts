import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BtnComponent } from '../../shared/components/btn/btn.component';

@Component({
  selector: 'pa-not-found',
  standalone: true,
  imports: [RouterModule, BtnComponent],
  template: `
    <section class="not-found section section--dark">
      <div class="container">
        <span class="not-found__hex" aria-hidden="true">⬡</span>
        <h1>404 — Page Not Found</h1>
        <p>This page doesn't exist or has been moved.</p>
        <div class="not-found__actions">
          <pa-btn variant="primary" routerLink="/">Back to Home</pa-btn>
          <pa-btn variant="outline" routerLink="/companion">Companion Hub</pa-btn>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .not-found {
      padding-block: var(--space-20);
      text-align: center;
      min-height: 60vh;
      display: flex;
      align-items: center;
      .container { display: flex; flex-direction: column; align-items: center; gap: var(--space-5); }
    }
    .not-found__hex { font-size: 4rem; color: var(--color-gold); }
    h1 { font-size: clamp(1.75rem, 4vw, 3rem); margin: 0; }
    p { color: rgba(244,239,230,0.65); margin: 0; }
    .not-found__actions { display: flex; gap: var(--space-4); flex-wrap: wrap; justify-content: center; }
  `]
})
export class NotFoundComponent {}
