import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../core/services/seo.service';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';

@Component({
  selector: 'pa-contact',
  standalone: true,
  imports: [CommonModule, BtnComponent, HairlineRuleComponent],
  template: `
    <section class="contact-hero section section--dark">
      <div class="container">
        <span class="eyebrow">Contact</span>
        <h1>Get in Touch</h1>
        <p>Questions about the book, bulk orders, speaking enquiries, or corrections - use the form below.</p>
      </div>
    </section>

    <section class="contact-body section section--dark">
      <div class="container">
        <div class="contact-body__grid">

          <!-- Form -->
          <div class="contact-form-wrap">
            @if (!submitted()) {
              <form
                class="contact-form"
                action="https://formspree.io/f/YOUR_FORM_ID"
                method="POST"
                (submit)="onSubmit($event)"
              >
                <div class="contact-form__field">
                  <label class="contact-form__label" for="contact-name">Name</label>
                  <input id="contact-name" type="text" name="name" class="contact-form__input" required placeholder="Your name" />
                </div>
                <div class="contact-form__field">
                  <label class="contact-form__label" for="contact-email">Email</label>
                  <input id="contact-email" type="email" name="email" class="contact-form__input" required placeholder="your@email.com" />
                </div>
                <div class="contact-form__field">
                  <label class="contact-form__label" for="contact-subject">Subject</label>
                  <select id="contact-subject" name="subject" class="contact-form__input contact-form__input--select">
                    @for (s of subjects; track s) { <option [value]="s">{{s}}</option> }
                  </select>
                </div>
                <div class="contact-form__field">
                  <label class="contact-form__label" for="contact-message">Message</label>
                  <textarea id="contact-message" name="message" class="contact-form__textarea" rows="5" required placeholder="Your message…"></textarea>
                </div>
                <pa-btn variant="primary" type="submit" [fullWidth]="true">Send Message</pa-btn>
              </form>
            } @else {
              <div class="contact-success">
                <span class="contact-success__icon">✓</span>
                <h3>Message sent!</h3>
                <p>Thank you. I'll respond as quickly as possible - usually within 2–3 business days.</p>
              </div>
            }
          </div>

          <!-- Contact info -->
          <div class="contact-info">
            <h3>Other ways to connect</h3>
            <pa-rule></pa-rule>
            <div class="contact-info__items">
              @for (item of contactItems; track item.label) {
                <div class="contact-info__item">
                  <span class="contact-info__icon" aria-hidden="true">{{item.icon}}</span>
                  <div>
                    <strong>{{item.label}}</strong>
                    <p>{{item.desc}}</p>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;
    .contact-hero { padding-block: var(--space-16) var(--space-8); h1 { margin-bottom: var(--space-3); } p { color: rgba(244,239,230,0.7); } }
    .contact-body { padding-block: var(--space-4) var(--space-16); }
    .contact-body__grid { display: grid; gap: var(--space-12); @include bp(lg) { grid-template-columns: 2fr 1fr; } }
    .contact-form { display: flex; flex-direction: column; gap: var(--space-5); }
    .contact-form__field { display: flex; flex-direction: column; gap: var(--space-2); }
    .contact-form__label { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-gold); }
    .contact-form__input, .contact-form__textarea { padding: 0.65rem 1rem; background: var(--color-surface-1); border: 1px solid rgba(201,169,97,0.2); border-radius: var(--border-radius); color: var(--color-ivory); font-family: $font-body; font-size: var(--text-sm); transition: border-color var(--duration); &:focus { outline: none; border-color: var(--color-gold); } &::placeholder { color: var(--color-text-muted); } }
    .contact-form__input--select { appearance: none; cursor: pointer; option { background: var(--color-surface-2); color: var(--color-ivory); } }
    .contact-form__textarea { resize: vertical; }
    .contact-success { text-align: center; padding: var(--space-12); }
    .contact-success__icon { display: block; font-size: 3rem; color: var(--color-gold); margin-bottom: var(--space-4); }
    .contact-success h3 { margin-bottom: var(--space-3); }
    .contact-success p { color: rgba(244,239,230,0.7); margin-inline: auto; }
    .contact-info { h3 { margin-bottom: var(--space-3); } }
    .contact-info__items { display: flex; flex-direction: column; gap: var(--space-5); margin-top: var(--space-5); }
    .contact-info__item { display: flex; gap: var(--space-3); align-items: flex-start; }
    .contact-info__icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 2px; }
    .contact-info__item strong { display: block; font-size: var(--text-sm); color: var(--color-ivory); margin-bottom: var(--space-1); }
    .contact-info__item p { font-size: var(--text-sm); color: rgba(244,239,230,0.65); max-width: none; }
  `]
})
export class ContactComponent implements OnInit {
  private seo = inject(SeoService);
  submitted = signal(false);
  subjects = ['General Enquiry', 'Correction / Errata', 'Bulk / Institution Order', 'Speaking / Workshop', 'Media Enquiry', 'Other'];
  contactItems = [
    { icon: '📚', label: 'Bulk Orders', desc: 'For institutional purchases of 10+ copies - please use the contact form for a discussion.' },
    { icon: '🎤', label: 'Speaking & Workshops', desc: 'Available for IP workshops, law school sessions, and practitioner CPD programmes.' },
    { icon: '✏️', label: 'Corrections & Errata', desc: 'If you have found a factual error in the book, please use the form and it will be reviewed and added to the companion website.' },
  ];
  ngOnInit(): void {
    this.seo.update({ title: 'Contact', description: 'Contact Shubham Sanjay Banne - author of The Patent Architect.' });
  }
  onSubmit(e: Event): void {
    // Formspree handles submission; this marks success for client UX
    this.submitted.set(true);
  }
}
