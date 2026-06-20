import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { Subscription as RxSubscription } from 'rxjs';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { SeoService } from '../../core/services/seo.service';
import { AuthService } from '../../core/services/auth.service';
import { PremiumContentService } from '../../core/services/premium-content.service';
import { PremiumContent } from '../../core/models/subscription.models';

@Component({
  selector: 'pa-premium',
  standalone: true,
  imports: [CommonModule, RouterModule, MarkdownModule, BtnComponent, HairlineRuleComponent, DatePipe, TitleCasePipe],
  template: `
    <section class="premium-hero section section--dark">
      <div class="container">
        <span class="eyebrow">Premium Companion</span>
        <h1>Subscriber resources.</h1>
        <p>Chapter extras, prompt packs, checklists, and practitioner updates are delivered from Firestore, not public assets.</p>
      </div>
    </section>

    <pa-rule></pa-rule>

    <section class="premium section section--dark">
      <div class="container">
        @if (auth.loading()) {
          <p class="premium__loading">Checking access...</p>
        } @else if (!auth.isSubscribed()) {
          <div class="paywall">
            <span class="paywall__label">Subscription Required</span>
            <h2>Unlock premium companion material.</h2>
            <p>Your public QR routes remain available. Premium files and full subscriber updates require an active Basic or Premium plan.</p>
            <div class="paywall__actions">
              <pa-btn variant="primary" routerLink="/pricing">View Pricing</pa-btn>
              <pa-btn variant="outline" routerLink="/subscription">Manage Subscription</pa-btn>
            </div>
          </div>
        } @else if (loading()) {
          <p class="premium__loading">Loading premium content...</p>
        } @else if (error()) {
          <p class="premium__error">{{error()}}</p>
        } @else if (selectedContent()) {
          <article class="premium-article">
            <a routerLink="/premium" class="premium-article__back">Back to premium library</a>
            <span class="premium-article__meta">{{selectedContent()!.type | titlecase}} · {{selectedContent()!.accessLevel | titlecase}}</span>
            <h2>{{selectedContent()!.title}}</h2>
            @if (selectedContent()?.updatedAt) {
              <p class="premium-article__updated">Updated {{selectedContent()?.updatedAt?.toDate() | date:'mediumDate'}}</p>
            }
            <div class="prose">
              <markdown [data]="selectedContent()!.bodyMarkdown"></markdown>
            </div>
          </article>
        } @else {
          <div class="premium__grid">
            @for (item of premium.items(); track item.id) {
              <article class="premium-card">
                <span>{{item.type | titlecase}} · {{item.accessLevel | titlecase}}</span>
                <h2>{{item.title}}</h2>
                <p>Linked to {{item.chapterId}}.</p>
                <pa-btn variant="outline" [routerLink]="['/premium', item.id]">Open Resource</pa-btn>
              </article>
            } @empty {
              <p class="premium__loading">Premium content is configured but no published resources are available yet.</p>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;

    .premium-hero { padding-block: var(--space-16) var(--space-8); h1 { margin-bottom: var(--space-4); } p { color: rgba(244,239,230,0.74); } }
    .premium { padding-block: var(--space-10) var(--space-20); }
    .premium__loading { color: var(--color-silver); max-width: none; }
    .premium__error { color: #ffd7d7; background: rgba(160,40,40,0.22); border: 1px solid rgba(255,120,120,0.24); padding: var(--space-4); border-radius: var(--border-radius); max-width: none; }

    .paywall {
      max-width: 42rem;
      padding: var(--space-8);
      background: var(--color-surface-1);
      border: 1px solid rgba(201,169,97,0.24);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-card);

      h2 { margin-bottom: var(--space-3); }
      p { color: rgba(244,239,230,0.72); }
    }

    .paywall__label {
      display: inline-block;
      margin-bottom: var(--space-4);
      color: var(--color-gold);
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .paywall__actions {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
      margin-top: var(--space-6);
    }

    .premium__grid {
      display: grid;
      gap: var(--space-5);
      @include bp(md) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      @include bp(lg) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    .premium-card,
    .premium-article {
      padding: var(--space-6);
      background: var(--color-surface-1);
      border: 1px solid rgba(201,169,97,0.18);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-card);
    }

    .premium-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);

      span { color: var(--color-gold); font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
      h2 { font-size: var(--text-xl); }
      p { color: rgba(244,239,230,0.72); margin-bottom: auto; }
    }

    .premium-article {
      max-width: var(--max-width-prose);
    }

    .premium-article__back {
      display: inline-block;
      margin-bottom: var(--space-6);
      color: var(--color-gold);
      font-size: var(--text-sm);
    }

    .premium-article__meta,
    .premium-article__updated {
      display: block;
      color: var(--color-silver);
      font-size: var(--text-sm);
      margin-bottom: var(--space-3);
    }

    .premium-article h2 {
      margin-bottom: var(--space-4);
    }

    .prose {
      margin-top: var(--space-6);
      p { color: rgba(244,239,230,0.78); margin-bottom: var(--space-4); max-width: none; }
      h1,h2,h3,h4 { margin-block: var(--space-6) var(--space-3); }
      ul,ol { color: rgba(244,239,230,0.78); padding-left: var(--space-6); margin-bottom: var(--space-4); }
      li { list-style: disc; margin-bottom: var(--space-2); }
      a { color: var(--color-gold); text-decoration: underline; text-underline-offset: 3px; }
      code { font-family: $font-mono; background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 3px; }
    }
  `]
})
export class PremiumComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly premium = inject(PremiumContentService);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  private authSub?: RxSubscription;
  private routeSub?: RxSubscription;

  readonly loading = signal(false);
  readonly error = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly selectedContent = signal<PremiumContent | null>(null);

  ngOnInit(): void {
    this.seo.update({ title: 'Premium Companion', description: 'Subscriber resources for The Patent Architect.' });

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.selectedId.set(params.get('id'));
      void this.loadContent();
    });

    this.authSub = this.auth.user$.subscribe(() => {
      void this.loadContent();
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  private async loadContent(): Promise<void> {
    if (!this.auth.isSubscribed()) {
      this.selectedContent.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const id = this.selectedId();
      if (id) {
        this.selectedContent.set(await this.premium.getContent(id));
      } else {
        this.selectedContent.set(null);
        await this.premium.loadPublishedContent();
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Premium content could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }
}
