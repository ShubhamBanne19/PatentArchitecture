import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BtnComponent } from '../../shared/components/btn/btn.component';

@Component({
  selector: 'pa-privacy',
  standalone: true,
  imports: [RouterModule, BtnComponent],
  template: `
    <section class="legal-hero section section--dark">
      <div class="container">
        <span class="eyebrow">Legal</span>
        <h1>Privacy Policy</h1>
        <p class="legal-hero__sub">Effective date: June 2026</p>
      </div>
    </section>
    <section class="legal-body section section--surface">
      <div class="container">
        <div class="prose-legal">
          <h2>What we collect</h2>
          <p>This website collects only what you voluntarily submit: your email address if you sign up for the newsletter or request the prompt PDF, and the contact form fields (name, email, message) if you send us a message. No tracking cookies, no analytics beyond server-level access logs.</p>
          <h2>How we use it</h2>
          <p>Email addresses submitted via the newsletter form are used to send you updates about The Patent Architect. Contact form submissions are used solely to respond to your message. We do not sell, rent, or share your data with third parties for marketing purposes.</p>
          <h2>Third-party services</h2>
          <p>This site uses <strong>Formspree</strong> to process form submissions. Formspree's privacy policy governs how they handle data in transit. This site is hosted on <strong>GitHub Pages</strong>, which may record server-level access logs.</p>
          <h2>Your rights</h2>
          <p>You may request deletion of any data we hold about you by emailing us via the <a routerLink="/contact">contact page</a>. We will respond within 30 days.</p>
          <h2>Contact</h2>
          <p>For privacy questions, use the <a routerLink="/contact">contact page</a>.</p>
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
export class PrivacyComponent {}
