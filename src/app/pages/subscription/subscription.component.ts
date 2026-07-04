import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { SeoService } from '../../core/services/seo.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { PaymentMethod } from '../../core/models/subscription.models';
import { supportEmail } from '../../core/config/purchase.config';

@Component({
  selector: 'pa-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BtnComponent, HairlineRuleComponent],
  template: `
    <section class="sub-hero section section--dark">
      <div class="container">
        <span class="eyebrow">Full Access</span>
        <h1>Unlock premium — one time.</h1>
        <p>Pay once using the details below, submit your payment reference, and we grant lifetime access within 24 hours after verifying it.</p>
      </div>
    </section>

    <pa-rule></pa-rule>

    <section class="access section section--dark">
      <div class="container">
        @if (auth.loading()) {
          <p class="access__loading">Checking your access...</p>
        } @else if (auth.isSubscribed()) {
          <article class="card card--ok">
            <span class="card__label">Active</span>
            <h2>You have full access.</h2>
            <p>Every premium companion resource is unlocked on your account.</p>
            <pa-btn variant="primary" routerLink="/premium">Open Premium</pa-btn>
          </article>
        } @else if (request()?.status === 'pending') {
          <article class="card card--pending">
            <span class="card__label">Under review</span>
            <h2>Payment received — verifying.</h2>
            <p>Thanks! We're confirming your payment (reference <strong>{{request()!.reference}}</strong>). Access is granted within 24 hours. You'll see premium unlock here automatically once approved.</p>
            <p class="card__muted">Questions? Email <a [href]="'mailto:' + supportEmail">{{supportEmail}}</a>.</p>
          </article>
        } @else {
          <div class="access__layout">
            <article class="card">
              <span class="card__label">Step 1 · Pay ₹{{product.priceInr}}</span>
              <h2>Send a one-time payment</h2>

              <div class="pay-block">
                <h3>UPI</h3>
                <p class="pay-line"><span>UPI ID</span><strong>{{payment.upiId}}</strong></p>
                @if (payment.upiQrAssetPath) {
                  <img class="pay-qr" [src]="payment.upiQrAssetPath" alt="UPI QR code" />
                }
              </div>

              <div class="pay-block">
                <h3>Bank transfer (NEFT / IMPS)</h3>
                <p class="pay-line"><span>Account name</span><strong>{{payment.bank.accountName}}</strong></p>
                <p class="pay-line"><span>Account no.</span><strong>{{payment.bank.accountNumber}}</strong></p>
                <p class="pay-line"><span>IFSC</span><strong>{{payment.bank.ifsc}}</strong></p>
                <p class="pay-line"><span>Bank</span><strong>{{payment.bank.bankName}}</strong></p>
                <p class="pay-line"><span>Branch</span><strong>{{payment.bank.branch}}</strong></p>
              </div>
            </article>

            <article class="card">
              <span class="card__label">Step 2 · Confirm</span>
              <h2>Tell us about your payment</h2>

              @if (request()?.status === 'rejected') {
                <p class="access__error">We couldn't verify your last submission. Please check the reference and try again, or email <a [href]="'mailto:' + supportEmail">{{supportEmail}}</a>.</p>
              }

              <form class="form" (ngSubmit)="submit()">
                <label class="field">
                  <span>Payment method</span>
                  <select [(ngModel)]="method" name="method" [disabled]="processing()">
                    <option value="upi">UPI</option>
                    <option value="bank">Bank transfer</option>
                  </select>
                </label>

                <label class="field">
                  <span>Payment reference / transaction id</span>
                  <input [(ngModel)]="reference" name="reference" [disabled]="processing()"
                    placeholder="e.g. UPI ref no. or bank UTR" autocomplete="off" />
                </label>

                <label class="field">
                  <span>Note (optional)</span>
                  <textarea [(ngModel)]="note" name="note" rows="2" [disabled]="processing()"
                    placeholder="Anything that helps us match your payment"></textarea>
                </label>

                <pa-btn variant="primary" [fullWidth]="true" [disabled]="processing() || !reference.trim()"
                  (clicked)="submit()">
                  {{processing() ? 'Submitting...' : 'Submit payment for verification'}}
                </pa-btn>
              </form>

              @if (error()) {
                <p class="access__error">{{error()}}</p>
              }
            </article>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;

    .sub-hero { padding-block: var(--space-16) var(--space-8); h1 { margin-bottom: var(--space-4); } p { color: rgba(244,239,230,0.74); } }
    .access { padding-block: var(--space-10) var(--space-20); }
    .access__loading { color: var(--color-silver); max-width: none; }
    .access__layout { display: grid; gap: var(--space-6); @include bp(lg) { grid-template-columns: 1fr 1fr; align-items: start; } }

    .card {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-6);
      background: var(--color-surface-1);
      border: 1px solid rgba(201,169,97,0.18);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-card);

      h2 { font-size: var(--text-2xl); }
      p { color: rgba(244,239,230,0.72); max-width: none; }
    }

    .card--ok { border-color: rgba(120,190,120,0.4); max-width: 42rem; }
    .card--pending { border-color: rgba(201,169,97,0.5); max-width: 42rem; }

    .card__label { color: var(--color-gold); font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
    .card__muted { color: var(--color-silver); font-size: var(--text-sm); a { color: var(--color-gold); } }

    .pay-block {
      padding-top: var(--space-3);
      border-top: 1px solid rgba(201,169,97,0.14);
      h3 { font-size: var(--text-sm); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-silver); margin-bottom: var(--space-2); }
    }

    .pay-line {
      display: flex; justify-content: space-between; gap: var(--space-4);
      padding-block: var(--space-1);
      span { color: rgba(244,239,230,0.6); font-size: var(--text-sm); }
      strong { color: var(--color-ivory); font-family: $font-mono; overflow-wrap: anywhere; text-align: right; }
    }

    .pay-qr { margin-top: var(--space-3); width: 180px; height: 180px; border-radius: var(--border-radius); background: #fff; padding: 8px; }

    .form { display: grid; gap: var(--space-4); }
    .field { display: grid; gap: var(--space-2); span { color: rgba(244,239,230,0.7); font-size: var(--text-sm); } }
    .field input, .field select, .field textarea {
      width: 100%;
      padding: var(--space-3);
      background: var(--color-surface-2, rgba(255,255,255,0.04));
      border: 1px solid rgba(201,169,97,0.24);
      border-radius: var(--border-radius);
      color: var(--color-ivory);
      font: inherit;
      &:focus { outline: none; border-color: var(--color-gold); }
    }

    .access__error {
      margin-top: var(--space-4);
      padding: var(--space-4);
      border-radius: var(--border-radius);
      max-width: none;
      color: #ffd7d7; background: rgba(160,40,40,0.22); border: 1px solid rgba(255,120,120,0.24);
      a { color: #ffd7d7; text-decoration: underline; }
    }
  `]
})
export class SubscriptionComponent implements OnInit {
  readonly auth = inject(AuthService);
  private seo = inject(SeoService);
  private subscriptions = inject(SubscriptionService);

  readonly product = this.subscriptions.product;
  readonly payment = this.subscriptions.payment;
  readonly request = computed(() => this.subscriptions.myRequest());
  readonly supportEmail = supportEmail;

  method: PaymentMethod = 'upi';
  reference = '';
  note = '';

  readonly processing = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.seo.update({ title: 'Get Full Access', description: 'Unlock lifetime access to The Patent Architect premium companion.' });
  }

  async submit(): Promise<void> {
    if (this.processing() || !this.reference.trim()) {
      return;
    }

    this.processing.set(true);
    this.error.set('');

    try {
      await this.subscriptions.submitAccessRequest({
        method: this.method,
        reference: this.reference,
        note: this.note,
      });
      // The live accessRequests snapshot flips myRequest() to 'pending',
      // which swaps this view to the "under review" state automatically.
      this.reference = '';
      this.note = '';
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not submit your payment. Please try again.');
    } finally {
      this.processing.set(false);
    }
  }
}
