import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { SiteConfigService, SiteConfig } from '../../core/services/site-config.service';
import { Testimonial } from '../../core/models/content.models';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';

@Component({
  selector: 'pa-endorsements',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, HairlineRuleComponent],
  template: `
    <section class="end-hero section section--dark">
      <div class="container">
        <span class="eyebrow">Endorsements</span>
        <h1>What Practitioners Are Saying</h1>
        <p>Feedback from patent attorneys, agents, academics, inventors, and IP strategists.</p>
      </div>
    </section>

    <section class="end-grid section section--dark">
      <div class="container">
        <div class="end-grid__inner">
          @for (t of testimonials; track t.id) {
            <blockquote class="end-card">
              <p class="end-card__quote">"{{t.quote}}"</p>
              <footer class="end-card__footer">
                <strong>{{t.name}}</strong>
                <span>{{t.title}}</span>
                <span class="end-card__org">{{t.organization}}</span>
              </footer>
            </blockquote>
          }
        </div>
        <div class="end-cta">
          @if (siteConfig?.isLive) {
            <pa-btn variant="primary" [href]="siteConfig!.amazonUrl" [external]="true">Buy the Book</pa-btn>
          } @else {
            <pa-btn variant="outline" routerLink="/newsletter">Coming {{ siteConfig?.launchDateDisplay }}</pa-btn>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;
    .end-hero { padding-block: var(--space-16) var(--space-10); h1 { margin-bottom: var(--space-3); } p { color: rgba(244,239,230,0.7); } }
    .end-grid { padding-block: var(--space-4) var(--space-16); }
    .end-grid__inner { display: grid; gap: var(--space-6); grid-template-columns: 1fr; @include bp(md) { grid-template-columns: 1fr 1fr; } }
    .end-card { padding: var(--space-6); background: var(--color-surface-1); border: 1px solid rgba(201,169,97,0.15); border-radius: var(--border-radius-md); }
    .end-card__quote { font-style: italic; font-size: var(--text-md); line-height: 1.7; color: rgba(244,239,230,0.85); margin-bottom: var(--space-4); max-width: none; }
    .end-card__footer { display: flex; flex-direction: column; gap: var(--space-1); strong { color: var(--color-ivory); font-size: var(--text-sm); } span { font-size: var(--text-xs); color: var(--color-silver); } }
    .end-card__org { color: var(--color-text-muted) !important; }
    .end-cta { text-align: center; margin-top: var(--space-10); }
  `]
})
export class EndorsementsComponent implements OnInit {
  private content       = inject(ContentService);
  private seo           = inject(SeoService);
  private siteConfigSvc = inject(SiteConfigService);

  siteConfig: SiteConfig | null = null;
  testimonials: Testimonial[] = [];
  ngOnInit(): void {
    this.seo.update({ title: 'Endorsements & Reviews', description: 'What patent practitioners, academics, and inventors say about The Patent Architect.' });
    this.siteConfigSvc.config$.subscribe(c => this.siteConfig = c);
    this.content.getTestimonials().subscribe(t => this.testimonials = t);
  }
}
