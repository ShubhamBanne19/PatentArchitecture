import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { SeoService } from '../../core/services/seo.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { PricingPlan, SubscriptionTier } from '../../core/models/subscription.models';

@Component({
  selector: 'pa-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, HairlineRuleComponent],
  template: `
    <section class="pricing-hero section section--dark">
      <div class="container">
        <span class="eyebrow">Premium Companion</span>
        <h1>Choose your reader access.</h1>
        <p>Keep the public book companion open for every QR scan, and unlock deeper practitioner resources when you need them.</p>
      </div>
    </section>

    <pa-rule></pa-rule>

    <section class="pricing section section--dark">
      <div class="container">
        <div class="pricing__grid">
          @for (plan of plans; track plan.tier) {
            <article class="plan" [class.plan--featured]="plan.tier === 'premium'">
              @if (plan.tier === 'premium') {
                <span class="plan__badge">Best for practitioners</span>
              }
              <h2>{{plan.name}}</h2>
              <p class="plan__description">{{plan.description}}</p>
              <div class="plan__price">
                <span>₹{{plan.price}}</span>
                <small>/{{plan.interval}}</small>
              </div>
              <ul class="plan__features">
                @for (feature of plan.features; track feature) {
                  <li>{{feature}}</li>
                }
              </ul>
              @if (plan.tier === 'free') {
                <pa-btn variant="ghost" routerLink="/companion" [fullWidth]="true">Open Companion</pa-btn>
              } @else {
                <pa-btn
                  [variant]="plan.tier === 'premium' ? 'primary' : 'outline'"
                  [fullWidth]="true"
                  (clicked)="selectPlan(plan.tier)"
                >
                  Start {{plan.name}}
                </pa-btn>
              }
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;

    .pricing-hero {
      padding-block: var(--space-16) var(--space-8);
      h1 { margin-bottom: var(--space-4); }
      p { color: rgba(244,239,230,0.74); }
    }

    .pricing { padding-block: var(--space-10) var(--space-20); }
    .pricing__grid {
      display: grid;
      gap: var(--space-5);
      @include bp(md) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    .plan {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      min-height: 100%;
      padding: var(--space-6);
      background: var(--color-surface-1);
      border: 1px solid rgba(201,169,97,0.18);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-card);

      &--featured {
        border-color: rgba(201,169,97,0.7);
        box-shadow: var(--shadow-glow), var(--shadow-card);
      }

      h2 { font-size: var(--text-2xl); }
    }

    .plan__badge {
      align-self: flex-start;
      padding: 0.25rem 0.5rem;
      border: 1px solid rgba(201,169,97,0.35);
      color: var(--color-gold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-radius: var(--border-radius);
    }

    .plan__description {
      color: rgba(244,239,230,0.7);
      min-height: 4.5rem;
    }

    .plan__price {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
      color: var(--color-ivory);

      span {
        font-family: $font-display;
        font-size: var(--text-4xl);
        font-weight: 700;
      }

      small { color: var(--color-silver); }
    }

    .plan__features {
      display: grid;
      gap: var(--space-3);
      margin-bottom: auto;

      li {
        color: rgba(244,239,230,0.78);
        font-size: var(--text-sm);
        padding-left: var(--space-5);
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.65em;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--color-gold);
        }
      }
    }
  `]
})
export class PricingComponent implements OnInit {
  private seo = inject(SeoService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private subscriptions = inject(SubscriptionService);

  readonly plans: PricingPlan[] = this.subscriptions.plans;

  ngOnInit(): void {
    this.seo.update({
      title: 'Pricing',
      description: 'Subscription plans for The Patent Architect premium companion resources.',
    });
  }

  selectPlan(tier: SubscriptionTier): void {
    if (tier === 'free') {
      void this.router.navigate(['/companion']);
      return;
    }

    const path = this.auth.isAuthenticated() ? '/subscription' : '/register';
    void this.router.navigate([path], { queryParams: { plan: tier } });
  }
}
