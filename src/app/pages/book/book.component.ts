import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { SiteConfigService, SiteConfig } from '../../core/services/site-config.service';
import { Chapter } from '../../core/models/content.models';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';

@Component({
  selector: 'pa-book',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, HairlineRuleComponent, BlueprintGridComponent],
  template: `
    <pa-blueprint-grid opacity="0.04">
      <section class="book-hero section section--dark">
        <div class="container">
          <span class="eyebrow">The Book</span>
          <h1>Overview &amp; Chapter Guide</h1>
          <p class="book-hero__desc">
            Four phases, nineteen chapters, seven appendices. A complete curriculum in
            patent practice - from first principles to AI-augmented strategy.
          </p>
          <div class="book-hero__ctas">
            @if (siteConfig?.isLive) {
              <pa-btn variant="primary" [href]="siteConfig!.amazonUrl" [external]="true">Buy on Amazon India</pa-btn>
            } @else {
              <pa-btn variant="outline" routerLink="/newsletter">Coming {{ siteConfig?.launchDateDisplay }}</pa-btn>
            }
            <pa-btn variant="outline" routerLink="/sample">Free Sample Chapter</pa-btn>
          </div>
        </div>
      </section>
    </pa-blueprint-grid>

    <!-- Book specs -->
    <section class="book-specs section section--surface">
      <div class="container">
        <div class="book-specs__grid">
          @for (spec of specs; track spec.label) {
            <div class="book-spec">
              <strong class="book-spec__val">{{spec.value}}</strong>
              <span class="book-spec__label">{{spec.label}}</span>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Phases & Chapters -->
    @for (phase of phases; track phase.num) {
      <section class="phase-block section section--dark" [id]="'phase-' + phase.num">
        <div class="container">
          <div class="phase-block__header">
            <span class="eyebrow">Phase {{phase.num}}</span>
            <h2>{{phase.title}}</h2>
            <p>{{phase.description}}</p>
          </div>
          <div class="phase-block__chapters">
            @for (ch of getChapters(phase.num); track ch.id) {
              <div class="book-chapter-row">
                <span class="book-chapter-row__num">{{ch.number}}</span>
                <div class="book-chapter-row__body">
                  <h3>{{ch.title}}</h3>
                  @if (ch.subtitle) { <p class="book-chapter-row__sub">{{ch.subtitle}}</p> }
                  <p class="book-chapter-row__summary">{{ch.summary}}</p>
                  <div class="book-chapter-row__topics">
                    @for (t of ch.keyTopics.slice(0,4); track t) {
                      <span class="book-chapter-row__topic">{{t}}</span>
                    }
                  </div>
                </div>
                <a [routerLink]="['/companion', ch.id]" class="book-chapter-row__companion">
                  Companion →
                </a>
              </div>
            }
          </div>
        </div>
      </section>
      <pa-rule variant="hair"></pa-rule>
    }

    <!-- Appendices -->
    <section class="appendices section section--surface">
      <div class="container">
        <span class="eyebrow">Appendices</span>
        <h2>Seven Reference Appendices</h2>
        <div class="appendices__grid">
          @for (app of appendices; track app.label) {
            <div class="appendix-card">
              <strong class="appendix-card__ref">Appendix {{app.ref}}</strong>
              <p class="appendix-card__label">{{app.label}}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;

    .book-hero { padding-block: var(--space-16) var(--space-10); h1 { margin-bottom: var(--space-4); } }
    .book-hero__desc { font-size: var(--text-lg); color: rgba(244,239,230,0.75); margin-bottom: var(--space-6); }
    .book-hero__ctas { display: flex; gap: var(--space-4); flex-wrap: wrap; }

    .book-specs { padding-block: var(--space-8); }
    .book-specs__grid { display: grid; grid-template-columns: repeat(2,1fr); gap: var(--space-6); @include bp(md) { grid-template-columns: repeat(5,1fr); } }
    .book-spec { text-align: center; }
    .book-spec__val { display: block; font-family: $font-display; font-size: var(--text-3xl); font-weight: 700; color: var(--color-gold); }
    .book-spec__label { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-mid); }

    .phase-block__header { margin-bottom: var(--space-8); h2 { margin-bottom: var(--space-3); } p { color: rgba(244,239,230,0.7); } }
    .phase-block__chapters { display: flex; flex-direction: column; gap: var(--space-4); }

    .book-chapter-row {
      display: grid; gap: var(--space-4); grid-template-columns: 2.5rem 1fr auto; align-items: start;
      padding: var(--space-4); background: var(--color-surface-1); border: 1px solid rgba(201,169,97,0.1); border-radius: var(--border-radius-md);
    }
    .book-chapter-row__num { font-family: $font-display; font-size: var(--text-2xl); font-weight: 700; color: rgba(201,169,97,0.35); line-height: 1; padding-top: 2px; }
    .book-chapter-row__body { h3 { font-size: var(--text-lg); margin-bottom: var(--space-1); } }
    .book-chapter-row__sub { font-size: var(--text-sm); color: var(--color-silver); font-style: italic; margin-bottom: var(--space-2); max-width: none; }
    .book-chapter-row__summary { font-size: var(--text-sm); color: rgba(244,239,230,0.65); line-height: 1.6; margin-bottom: var(--space-3); max-width: none; }
    .book-chapter-row__topics { display: flex; flex-wrap: wrap; gap: var(--space-1); }
    .book-chapter-row__topic { font-size: 10px; color: var(--color-text-muted); background: rgba(255,255,255,0.05); padding: 2px 7px; border-radius: 3px; }
    .book-chapter-row__companion { font-size: var(--text-xs); color: var(--color-gold); text-decoration: underline; text-underline-offset: 2px; white-space: nowrap; padding-top: 4px; }

    .appendices { padding-block: var(--space-12); h2 { margin-bottom: var(--space-8); } }
    .appendices__grid { display: grid; gap: var(--space-3); grid-template-columns: 1fr; @include bp(sm) { grid-template-columns: 1fr 1fr; } @include bp(lg) { grid-template-columns: repeat(4,1fr); } }
    .appendix-card { padding: var(--space-4) var(--space-5); background: rgba(201,169,97,0.04); border: 1px solid rgba(201,169,97,0.15); border-radius: var(--border-radius); }
    .appendix-card__ref { display: block; font-size: var(--text-xs); color: var(--color-gold); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: var(--space-1); }
    .appendix-card__label { font-size: var(--text-sm); color: var(--color-ivory); max-width: none; line-height: 1.4; }
  `]
})
export class BookComponent implements OnInit {
  private content       = inject(ContentService);
  private seo           = inject(SeoService);
  private siteConfigSvc = inject(SiteConfigService);

  siteConfig: SiteConfig | null = null;
  chapters: Chapter[] = [];

  specs = [
    { value: '19', label: 'Chapters' },
    { value: '7', label: 'Appendices' },
    { value: '4', label: 'Phases' },
    { value: '60+', label: 'AI Prompts' },
    { value: '3', label: 'Jurisdictions' },
  ];

  phases = [
    { num: 1, title: 'Foundations of the Patent System', description: 'First principles - why patents exist, what can and cannot be patented, and the anatomy of a patent application.' },
    { num: 2, title: 'The Art of Claims Drafting', description: 'The fortress metaphor, claim architecture, specification writing, and drafting for examination resilience.' },
    { num: 3, title: 'Prosecution Mastery', description: 'End-to-end prosecution before India IPO, USPTO, PCT, and EPO - with current procedures, timelines, and strategic frameworks.' },
    { num: 4, title: 'AI-Augmented IP Strategy', description: 'AI tools for patent work, the prompt library, portfolio strategy, India\'s Innovation Paradox, and the future of the profession.' },
  ];

  appendices = [
    { ref: 'A', label: 'Claim Drafting Quick-Reference Checklist' },
    { ref: 'B', label: 'India IPO Forms & Official Procedures' },
    { ref: 'C', label: 'USPTO Filing Requirements & Forms' },
    { ref: 'D', label: 'PCT Chapter I & II Procedures Summary' },
    { ref: 'E', label: 'Glossary of Patent Terms (India/US/EP)' },
    { ref: 'F', label: 'Key Case Law Reference Table' },
    { ref: 'G', label: 'AI Tool Comparison Matrix' },
  ];

  ngOnInit(): void {
    this.seo.update({
      title: 'Book Overview & Chapters',
      description: 'Full chapter guide to The Patent Architect - 19 chapters, 7 appendices, 4 phases covering India patent law, USPTO practice, PCT, EPO, and AI-augmented strategy.',
    });
    this.siteConfigSvc.config$.subscribe(c => this.siteConfig = c);
    this.content.getChapters().subscribe(c => this.chapters = c);
  }

  getChapters(phase: number): Chapter[] {
    return this.chapters.filter(c => c.phase === phase);
  }
}
