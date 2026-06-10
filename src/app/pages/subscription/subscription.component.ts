import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { SeoService } from '../../core/services/seo.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { SubscriptionTier } from '../../core/models/subscription.models';

type PaidTier = Exclude<SubscriptionTier, 'free'>;

@Component({
  selector: 'pa-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, HairlineRuleComponent, TitleCasePipe],
  template: `
    <section class="sub-hero section section--dark">
      <div class="container">
        <span class="eyebrow">My Subscription</span>
        <h1>Manage access.</h1>
        <p>Razorpay is the billing source of truth. Firestore access updates after the verified webhook is received.</p>
      </div>
    </section>

    <pa-rule></pa-rule>

    <section class="subscription section section--dark">
      <div class="container">
        @if (auth.profile(); as profile) {
          <div class="subscription__layout">
            <article class="status">
              <span class="status__label">Current Plan</span>
              <h2>{{profile.subscription.tier | titlecase}}</h2>
              <p>Status: {{profile.subscription.status | titlecase}}</p>
              @if (profile.subscription.razorpaySubscriptionId) {
                <p class="status__id">Razorpay ID: {{profile.subscription.razorpaySubscriptionId}}</p>
              }
              <div class="status__actions">
                <pa-btn variant="outline" (clicked)="refresh()" [disabled]="processing()">Refresh Status</pa-btn>
                @if (profile.subscription.razorpaySubscriptionId && profile.subscription.status !== 'cancelled') {
                  <pa-btn variant="ghost" (clicked)="cancel()" [disabled]="processing()">Cancel Subscription</pa-btn>
                }
              </div>
            </article>

            <div class="plans">
              @for (plan of paidPlans; track plan.tier) {
                <article class="plan" [class.plan--selected]="selectedPlan() === plan.tier">
                  <h3>{{plan.name}}</h3>
                  <p>{{plan.description}}</p>
                  <strong>₹{{plan.price}}/month</strong>
                  <ul>
                    @for (feature of plan.features; track feature) {
                      <li>{{feature}}</li>
                    }
                  </ul>
                  <pa-btn
                    [variant]="plan.tier === 'premium' ? 'primary' : 'outline'"
                    [fullWidth]="true"
                    (clicked)="subscribe(plan.tier)"
                    [disabled]="processing()"
                  >
                    {{processing() && selectedPlan() === plan.tier ? 'Opening Checkout...' : 'Subscribe to ' + plan.name}}
                  </pa-btn>
                </article>
              }
            </div>
          </div>

          @if (message()) {
            <p class="subscription__notice">{{message()}}</p>
          }
          @if (error()) {
            <p class="subscription__error">{{error()}}</p>
          }
        }
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;

    .sub-hero { padding-block: var(--space-16) var(--space-8); h1 { margin-bottom: var(--space-4); } p { color: rgba(244,239,230,0.74); } }
    .subscription { padding-block: var(--space-10) var(--space-20); }
    .subscription__layout { display: grid; gap: var(--space-6); @include bp(lg) { grid-template-columns: 0.9fr 1.4fr; align-items: start; } }

    .status,
    .plan {
      padding: var(--space-6);
      background: var(--color-surface-1);
      border: 1px solid rgba(201,169,97,0.18);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-card);
    }

    .status { display: grid; gap: var(--space-4); h2 { font-size: var(--text-2xl); } p { max-width: none; color: rgba(244,239,230,0.72); } }
    .status__label { color: var(--color-gold); font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
    .status__id { font-family: $font-mono; font-size: var(--text-xs); overflow-wrap: anywhere; }
    .status__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

    .plans { display: grid; gap: var(--space-5); @include bp(md) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .plan { display: flex; flex-direction: column; gap: var(--space-4); &--selected { border-color: var(--color-gold); } h3 { font-size: var(--text-xl); } p { color: rgba(244,239,230,0.72); } strong { color: var(--color-gold); font-size: var(--text-xl); } }
    .plan ul { display: grid; gap: var(--space-2); margin-bottom: auto; li { color: rgba(244,239,230,0.78); font-size: var(--text-sm); } }

    .subscription__notice,
    .subscription__error {
      margin-top: var(--space-6);
      padding: var(--space-4);
      border-radius: var(--border-radius);
      max-width: none;
    }

    .subscription__notice { background: rgba(201,169,97,0.12); border: 1px solid rgba(201,169,97,0.24); }
    .subscription__error { color: #ffd7d7; background: rgba(160,40,40,0.22); border: 1px solid rgba(255,120,120,0.24); }
  `]
})
export class SubscriptionComponent implements OnInit {
  readonly auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  private subscriptions = inject(SubscriptionService);

  readonly selectedPlan = signal<PaidTier | null>(null);
  readonly processing = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly paidPlans = this.subscriptions.plans.filter((plan): plan is typeof plan & { tier: PaidTier } => plan.tier !== 'free');

  ngOnInit(): void {
    this.seo.update({ title: 'My Subscription', description: 'Manage The Patent Architect premium companion subscription.' });

    const plan = this.route.snapshot.queryParamMap.get('plan');
    if (plan === 'basic' || plan === 'premium') {
      this.selectedPlan.set(plan);
    }
  }

  async subscribe(tier: PaidTier): Promise<void> {
    this.selectedPlan.set(tier);
    this.processing.set(true);
    this.error.set('');
    this.message.set('');

    try {
      await this.subscriptions.startCheckout(tier);
      this.message.set('Checkout opened. Your access updates automatically after Razorpay confirms the subscription webhook.');
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.processing.set(false);
    }
  }

  async cancel(): Promise<void> {
    this.processing.set(true);
    this.error.set('');
    try {
      await this.subscriptions.cancelSubscription();
      this.message.set('Cancellation request sent. Razorpay webhook will finalize the subscription state.');
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.processing.set(false);
    }
  }

  async refresh(): Promise<void> {
    this.processing.set(true);
    this.error.set('');
    try {
      await this.subscriptions.refreshSubscriptionStatus();
      this.message.set('Subscription status refreshed.');
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.processing.set(false);
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Subscription request failed. Please try again.';
  }
}
