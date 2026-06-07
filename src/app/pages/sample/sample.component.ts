import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { SiteConfigService, SiteConfig } from '../../core/services/site-config.service';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';

@Component({
  selector: 'pa-sample',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, HairlineRuleComponent, BlueprintGridComponent],
  template: `
    <pa-blueprint-grid opacity="0.05">
      <section class="sample-hero section section--dark">
        <div class="container">
          <div class="sample-hero__inner">
            <div>
              <span class="eyebrow">Free Sample</span>
              <h1>Read Before You Buy</h1>
              <pa-rule></pa-rule>
              <p class="sample-hero__desc">
                Download a free sample chapter and the first 15 prompts from the AI Prompt Library.
                No email required for the sample chapter. Enter your email to receive the full
                15-prompt lead magnet PDF.
              </p>
              <div class="sample-hero__ctas">
                <pa-btn variant="primary" href="assets/downloads/patent-architect-sample-chapter.pdf" [external]="true">
                  Download Sample Chapter (PDF)
                </pa-btn>
                @if (siteConfig?.isLive) {
                  <pa-btn variant="outline" [href]="siteConfig!.amazonUrl" [external]="true">
                    Buy the Full Book
                  </pa-btn>
                } @else {
                  <pa-btn variant="outline" routerLink="/newsletter">
                    Coming {{ siteConfig?.launchDateDisplay }}
                  </pa-btn>
                }
              </div>
            </div>
            <div class="sample-includes">
              <h3>Sample Includes</h3>
              <pa-rule></pa-rule>
              <ul class="sample-list">
                @for (item of includes; track item) {
                  <li class="sample-list__item">{{item}}</li>
                }
              </ul>
            </div>
          </div>
        </div>
      </section>
    </pa-blueprint-grid>

    <!-- Lead magnet email capture -->
    <section class="lead-magnet section section--surface">
      <div class="container">
        <div class="lead-magnet__inner">
          <div class="lead-magnet__text">
            <span class="eyebrow">Free Resource</span>
            <h2>15 Essential Patent Prompts PDF</h2>
            <p>
              Enter your email to receive the 15 most-used AI prompts from The Patent Architect
              in a single, printable PDF - formatted for quick reference at your desk.
            </p>
          </div>
          <form class="lead-magnet__form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
            <input type="hidden" name="resource" value="15-prompts-pdf" />
            <input type="email" name="email" class="lead-magnet__input" placeholder="your@email.com" required aria-label="Email address" />
            <pa-btn variant="primary" type="submit">Get the PDF</pa-btn>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;
    .sample-hero { padding-block: var(--space-16) var(--space-12); }
    .sample-hero__inner { display: grid; gap: var(--space-10); @include bp(lg) { grid-template-columns: 2fr 1fr; align-items: start; } }
    .sample-hero__desc { font-size: var(--text-lg); color: rgba(244,239,230,0.75); margin-bottom: var(--space-6); }
    .sample-hero__ctas { display: flex; gap: var(--space-4); flex-wrap: wrap; }
    .sample-includes { padding: var(--space-5); background: var(--color-surface-1); border: 1px solid rgba(201,169,97,0.15); border-radius: var(--border-radius-md); h3 { margin-bottom: var(--space-3); font-size: var(--text-lg); } }
    .sample-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .sample-list__item { font-size: var(--text-sm); color: rgba(244,239,230,0.75); padding-left: var(--space-4); position: relative; &::before { content: '✓'; position: absolute; left: 0; color: var(--color-gold); font-weight: 700; } }
    .lead-magnet { padding-block: var(--space-12); }
    .lead-magnet__inner { display: grid; gap: var(--space-8); @include bp(md) { grid-template-columns: 2fr 1fr; align-items: center; } }
    .lead-magnet__text { h2 { margin-bottom: var(--space-3); font-size: var(--text-2xl); color: var(--color-text-dark); } p { color: var(--color-text-mid); } }
    .lead-magnet__form { display: flex; flex-direction: column; gap: var(--space-3); @include bp(sm) { flex-direction: row; } }
    .lead-magnet__input { flex: 1; padding: 0.65rem 1rem; background: white; border: 1px solid var(--color-ivory-dim); border-radius: var(--border-radius); font-family: $font-body; font-size: var(--text-sm); &:focus { outline: 2px solid var(--color-gold); outline-offset: 2px; } }
  `]
})
export class SampleComponent implements OnInit {
  private seo           = inject(SeoService);
  private siteConfigSvc = inject(SiteConfigService);

  siteConfig: SiteConfig | null = null;

  includes = [
    'Full Chapter 1: The Patent System - Purpose, Rationale & Global Architecture',
    'Introduction and how to use this book',
    'The book\'s claims drafting framework overview',
    '15 AI prompts (a curated selection from the full library)',
    'Table of contents for all 19 chapters',
  ];
  ngOnInit(): void {
    this.seo.update({ title: 'Free Sample Chapter', description: 'Download a free sample chapter of The Patent Architect and get 15 essential AI prompts for patent work.' });
    this.siteConfigSvc.config$.subscribe(c => this.siteConfig = c);
  }
}
