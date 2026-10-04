import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { BlogPost } from '../../core/models/content.models';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';

@Component({
  selector: 'pa-blog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HairlineRuleComponent,
    BlueprintGridComponent,
  ],
  template: `
    <pa-blueprint-grid opacity="0.04">
      <section class="blog-hero section section--dark">
        <div class="container blog-hero__shell">
          <div class="blog-hero__masthead">
            <span class="eyebrow"
              >The Patent Architect / Editorial Journal</span
            >
            <h1>Patents, strategy, and the ideas behind innovation.</h1>
            <p>
              Independent analysis for founders, practitioners, policy watchers,
              and teams building in the IP economy.
            </p>
          </div>

          <div class="blog-hero__toolbar">
            <label class="blog-search" aria-label="Search essays">
              <span class="sr-only">Search essays</span>
              <input
                type="search"
                [(ngModel)]="searchTerm"
                (ngModelChange)="applyFilters()"
                placeholder="Search by keyword, category or topic"
                aria-label="Search essays"
              />
            </label>

            <div class="blog-filters" aria-label="Blog category filters">
              @for (option of categoryOptions; track option.value) {
                <button
                  type="button"
                  class="blog-filter"
                  [class.blog-filter--active]="
                    selectedCategory === option.value
                  "
                  (click)="selectedCategory = option.value; applyFilters()"
                >
                  {{ option.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </section>
    </pa-blueprint-grid>

    @if (featuredStory) {
      <section class="featured-story section section--dark">
        <div class="container">
          <div class="featured-story__frame">
            <div class="featured-story__copy">
              <span class="eyebrow">Featured story</span>
              <span class="featured-story__meta"
                >{{ categoryLabels[featuredStory.category] }} ·
                {{ featuredStory.readingTime }} min read</span
              >
              <h2>
                <a [routerLink]="['/blog', featuredStory.slug]">{{
                  featuredStory.title
                }}</a>
              </h2>
              @if (featuredStory.subtitle) {
                <p class="featured-story__subtitle">
                  {{ featuredStory.subtitle }}
                </p>
              }
              <p class="featured-story__excerpt">{{ featuredStory.excerpt }}</p>
              <div class="featured-story__byline">
                <span>{{ featuredStory.author }}</span>
                <span>·</span>
                <span>{{
                  featuredStory.datePublished | date: 'MMMM d, y'
                }}</span>
              </div>
            </div>

            <div
              class="featured-story__media"
              aria-label="Editorial feature illustration"
            >
              <div class="edition-panel">
                <span class="edition-panel__label">The Patent Architect</span>
                <strong>Current issue</strong>
                <div class="edition-panel__grid">
                  <span>{{ featuredStory.category | titlecase }}</span>
                  <span>{{ featuredStory.readingTime }} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    }

    <section class="blog-list section section--dark">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">Top stories</span>
          <h2>Latest reading</h2>
        </div>

        <div class="blog-list__grid">
          @for (post of topStories; track post.slug) {
            <a [routerLink]="['/blog', post.slug]" class="bl-card">
              <div class="bl-card__meta">
                <span class="bl-card__cat">{{
                  categoryLabels[post.category]
                }}</span>
                <span class="bl-card__time"
                  >{{ post.readingTime }} min read</span
                >
                @if (post.featured) {
                  <span class="bl-card__feat">Featured</span>
                }
              </div>
              <h3 class="bl-card__title">{{ post.title }}</h3>
              @if (post.subtitle) {
                <p class="bl-card__sub">{{ post.subtitle }}</p>
              }
              <p class="bl-card__excerpt">{{ post.excerpt }}</p>
              <div class="bl-card__footer">
                <span class="bl-card__author">{{ post.author }}</span>
                <span class="bl-card__date">{{
                  post.datePublished | date: 'MMMM y'
                }}</span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    @if (sectionGroups.length) {
      <section class="blog-sections section section--dark">
        <div class="container">
          @for (group of sectionGroups; track group.key) {
            @if (group.posts.length) {
              <div class="essay-section">
                <div class="essay-section__header">
                  <span class="eyebrow">{{ group.label }}</span>
                </div>

                <div class="essay-section__list">
                  @for (post of group.posts; track post.slug) {
                    <article class="essay-item">
                      <span class="essay-item__meta"
                        >{{ post.datePublished | date: 'MMM d, y' }} ·
                        {{ post.readingTime }} min read</span
                      >
                      <h3>
                        <a [routerLink]="['/blog', post.slug]">{{
                          post.title
                        }}</a>
                      </h3>
                      <p>{{ post.excerpt }}</p>
                    </article>
                  }
                </div>
              </div>
            }
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      @use '../../../styles/tokens' as *;
      @use '../../../styles/mixins' as *;

      .blog-hero {
        padding-block: var(--space-20) var(--space-12);
      }
      .blog-hero__shell {
        display: grid;
        gap: var(--space-8);
      }
      .blog-hero__masthead {
        max-width: 52rem;
      }
      .blog-hero__masthead h1 {
        margin-bottom: var(--space-5);
      }
      .blog-hero__masthead p {
        max-width: 42rem;
        color: rgba(244, 239, 230, 0.72);
      }

      .blog-hero__toolbar {
        display: grid;
        gap: var(--space-5);
      }
      .blog-search {
        display: block;
      }
      .blog-search input {
        width: 100%;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(201, 169, 97, 0.25);
        border-radius: var(--border-radius);
        background: rgba(18, 21, 43, 0.5);
        color: var(--color-ivory);
        font: inherit;
      }
      .blog-search input::placeholder {
        color: var(--color-text-muted);
      }
      .blog-filters {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }
      .blog-filter {
        border: 1px solid rgba(201, 169, 97, 0.2);
        background: transparent;
        color: var(--color-ivory);
        padding: 0.55rem 0.8rem;
        border-radius: 999px;
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        cursor: pointer;
      }
      .blog-filter--active {
        background: rgba(201, 169, 97, 0.14);
        color: var(--color-gold);
        border-color: rgba(201, 169, 97, 0.5);
      }

      .featured-story {
        padding-block: 0 var(--space-12);
      }
      .featured-story__frame {
        display: grid;
        gap: var(--space-8);
        align-items: stretch;
        padding: var(--space-6);
        background: linear-gradient(
          180deg,
          rgba(34, 39, 74, 0.95),
          rgba(27, 31, 59, 0.82)
        );
        border: 1px solid rgba(201, 169, 97, 0.14);
        border-radius: var(--border-radius-lg);
        @include bp(lg) {
          grid-template-columns: 1.5fr 0.9fr;
        }
      }
      .featured-story__copy {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }
      .featured-story__meta {
        font-size: var(--text-xs);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--color-gold);
      }
      .featured-story__copy h2 {
        font-size: clamp(2rem, 4vw, 3.2rem);
        margin: 0;
      }
      .featured-story__copy a {
        color: var(--color-ivory);
      }
      .featured-story__subtitle {
        font-family: $font-display;
        font-size: clamp(1.4rem, 2.2vw, 2rem);
        color: var(--color-silver);
        font-style: italic;
      }
      .featured-story__excerpt {
        color: rgba(244, 239, 230, 0.72);
        max-width: none;
      }
      .featured-story__byline {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
      }
      .featured-story__media {
        display: flex;
        align-items: stretch;
      }
      .edition-panel {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 100%;
        min-height: 100%;
        padding: var(--space-6);
        background: linear-gradient(
          135deg,
          rgba(201, 169, 97, 0.12),
          rgba(17, 22, 40, 0.8)
        );
        border: 1px solid rgba(201, 169, 97, 0.2);
        border-radius: var(--border-radius-md);
        position: relative;
        overflow: hidden;
      }
      .edition-panel::before {
        content: '';
        position: absolute;
        inset: 1rem;
        border: 1px solid rgba(244, 239, 230, 0.12);
      }
      .edition-panel__label {
        font-size: var(--text-xs);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--color-gold);
      }
      .edition-panel strong {
        display: block;
        margin-block: var(--space-5);
        font-size: clamp(1.5rem, 2vw, 2.5rem);
        line-height: 1.08;
        letter-spacing: -0.03em;
        color: var(--color-ivory);
      }
      .edition-panel__grid {
        display: flex;
        justify-content: space-between;
        gap: var(--space-3);
        font-size: var(--text-xs);
        color: var(--color-silver);
        text-transform: uppercase;
      }

      .blog-list {
        padding-block: var(--space-4) var(--space-12);
      }
      .section-heading {
        margin-bottom: var(--space-6);
      }
      .section-heading h2 {
        margin: 0;
        font-size: clamp(2rem, 3vw, 2.8rem);
      }
      .blog-list__grid {
        display: grid;
        gap: var(--space-6);
        grid-template-columns: 1fr;
        @include bp(md) {
          grid-template-columns: 1fr 1fr;
        }
        @include bp(xl) {
          grid-template-columns: 1fr 1fr 1fr;
        }
      }
      .bl-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-6);
        background: rgba(34, 39, 74, 0.7);
        border: 1px solid rgba(201, 169, 97, 0.12);
        text-decoration: none;
        transition:
          border-color var(--duration),
          transform var(--duration),
          box-shadow var(--duration);
        &:hover {
          border-color: rgba(201, 169, 97, 0.35);
          transform: translateY(-2px);
          box-shadow: var(--shadow-card);
        }
      }
      .bl-card__meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-2) var(--space-3);
      }
      .bl-card__cat {
        font-size: var(--text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--color-gold);
      }
      .bl-card__time {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }
      .bl-card__feat {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--color-navy);
        background: var(--color-gold);
        padding: 0.2rem 0.45rem;
        border-radius: 999px;
      }
      .bl-card__title {
        font-size: clamp(1.3rem, 2vw, 2rem);
        color: var(--color-ivory);
        line-height: 1.2;
      }
      .bl-card__sub {
        font-family: $font-display;
        color: var(--color-silver);
        font-style: italic;
        max-width: none;
      }
      .bl-card__excerpt {
        font-size: var(--text-sm);
        color: rgba(244, 239, 230, 0.7);
        line-height: 1.7;
        flex: 1;
        max-width: none;
      }
      .bl-card__footer {
        display: flex;
        justify-content: space-between;
        gap: var(--space-3);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        margin-top: auto;
        padding-top: var(--space-3);
        border-top: 1px solid rgba(201, 169, 97, 0.08);
      }

      .blog-sections {
        padding-block: 0 var(--space-20);
      }
      .essay-section {
        padding-block: var(--space-6);
        border-top: 1px solid rgba(201, 169, 97, 0.12);
      }
      .essay-section:first-child {
        border-top: none;
      }
      .essay-section__header {
        margin-bottom: var(--space-4);
      }
      .essay-section__list {
        display: grid;
        gap: var(--space-5);
      }
      .essay-item {
        padding-bottom: var(--space-5);
        border-bottom: 1px solid rgba(201, 169, 97, 0.1);
      }
      .essay-item:last-child {
        border-bottom: none;
      }
      .essay-item__meta {
        display: block;
        margin-bottom: var(--space-2);
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .essay-item h3 {
        margin-bottom: var(--space-2);
      }
      .essay-item p {
        font-size: var(--text-sm);
        color: rgba(244, 239, 230, 0.7);
        max-width: none;
      }
    `,
  ],
})
export class BlogComponent implements OnInit {
  private content = inject(ContentService);
  private seo = inject(SeoService);

  posts: BlogPost[] = [];
  filteredPosts: BlogPost[] = [];
  featuredStory?: BlogPost;
  topStories: BlogPost[] = [];
  sectionGroups: Array<{ key: string; label: string; posts: BlogPost[] }> = [];
  searchTerm = '';
  selectedCategory = 'all';

  categoryOptions = [
    { value: 'all', label: 'All' },
    { value: 'patent-strategy', label: 'Patent Strategy' },
    { value: 'india-ip', label: 'India IP' },
    { value: 'ai-tools', label: 'AI & IP' },
    { value: 'innovation-paradox', label: 'Innovation' },
    { value: 'examiner-traps', label: 'Examiners' },
  ];

  categoryLabels: Record<string, string> = {
    'patent-strategy': 'Patent Strategy',
    'india-ip': 'India IP',
    'ai-tools': 'AI & IP',
    'innovation-paradox': 'Innovation',
    'examiner-traps': 'Examiner Traps',
    'global-ip': 'Global IP',
    'case-law': 'Case Analysis',
  };

  ngOnInit(): void {
    this.seo.update({
      title: 'Blog & Resources',
      description:
        "Essays on patent strategy, examiner traps, India's innovation paradox, and AI tools for IP work - from The Patent Architect.",
    });

    this.content.getBlogPosts().subscribe((posts) => {
      this.posts = posts;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const query = this.searchTerm.trim().toLowerCase();
    const nextPosts = this.posts.filter((post) => {
      const matchesCategory =
        this.selectedCategory === 'all' ||
        post.category === this.selectedCategory;
      const haystack =
        `${post.title} ${post.subtitle ?? ''} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesCategory && matchesQuery;
    });

    this.filteredPosts = nextPosts;
    this.featuredStory =
      nextPosts.find((post) => post.featured) ?? nextPosts[0];
    this.topStories = nextPosts
      .filter((post) => post.slug !== this.featuredStory?.slug)
      .slice(0, 3);

    const byCategory = Array.from(
      new Set(nextPosts.map((post) => post.category)),
    ).map((category) => ({
      key: category,
      label: this.categoryLabels[category] ?? category,
      posts: nextPosts.filter((post) => post.category === category).slice(0, 3),
    }));

    this.sectionGroups = byCategory.filter((group) => group.posts.length > 0);
  }
}
