import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { SeoService } from '../../core/services/seo.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'pa-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, HairlineRuleComponent, DatePipe, TitleCasePipe],
  template: `
    <section class="dash-hero section section--dark">
      <div class="container">
        <span class="eyebrow">Dashboard</span>
        <h1>Reader workspace.</h1>
        <p>Manage your profile, subscription, and premium companion access for The Patent Architect.</p>
      </div>
    </section>

    <pa-rule></pa-rule>

    <section class="dashboard section section--dark">
      <div class="container">
        @if (auth.profile(); as profile) {
          <div class="dashboard__grid">
            <article class="panel panel--wide">
              <span class="panel__label">Signed in as</span>
              <h2>{{profile.name}}</h2>
              <p>{{profile.email}}</p>
              <div class="panel__actions">
                <pa-btn variant="outline" routerLink="/profile">Edit Profile</pa-btn>
                <pa-btn variant="ghost" (clicked)="logout()">Sign Out</pa-btn>
              </div>
            </article>

            <article class="panel">
              <span class="panel__label">Subscription</span>
              <h2>{{profile.subscription.tier | titlecase}}</h2>
              <p>Status: {{profile.subscription.status | titlecase}}</p>
              @if (profile.subscription.currentPeriodEnd) {
                <p>Renews through {{profile.subscription.currentPeriodEnd.toDate() | date:'mediumDate'}}</p>
              }
              <pa-btn variant="primary" routerLink="/subscription" [fullWidth]="true">Manage Subscription</pa-btn>
            </article>

            <article class="panel">
              <span class="panel__label">Premium Companion</span>
              <h2>{{auth.isSubscribed() ? 'Unlocked' : 'Locked'}}</h2>
              <p>{{auth.isSubscribed() ? 'Premium materials are available.' : 'Subscribe to unlock premium resources.'}}</p>
              <pa-btn [variant]="auth.isSubscribed() ? 'outline' : 'primary'" routerLink="/premium" [fullWidth]="true">
                {{auth.isSubscribed() ? 'Open Premium' : 'View Paywall'}}
              </pa-btn>
            </article>
          </div>
        } @else {
          <p class="dashboard__loading">Loading your account...</p>
        }
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;

    .dash-hero { padding-block: var(--space-16) var(--space-8); h1 { margin-bottom: var(--space-4); } p { color: rgba(244,239,230,0.74); } }
    .dashboard { padding-block: var(--space-10) var(--space-20); }
    .dashboard__grid { display: grid; gap: var(--space-5); @include bp(lg) { grid-template-columns: 1.4fr 1fr 1fr; } }
    .dashboard__loading { color: var(--color-silver); }

    .panel {
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

    .panel__label {
      color: var(--color-gold);
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .panel__actions {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
      margin-top: auto;
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private seo = inject(SeoService);
  private router = inject(Router);

  ngOnInit(): void {
    this.seo.update({ title: 'Dashboard', description: 'Reader dashboard for The Patent Architect premium companion.' });
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}
