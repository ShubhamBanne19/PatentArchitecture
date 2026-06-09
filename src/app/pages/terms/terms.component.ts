import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BtnComponent } from '../../shared/components/btn/btn.component';

@Component({
  selector: 'pa-terms',
  standalone: true,
  imports: [RouterModule, BtnComponent],
  template: `
    <section class="legal-hero section section--dark">
      <div class="container">
        <span class="eyebrow">Legal</span>
        <h1>Terms of Use</h1>
        <p class="legal-hero__sub">Effective date: June 2026</p>
      </div>
    </section>
    <section class="legal-body section section--surface">
      <div class="container">
        <div class="prose-legal">
          <h2>Use of this website</h2>
          <p>This website is provided for informational purposes relating to the book <em>The Patent Architect</em> by Shubham Sanjay Banne. You may browse, link to, and share content freely with attribution.</p>
          <h2>Intellectual property</h2>
          <p>All book text, figures, and original website content are copyright &copy; Shubham Sanjay Banne. The AI prompt library content may be used for personal and professional patent work. Republication or resale of prompts in bulk form requires written permission.</p>
          <h2>No legal advice</h2>
          <p>Nothing on this website constitutes legal advice. Fee schedules, procedural information, and companion content are provided for educational and reference purposes only. Always verify current fees and procedural requirements with the relevant patent office before filing.</p>
          <h2>Accuracy of information</h2>
          <p>Fee schedules and procedural information on this site are updated periodically but may not reflect the most recent changes. Patent office fee schedules should always be verified at the official office website before filing. See the companion hub for verification notes on each schedule.</p>
          <h2>Contact</h2>
          <p>For licensing or permissions questions, use the <a routerLink="/contact">contact page</a>.</p>
          <pa-btn variant="outline" routerLink="/contact">Contact Us</pa-btn>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .legal-hero { padding-block: var(--space-12) var(--space-8); }
    .legal-hero__sub { color: var(--color-silver); margin-top: 0; }
    .legal-body { padding-block: var(--space-10) var(--space-16); }
    .prose-legal {
      max-width: 680px;
      h2 { font-family: var(--font-display); font-size: var(--text-xl); color: var(--color-text-dark); margin-block: var(--space-8) var(--space-3); }
      p { color: var(--color-text-mid); line-height: 1.8; margin-bottom: var(--space-4); }
      a { color: var(--color-gold); }
    }
  `]
})
export class TermsComponent {}
