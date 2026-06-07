import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../core/services/seo.service';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';

@Component({
  selector: 'pa-newsletter',
  standalone: true,
  imports: [CommonModule, BtnComponent, HairlineRuleComponent, BlueprintGridComponent],
  template: `
    <pa-blueprint-grid opacity="0.05">
      <section class="nl-hero section section--dark">
        <div class="container">
          <div class="nl-hero__inner">
            <span class="eyebrow">Newsletter</span>
            <h1>Stay Current with IP Practice</h1>
            <pa-rule class="gold-rule--center"></pa-rule>
            <p class="nl-hero__desc">
              Occasional updates when significant changes happen - fee revisions,
              major case law, new AI tool developments, or new prompts in the library.
              No noise. No marketing. Just the signal.
            </p>

            <!-- Formspree / Buttondown embed -->
            <div class="nl-form-wrap">
              <form class="nl-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
                <div class="nl-form__row">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    class="nl-form__input"
                    required
                    aria-label="Your name"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    class="nl-form__input nl-form__input--email"
                    required
                    aria-label="Email address"
                  />
                </div>
                <div class="nl-form__role">
                  <label class="nl-form__label">I am a:</label>
                  <div class="nl-form__options">
                    @for (role of roles; track role) {
                      <label class="nl-form__option">
                        <input type="radio" name="role" [value]="role" />
                        <span>{{role}}</span>
                      </label>
                    }
                  </div>
                </div>
                <pa-btn variant="primary" type="submit" [fullWidth]="true">
                  Subscribe - Free, Unsubscribe Anytime
                </pa-btn>
                <p class="nl-form__note">
                  By subscribing you agree to receive occasional emails about updates to
                  The Patent Architect's companion website. No spam. Unsubscribe at any time.
                </p>
              </form>
            </div>

            <div class="nl-promises">
              @for (p of promises; track p) {
                <div class="nl-promise">
                  <span class="nl-promise__icon" aria-hidden="true">✓</span>
                  <span>{{p}}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </section>
    </pa-blueprint-grid>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;
    .nl-hero { padding-block: var(--space-20); }
    .nl-hero__inner { max-width: 600px; margin-inline: auto; text-align: center; h1 { margin-bottom: var(--space-4); } }
    .nl-hero__desc { font-size: var(--text-lg); color: rgba(244,239,230,0.75); margin-bottom: var(--space-8); }
    .nl-form-wrap { margin-bottom: var(--space-8); }
    .nl-form { display: flex; flex-direction: column; gap: var(--space-4); text-align: left; }
    .nl-form__row { display: grid; gap: var(--space-3); @include bp(sm) { grid-template-columns: 1fr 2fr; } }
    .nl-form__input { padding: 0.65rem 1rem; background: var(--color-surface-1); border: 1px solid rgba(201,169,97,0.2); border-radius: var(--border-radius); color: var(--color-ivory); font-family: $font-body; font-size: var(--text-sm); transition: border-color var(--duration); &:focus { outline: none; border-color: var(--color-gold); } &::placeholder { color: var(--color-text-muted); } }
    .nl-form__label { display: block; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-gold); margin-bottom: var(--space-2); }
    .nl-form__options { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .nl-form__option { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: rgba(244,239,230,0.75); cursor: pointer; input[type=radio] { accent-color: var(--color-gold); } }
    .nl-form__note { font-size: var(--text-xs); color: var(--color-text-muted); text-align: center; margin-top: var(--space-2); max-width: none; }
    .nl-promises { display: flex; flex-direction: column; gap: var(--space-2); }
    .nl-promise { display: flex; align-items: center; gap: var(--space-3); font-size: var(--text-sm); color: rgba(244,239,230,0.7); }
    .nl-promise__icon { color: var(--color-gold); font-weight: 700; }
  `]
})
export class NewsletterComponent implements OnInit {
  private seo = inject(SeoService);
  roles = ['Patent Practitioner', 'Student / Exam Aspirant', 'Inventor / Founder', 'IP Strategist', 'Academic / Researcher'];
  promises = [
    'Updates only when something significant changes',
    'No marketing emails, no third-party promotions',
    'Unsubscribe instantly at any time',
  ];
  ngOnInit(): void {
    this.seo.update({ title: 'Newsletter', description: 'Subscribe for updates when The Patent Architect companion website changes - fee revisions, case law, new prompts.' });
  }
}
