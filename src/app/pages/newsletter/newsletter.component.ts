import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { ContentService } from '../../core/services/content.service';
import { BlogPost } from '../../core/models/content.models';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';

@Component({
  selector: 'pa-newsletter',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BtnComponent,
    HairlineRuleComponent,
    BlueprintGridComponent,
  ],
  template: `
    <pa-blueprint-grid opacity="0.05">
      <section class="nl-hero section section--dark">
        <div class="container newsletter-shell">
          <div class="newsletter-shell__intro">
            <span class="eyebrow">The Patent Architect</span>
            <p class="newsletter-shell__edition">Weekly Edition</p>
            <h1>
              Briefings for patent practitioners, founders, and policy watchers.
            </h1>
            <p class="nl-hero__desc">
              The weekly brief brings together the ideas, cases, and strategic
              signals that matter most in the patent economy. Thoughtful,
              occasional, and grounded in the work already published here.
            </p>

            <div class="nl-form-wrap">
              <form
                class="nl-form"
                action="https://formspree.io/f/YOUR_FORM_ID"
                method="POST"
              >
                <div class="nl-form__row">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    class="nl-form__input"
                    required
                    aria-label="Email address"
                  />
                  <button type="submit" class="nl-form__button">
                    Subscribe
                  </button>
                </div>

                <div class="nl-form__role">
                  <label class="nl-form__label">I am a:</label>
                  <div class="nl-form__options">
                    @for (role of roles; track role) {
                      <label class="nl-form__option">
                        <input type="radio" name="role" [value]="role" />
                        <span>{{ role }}</span>
                      </label>
                    }
                  </div>
                </div>

                <p class="nl-form__note">
                  A select reading list for patent strategy, AI &amp; IP, policy
                  changes, and the sharpest analysis already available on the
                  site.
                </p>
              </form>
            </div>

            <div class="nl-promises">
              @for (p of promises; track p) {
                <div class="nl-promise">
                  <span class="nl-promise__icon" aria-hidden="true">✓</span>
                  <span>{{ p }}</span>
                </div>
              }
            </div>
          </div>

          <aside class="edition-card" aria-label="This week's editorial focus">
            <span class="eyebrow">This week</span>
            <h2>Signals worth reading</h2>
            <ul>
              @for (post of editionPosts; track post.slug) {
                <li>
                  <span>{{ post.category | titlecase }}</span>
                  <a [routerLink]="['/blog', post.slug]">{{ post.title }}</a>
                </li>
              }
            </ul>
            <a class="edition-card__link" routerLink="/blog"
              >Browse all essays →</a
            >
          </aside>
        </div>
      </section>
    </pa-blueprint-grid>
  `,
  styles: [
    `
      @use '../../../styles/tokens' as *;
      @use '../../../styles/mixins' as *;

      .nl-hero {
        padding-block: var(--space-20);
      }
      .newsletter-shell {
        display: grid;
        gap: var(--space-8);
        align-items: start;
        @include bp(lg) {
          grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.7fr);
        }
      }
      .newsletter-shell__intro {
        max-width: 42rem;
      }
      .newsletter-shell__edition {
        font-size: var(--text-xs);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--color-gold);
        margin-bottom: var(--space-3);
      }
      .nl-hero__desc {
        font-size: var(--text-lg);
        color: rgba(244, 239, 230, 0.75);
        margin-bottom: var(--space-8);
      }

      .nl-form-wrap {
        margin-bottom: var(--space-8);
      }
      .nl-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        text-align: left;
      }
      .nl-form__row {
        display: grid;
        gap: var(--space-3);
        @include bp(sm) {
          grid-template-columns: minmax(0, 1fr) auto;
        }
      }
      .nl-form__input {
        padding: 0.8rem 1rem;
        background: rgba(18, 21, 43, 0.5);
        border: 1px solid rgba(201, 169, 97, 0.2);
        border-radius: var(--border-radius);
        color: var(--color-ivory);
        font-family: $font-body;
        font-size: var(--text-sm);
        &::placeholder {
          color: var(--color-text-muted);
        }
        &:focus {
          outline: none;
          border-color: var(--color-gold);
        }
      }
      .nl-form__button {
        border: 1px solid rgba(201, 169, 97, 0.35);
        background: linear-gradient(
          180deg,
          rgba(201, 169, 97, 0.22),
          rgba(201, 169, 97, 0.14)
        );
        color: var(--color-ivory);
        padding: 0.8rem 1.5rem;
        border-radius: var(--border-radius);
        font-weight: 600;
        cursor: pointer;
        min-width: 9rem;
      }
      .nl-form__label {
        display: block;
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-gold);
        margin-bottom: var(--space-2);
      }
      .nl-form__options {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
      }
      .nl-form__option {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        color: rgba(244, 239, 230, 0.75);
        cursor: pointer;
        input[type='radio'] {
          accent-color: var(--color-gold);
        }
      }
      .nl-form__note {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        margin-top: var(--space-2);
        max-width: none;
      }

      .nl-promises {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      .nl-promise {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--text-sm);
        color: rgba(244, 239, 230, 0.7);
      }
      .nl-promise__icon {
        color: var(--color-gold);
        font-weight: 700;
      }

      .edition-card {
        padding: var(--space-6);
        background: rgba(34, 39, 74, 0.72);
        border: 1px solid rgba(201, 169, 97, 0.14);
        border-radius: var(--border-radius-lg);
        h2 {
          margin-bottom: var(--space-4);
        }
        ul {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          list-style: none;
        }
        li {
          display: grid;
          gap: var(--space-1);
          padding-bottom: var(--space-3);
          border-bottom: 1px solid rgba(201, 169, 97, 0.08);
          span {
            font-size: var(--text-xs);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--color-gold);
          }
          a {
            color: var(--color-ivory);
            font-size: var(--text-md);
          }
        }
      }
      .edition-card__link {
        display: inline-flex;
        margin-top: var(--space-5);
        color: var(--color-gold);
      }
    `,
  ],
})
export class NewsletterComponent implements OnInit {
  private seo = inject(SeoService);
  private content = inject(ContentService);
  roles = [
    'Patent Practitioner',
    'Student / Exam Aspirant',
    'Inventor / Founder',
    'IP Strategist',
    'Academic / Researcher',
  ];
  promises = [
    'Updates only when something significant changes',
    'No marketing emails, no third-party promotions',
    'Unsubscribe instantly at any time',
  ];

  editionPosts: BlogPost[] = [];

  ngOnInit(): void {
    this.seo.update({
      title: 'Newsletter',
      description:
        'Subscribe for updates when The Patent Architect companion website changes - fee revisions, case law, new prompts.',
    });
    this.content.getBlogPosts().subscribe((posts) => {
      this.editionPosts = posts.slice(0, 3);
    });
  }
}
