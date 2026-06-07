import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HairlineRuleComponent } from '../hairline-rule/hairline-rule.component';

@Component({
  selector: 'pa-footer',
  standalone: true,
  imports: [RouterModule, HairlineRuleComponent],
  template: `
    <footer class="site-footer">
      <div class="site-footer__top">
        <div class="container">
          <div class="site-footer__grid">

            <!-- Brand column -->
            <div class="site-footer__brand">
              <div class="site-footer__logo">
                <span class="site-footer__logo-mark" aria-hidden="true">⬡</span>
                <span class="site-footer__logo-title">The Patent Architect</span>
              </div>
              <p class="site-footer__tagline">
                Buy the book once.<br>Stay current forever.
              </p>
              <p class="site-footer__author">
                By <strong>Shubham Sanjay Banne</strong><br>
                Patent Practitioner & Author
              </p>
            </div>

            <!-- Book column -->
            <div class="site-footer__col">
              <h3 class="site-footer__heading">The Book</h3>
              <ul class="site-footer__links">
                <li><a routerLink="/book">Overview & Chapters</a></li>
                <li><a routerLink="/sample">Free Sample Chapter</a></li>
                <li><a routerLink="/endorsements">Endorsements</a></li>
                <li><a href="https://www.amazon.in" target="_blank" rel="noopener noreferrer">Buy on Amazon</a></li>
              </ul>
            </div>

            <!-- Companion column -->
            <div class="site-footer__col">
              <h3 class="site-footer__heading">Living Companion</h3>
              <ul class="site-footer__links">
                <li><a routerLink="/companion">Companion Hub</a></li>
                <li><a routerLink="/companion/fees">Fee Schedules</a></li>
                <li><a routerLink="/prompts">AI Prompt Library</a></li>
                <li><a routerLink="/companion/errata">Errata & Updates</a></li>
              </ul>
            </div>

            <!-- Learn column -->
            <div class="site-footer__col">
              <h3 class="site-footer__heading">Learn & Connect</h3>
              <ul class="site-footer__links">
                <li><a routerLink="/blog">Blog & Resources</a></li>
                <li><a routerLink="/about">About the Author</a></li>
                <li><a routerLink="/newsletter">Newsletter</a></li>
                <li><a routerLink="/contact">Contact</a></li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      <pa-rule variant="hair"></pa-rule>

      <div class="site-footer__bottom">
        <div class="container">
          <div class="site-footer__bottom-inner">
            <p class="site-footer__legal">
              © 2026 Shubham Sanjay Banne. All rights reserved.
              The Patent Architect is a registered trademark of Shubham Sanjay Banne.
            </p>
            <div class="site-footer__bottom-links">
              <a routerLink="/privacy">Privacy</a>
              <a routerLink="/terms">Terms</a>
              <span class="site-footer__mission">
                Written to build India's IP culture.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer {
      background: var(--color-navy);
      border-top: 1px solid rgba(201,169,97,0.1);
      margin-top: auto;

      &__top {
        padding-block: var(--space-16) var(--space-12);
      }

      &__grid {
        display: grid;
        gap: var(--space-10);
        grid-template-columns: 1fr;

        @media (min-width: 640px) { grid-template-columns: 1fr 1fr; }
        @media (min-width: 1024px) { grid-template-columns: 2fr 1fr 1fr 1fr; }
      }

      &__brand {}

      &__logo {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      &__logo-mark {
        font-size: 1.5rem;
        color: var(--color-gold);
      }

      &__logo-title {
        font-family: var(--font-display);
        font-size: var(--text-lg);
        font-weight: 700;
        color: var(--color-ivory);
        letter-spacing: -0.01em;
      }

      &__tagline {
        font-family: var(--font-display);
        font-style: italic;
        font-size: var(--text-xl);
        color: var(--color-gold);
        line-height: 1.3;
        margin-bottom: var(--space-4);
        max-width: none;
      }

      &__author {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        line-height: 1.6;
        max-width: none;

        strong { color: var(--color-silver); }
      }

      &__heading {
        font-family: var(--font-body);
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--color-gold);
        margin-bottom: var(--space-4);
      }

      &__links {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);

        a {
          font-size: var(--text-sm);
          color: rgba(244,239,230,0.65);
          text-decoration: none;
          transition: color var(--duration);

          &:hover { color: var(--color-ivory); }
        }
      }

      &__bottom {
        padding-block: var(--space-6);
      }

      &__bottom-inner {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);

        @media (min-width: 768px) {
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }
      }

      &__legal {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        max-width: none;
        line-height: 1.6;
      }

      &__bottom-links {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        flex-wrap: wrap;

        a {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--duration);
          &:hover { color: var(--color-gold); }
        }
      }

      &__mission {
        font-size: var(--text-xs);
        color: rgba(201,169,97,0.5);
        font-style: italic;
      }
    }
  `]
})
export class FooterComponent {}
