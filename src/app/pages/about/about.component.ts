import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { SiteConfigService, SiteConfig } from '../../core/services/site-config.service';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';

@Component({
  selector: 'pa-about',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, HairlineRuleComponent, BlueprintGridComponent],
  template: `
    <pa-blueprint-grid opacity="0.04">
      <section class="about-hero section section--dark">
        <div class="container">
          <div class="about-hero__inner">
            <div class="about-hero__content">
              <span class="eyebrow">About the Author</span>
              <h1>Shubham Sanjay Banne</h1>
              <p class="about-hero__title-sub">Patent Practitioner, Author &amp; IP Educator</p>
              <pa-rule></pa-rule>
              <p>
                Shubham Sanjay Banne is a patent practitioner with deep expertise across
                Indian patent law, USPTO prosecution, and AI-augmented IP strategy.
                He is the author of <em>The Patent Architect</em>, the most comprehensive
                single-volume treatment of Indian and international patent practice
                currently available in English.
              </p>
              <p>
                His work sits at the intersection of rigorous legal doctrine and the
                practical realities of patent drafting and prosecution. He has prosecuted
                patents across technology sectors - software, hardware, biotech, and
                manufacturing - and advises startups, corporations, and institutions
                on IP strategy.
              </p>
            </div>
            <div class="about-hero__portrait" aria-hidden="true">
              <div class="portrait-placeholder">
                <span class="portrait-placeholder__initials">SB</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </pa-blueprint-grid>

    <section class="about-mission section section--surface">
      <div class="container">
        <div class="about-mission__inner">
          <span class="eyebrow">The Mission</span>
          <h2>Writing to Build India's IP Culture</h2>
          <pa-rule></pa-rule>
          <p>
            <em>The Patent Architect</em> was written with a specific and public mission:
            to place rigorous IP knowledge in the public domain in a form accessible to
            practitioners across India and the world - at a price point that favours
            access over profit.
          </p>
          <p>
            India's patent culture problem is structural: engineering education does not
            include IP, venture capital does not demand it early, and practitioners are
            not available outside major cities. The book and this website are a small
            intervention against all three of those constraints.
          </p>
          <blockquote class="about-mission__quote">
            "The practitioner who only files patents when asked is doing the minimum.
            The practitioner who proactively educates founders and builds IP strategy
            into product roadmaps is doing the work that moves the national needle."
          </blockquote>
        </div>
      </div>
    </section>

    <section class="about-ctas section section--dark">
      <div class="container">
        <div class="about-ctas__inner">
          @if (siteConfig?.isLive) {
            <pa-btn variant="primary" [href]="siteConfig!.amazonUrl" [external]="true">Buy the Book</pa-btn>
          } @else {
            <pa-btn variant="outline" routerLink="/newsletter">Coming {{ siteConfig?.launchDateDisplay }}</pa-btn>
          }
          <pa-btn variant="outline" routerLink="/contact">Get in Touch</pa-btn>
          <pa-btn variant="ghost" routerLink="/newsletter">Subscribe to Updates</pa-btn>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;

    .about-hero { padding-block: var(--space-16) var(--space-12); }
    .about-hero__inner { display: grid; gap: var(--space-10); @include bp(lg) { grid-template-columns: 2fr 1fr; align-items: start; } }
    .about-hero__title-sub { font-family: $font-display; font-style: italic; font-size: var(--text-xl); color: var(--color-silver); margin-bottom: var(--space-4); max-width: none; }
    .about-hero__content { h1 { margin-bottom: var(--space-3); } p { color: rgba(244,239,230,0.75); margin-bottom: var(--space-4); } }
    .about-hero__portrait { display: flex; justify-content: center; align-items: flex-start; }
    .portrait-placeholder { width: 200px; height: 200px; border-radius: 4px; background: var(--color-surface-2); border: 2px solid rgba(201,169,97,0.3); display: grid; place-items: center; }
    .portrait-placeholder__initials { font-family: $font-display; font-size: var(--text-4xl); font-weight: 700; color: var(--color-gold); }

    .about-mission { padding-block: var(--space-16); }
    .about-mission__inner { max-width: 680px; h2 { margin-bottom: var(--space-3); } p { color: var(--color-text-mid); margin-bottom: var(--space-4); } }
    .about-mission__quote { border-left: 3px solid var(--color-gold); padding-left: var(--space-5); margin-top: var(--space-6); font-family: $font-display; font-style: italic; font-size: var(--text-lg); color: var(--color-navy); line-height: 1.6; }

    .about-ctas { padding-block: var(--space-10); }
    .about-ctas__inner { display: flex; gap: var(--space-4); flex-wrap: wrap; }
  `]
})
export class AboutComponent implements OnInit {
  private seo           = inject(SeoService);
  private siteConfigSvc = inject(SiteConfigService);

  siteConfig: SiteConfig | null = null;

  ngOnInit(): void {
    this.siteConfigSvc.config$.subscribe(c => this.siteConfig = c);
    this.seo.update({
      title: 'About the Author',
      description: 'Shubham Sanjay Banne - patent practitioner, author of The Patent Architect, and IP educator committed to building India\'s IP culture.',
    });
  }
}
