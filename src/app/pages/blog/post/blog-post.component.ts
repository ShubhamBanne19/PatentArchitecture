import {
  Component,
  OnInit,
  inject,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';
import { SeoService } from '../../../core/services/seo.service';
import {
  SiteConfigService,
  SiteConfig,
} from '../../../core/services/site-config.service';
import { BlogPost } from '../../../core/models/content.models';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../../shared/components/hairline-rule/hairline-rule.component';
import { MarkdownModule } from 'ngx-markdown';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'pa-blog-post',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BtnComponent,
    HairlineRuleComponent,
    MarkdownModule,
  ],
  template: `
    @if (loading) {
      <div class="post-loading section section--dark">
        <div class="container"><p>Loading…</p></div>
      </div>
    } @else if (!post) {
      <div class="post-not-found section section--dark">
        <div class="container">
          <h1>Post not found</h1>
          <pa-btn variant="primary" routerLink="/blog">Back to Blog</pa-btn>
        </div>
      </div>
    } @else {
      <article
        class="article-shell"
        [class.article-shell--light]="isLightMode"
        [style.--article-font-size.px]="fontSizePx"
      >
        <div class="reading-progress" aria-hidden="true">
          <span [style.width.%]="readingProgress"></span>
        </div>

        <header class="post-header section section--dark">
          <div class="container">
            <div class="post-header__breadcrumb">
              <a routerLink="/blog">Blog</a> /
              <span>{{ post.category | titlecase }}</span>
            </div>

            <div class="post-header__meta">
              <span class="post-header__cat">{{
                post.category | titlecase
              }}</span>
              <span class="post-header__time"
                >{{ post.readingTime }} min read</span
              >
            </div>

            <div class="post-header__layout">
              <div class="post-header__content">
                <h1 class="post-header__title">{{ post.title }}</h1>
                @if (post.subtitle) {
                  <p class="post-header__sub">{{ post.subtitle }}</p>
                }
                <div class="post-header__byline">
                  <strong>{{ post.author }}</strong>
                  <span>·</span>
                  <span>{{ post.datePublished | date: 'MMMM d, y' }}</span>
                  @if (
                    post.lastUpdated && post.lastUpdated !== post.datePublished
                  ) {
                    <span
                      >· Updated
                      {{ post.lastUpdated | date: 'MMMM d, y' }}</span
                    >
                  }
                </div>
              </div>

              <aside class="post-header__panel" aria-label="Editorial summary">
                <div class="post-header__panel-label">The Patent Architect</div>
                <div class="post-header__panel-copy">
                  <span>{{ post.readingTime }} min read</span>
                  <span>{{ post.category | titlecase }}</span>
                </div>
              </aside>
            </div>
          </div>
        </header>

        <div class="article-tools section section--dark">
          <div class="container article-tools__inner">
            <div
              class="article-tools__group article-tools__group--toc"
              aria-label="Article navigation"
            >
              <span class="article-tools__label">In this essay</span>
              @if (toc.length) {
                <nav class="article-toc">
                  @for (item of toc; track item.id) {
                    <a
                      [href]="'#' + item.id"
                      [class.article-toc__link--active]="
                        item.id === activeSection
                      "
                      [style.--toc-depth]="item.level"
                    >
                      {{ item.title }}
                    </a>
                  }
                </nav>
              }
            </div>

            <div class="article-tools__group article-tools__group--controls">
              <button
                type="button"
                class="article-tool"
                (click)="decreaseTextSize()"
                aria-label="Decrease text size"
              >
                A-
              </button>
              <button
                type="button"
                class="article-tool"
                (click)="increaseTextSize()"
                aria-label="Increase text size"
              >
                A+
              </button>
              <button
                type="button"
                class="article-tool"
                (click)="toggleTheme()"
                aria-label="Toggle reading theme"
              >
                {{ isLightMode ? 'Dark' : 'Light' }}
              </button>
              <button
                type="button"
                class="article-tool"
                (click)="toggleBookmark()"
                aria-label="Bookmark article"
              >
                {{ isBookmarked ? 'Saved' : 'Save' }}
              </button>
              <button
                type="button"
                class="article-tool"
                (click)="shareArticle()"
                aria-label="Share article"
              >
                Share
              </button>
              <button
                type="button"
                class="article-tool"
                (click)="printArticle()"
                aria-label="Print article"
              >
                Print
              </button>
            </div>
          </div>
        </div>

        <div class="post-body section section--dark">
          <div class="container article-layout">
            <div class="article-content-wrap">
              <div class="prose" #articleContent>
                @if (contentError) {
                  <p class="post-body__error">
                    This essay could not be loaded. Please try refreshing the
                    page.
                  </p>
                } @else {
                  <markdown
                    [src]="post.contentPath"
                    (error)="onMarkdownError()"
                  ></markdown>
                }
              </div>
            </div>

            <aside class="article-summary">
              <div class="article-summary__card">
                <span class="article-summary__eyebrow">Reading Notes</span>
                <ul>
                  <li>
                    Original publication date:
                    {{ post.datePublished | date: 'MMMM d, y' }}
                  </li>
                  <li>{{ post.tags.slice(0, 3).join(' · ') }}</li>
                  <li>{{ post.readingTime }} minute read</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>

        @if (relatedPosts.length) {
          <section class="related section section--surface">
            <div class="container">
              <div class="section-heading section-heading--tight">
                <span class="eyebrow">Continue reading</span>
                <h2>Related stories</h2>
              </div>

              <div class="related__grid">
                @for (item of relatedPosts; track item.slug) {
                  <a [routerLink]="['/blog', item.slug]" class="related-card">
                    <span class="related-card__meta"
                      >{{ item.category | titlecase }} ·
                      {{ item.readingTime }} min</span
                    >
                    <h3>{{ item.title }}</h3>
                    <p>{{ item.excerpt }}</p>
                  </a>
                }
              </div>
            </div>
          </section>
        }

        <footer class="post-footer section section--surface">
          <div class="container">
            <div class="post-footer__inner">
              <pa-btn variant="outline" routerLink="/blog">← All Essays</pa-btn>
              @if (siteConfig?.isLive) {
                <pa-btn
                  variant="primary"
                  [href]="siteConfig!.amazonUrl"
                  [external]="true"
                  >Buy the Book →</pa-btn
                >
              } @else {
                <pa-btn variant="outline" routerLink="/newsletter"
                  >Coming {{ siteConfig?.launchDateDisplay }}</pa-btn
                >
              }
            </div>
          </div>
        </footer>
      </article>
    }
  `,
  styles: [
    `
      @use '../../../../styles/tokens' as *;
      @use '../../../../styles/mixins' as *;

      .article-shell {
        --article-font-size: 18px;
        --article-bg: rgba(17, 21, 39, 0.35);
        --article-surface: rgba(17, 21, 39, 0.5);
        --article-text: rgba(244, 239, 230, 0.82);
        --article-heading: var(--color-ivory);
        --article-muted: rgba(244, 239, 230, 0.7);
        --article-link: var(--color-gold);
        --article-rule: rgba(201, 169, 97, 0.15);
      }
      .article-shell--light {
        --article-bg: rgba(255, 255, 255, 0.96);
        --article-surface: rgba(248, 244, 238, 0.96);
        --article-text: rgba(15, 18, 38, 0.9);
        --article-heading: #0f1226;
        --article-muted: rgba(15, 18, 38, 0.72);
        --article-link: #10172e;
        --article-rule: rgba(15, 18, 38, 0.18);
      }
      .article-shell--light .prose {
        background: var(--article-bg);
        color: var(--article-text);
      }
      .article-shell--light .article-summary__card {
        background: var(--article-surface);
        border-color: rgba(27, 31, 59, 0.12);
      }
      .article-shell--light .article-summary__card li {
        color: var(--article-text);
      }

      .reading-progress {
        position: sticky;
        top: 0;
        z-index: 20;
        height: 3px;
        width: 100%;
        background: rgba(201, 169, 97, 0.14);
      }
      .reading-progress span {
        display: block;
        height: 100%;
        width: 0;
        background: linear-gradient(
          90deg,
          var(--color-gold),
          var(--color-gold-light)
        );
      }

      .post-loading,
      .post-not-found {
        padding-block: var(--space-20);
        text-align: center;
      }
      .post-header {
        padding-block: var(--space-12) var(--space-8);
      }
      .post-header__breadcrumb {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        margin-bottom: var(--space-4);
        a {
          color: var(--color-gold);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      }
      .post-header__meta {
        display: flex;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .post-header__cat {
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-gold);
      }
      .post-header__time {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }
      .post-header__layout {
        display: grid;
        gap: var(--space-6);
        @include bp(lg) {
          grid-template-columns: minmax(0, 1.7fr) minmax(220px, 0.6fr);
          align-items: end;
        }
      }
      .post-header__title {
        font-size: clamp(2.2rem, 5vw, 4.4rem);
        margin-bottom: var(--space-4);
      }
      .post-header__sub {
        font-family: $font-display;
        font-style: italic;
        font-size: clamp(1.5rem, 2vw, 2.1rem);
        color: var(--color-silver);
        margin-bottom: var(--space-4);
        max-width: none;
      }
      .post-header__byline {
        font-size: var(--text-sm);
        color: var(--color-silver);
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .post-header__panel {
        background: rgba(34, 39, 74, 0.8);
        border: 1px solid rgba(201, 169, 97, 0.14);
        border-radius: var(--border-radius-md);
        padding: var(--space-5);
        min-height: 100%;
      }
      .post-header__panel-label {
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--color-gold);
        margin-bottom: var(--space-4);
      }
      .post-header__panel-copy {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        color: var(--color-silver);
      }

      .article-tools {
        padding-block: var(--space-2) var(--space-8);
      }
      .article-tools__inner {
        display: grid;
        gap: var(--space-4);
        @include bp(lg) {
          grid-template-columns: minmax(0, 1.1fr) auto;
          align-items: center;
        }
      }
      .article-tools__group {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        align-items: center;
      }
      .article-tools__group--controls {
        justify-content: flex-start;
        @include bp(lg) {
          justify-content: flex-end;
        }
      }
      .article-tools__label {
        font-size: var(--text-xs);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--color-text-muted);
      }
      .article-toc {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }
      .article-toc__link--active {
        color: var(--color-gold);
      }
      .article-tool {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        min-height: 2.2rem;
        padding: 0.45rem 0.8rem;
        border: 1px solid rgba(201, 169, 97, 0.25);
        background: rgba(34, 39, 74, 0.65);
        color: var(--color-ivory);
        border-radius: 999px;
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        cursor: pointer;
      }

      .post-body {
        padding-block: var(--space-6) var(--space-16);
      }
      .article-layout {
        display: grid;
        gap: var(--space-8);
        @include bp(lg) {
          grid-template-columns: minmax(0, 1fr) 15rem;
        }
      }
      .article-content-wrap {
        min-width: 0;
      }
      .prose {
        max-width: var(--max-width-prose);
        margin-inline: auto;
        padding: var(--space-8) clamp(1rem, 2vw, 2rem);
        background: var(--article-bg);
        border: 1px solid var(--article-rule);
        border-radius: var(--border-radius-lg);
        font-size: var(--article-font-size);
        line-height: 1.7;
        color: var(--article-text);
        h1,
        h2,
        h3,
        h4 {
          font-family: $font-display;
          color: var(--article-heading);
          margin-block: var(--space-6) var(--space-3);
        }
        h2 {
          font-size: clamp(1.7rem, 2.5vw, 2.5rem);
          border-bottom: 1px solid var(--article-rule);
          padding-bottom: var(--space-3);
        }
        h3 {
          font-size: clamp(1.3rem, 2vw, 2rem);
        }
        p,
        li,
        ul,
        ol,
        blockquote,
        strong,
        em,
        a {
          color: var(--article-text);
        }
        p {
          margin-bottom: var(--space-4);
          max-width: none;
        }
        ul,
        ol {
          margin-bottom: var(--space-4);
          padding-left: var(--space-6);
        }
        li {
          margin-bottom: var(--space-2);
          line-height: 1.7;
          list-style: disc;
        }
        blockquote {
          border-left: 3px solid var(--color-gold);
          padding: var(--space-4) var(--space-5);
          background: rgba(201, 169, 97, 0.04);
          margin-block: var(--space-6);
          font-style: italic;
        }
        strong {
          color: var(--article-heading);
          font-weight: 600;
        }
        em {
          color: var(--article-muted);
        }
        hr {
          border: none;
          border-top: 1px solid var(--article-rule);
          margin-block: var(--space-8);
        }
        a {
          color: var(--article-link);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        code {
          font-family: $font-mono;
          font-size: 0.9em;
          background: rgba(255, 255, 255, 0.06);
          padding: 1px 5px;
          border-radius: 3px;
        }
      }
      .article-summary {
        position: relative;
      }
      .article-summary__card {
        position: sticky;
        top: 5rem;
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-5);
        border: 1px solid rgba(201, 169, 97, 0.12);
        background: rgba(34, 39, 74, 0.7);
        border-radius: var(--border-radius-md);
      }
      .article-summary__eyebrow {
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-gold);
      }
      .article-summary__card ul {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        list-style: none;
      }
      .article-summary__card li {
        color: rgba(244, 239, 230, 0.8);
        font-size: var(--text-sm);
      }

      .post-body__error {
        color: var(--color-silver);
        font-style: italic;
        padding: var(--space-8) 0;
      }

      .related {
        padding-block: var(--space-4) var(--space-12);
      }
      .section-heading--tight {
        margin-bottom: var(--space-6);
      }
      .related__grid {
        display: grid;
        gap: var(--space-5);
        @include bp(md) {
          grid-template-columns: 1fr 1fr 1fr;
        }
      }
      .related-card {
        display: block;
        padding: var(--space-5);
        background: rgba(17, 21, 39, 0.45);
        border: 1px solid rgba(201, 169, 97, 0.1);
        border-radius: var(--border-radius-md);
        text-decoration: none;
      }
      .related-card__meta {
        display: block;
        color: var(--color-gold);
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: var(--space-2);
      }
      .related-card h3 {
        margin-bottom: var(--space-2);
        font-size: clamp(1.3rem, 2vw, 1.75rem);
      }
      .related-card p {
        font-size: var(--text-sm);
        color: rgba(244, 239, 230, 0.72);
        max-width: none;
      }

      .post-footer {
        padding-block: var(--space-8);
      }
      .post-footer__inner {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--space-4);
      }
    `,
  ],
})
export class BlogPostComponent implements OnInit, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private content = inject(ContentService);
  private seo = inject(SeoService);
  private siteConfigSvc = inject(SiteConfigService);

  @ViewChild('articleContent', { static: false })
  articleContent?: ElementRef<HTMLElement>;

  post?: BlogPost;
  allPosts: BlogPost[] = [];
  relatedPosts: BlogPost[] = [];
  loading = true;
  contentError = false;
  siteConfig: SiteConfig | null = null;
  toc: Array<{ id: string; title: string; level: number }> = [];
  activeSection = '';
  readingProgress = 0;
  fontSizePx = 18;
  isLightMode = false;
  isBookmarked = false;

  ngOnInit(): void {
    this.siteConfigSvc.config$.subscribe((c) => (this.siteConfig = c));
    this.content.getBlogPosts().subscribe((posts) => {
      this.allPosts = posts;
      this.syncRelatedPosts();
    });

    this.route.params
      .pipe(switchMap((params) => this.content.getBlogPost(params['slug'])))
      .subscribe((post) => {
        this.post = post;
        this.loading = false;
        this.syncRelatedPosts();
        if (post) {
          this.isBookmarked = this.getStoredBookmark(post.slug);
          this.seo.update({
            title: post.title,
            description: post.excerpt,
            ogType: 'article',
          });
        }
      });
  }

  ngAfterViewChecked(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.buildToc();
    this.updateReadingProgress();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.updateReadingProgress();
    this.updateActiveSection();
  }

  private buildToc(): void {
    if (!this.articleContent || !this.post) {
      this.toc = [];
      return;
    }

    const headings = Array.from(
      this.articleContent.nativeElement.querySelectorAll('h2, h3'),
    ) as HTMLElement[];
    if (!headings.length) {
      this.toc = [];
      return;
    }

    const seen = new Set<string>();
    this.toc = headings.map((heading, index) => {
      const rawTitle = heading.textContent?.trim() ?? `Section ${index + 1}`;
      const idBase =
        rawTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `section-${index + 1}`;
      const id = seen.has(idBase) ? `${idBase}-${index + 1}` : idBase;
      seen.add(id);
      heading.id = id;
      return {
        id,
        title: rawTitle,
        level: Number(heading.tagName.replace('H', '')),
      };
    });

    if (!this.activeSection && this.toc.length) {
      this.activeSection = this.toc[0].id;
    }
  }

  private updateActiveSection(): void {
    if (!this.toc.length || typeof document === 'undefined') {
      return;
    }

    let current = this.toc[0].id;
    for (const item of this.toc) {
      const node = document.getElementById(item.id);
      if (node && node.getBoundingClientRect().top <= 180) {
        current = item.id;
      }
    }
    this.activeSection = current;
  }

  private updateReadingProgress(): void {
    if (!this.articleContent || typeof window === 'undefined') {
      return;
    }

    const articleElement = this.articleContent.nativeElement as HTMLElement;
    const articleTop = articleElement.offsetTop;
    const articleHeight = articleElement.offsetHeight;
    const viewportHeight = window.innerHeight;
    const totalDistance = Math.max(articleHeight - viewportHeight * 0.7, 1);
    const progress =
      ((window.scrollY - articleTop + 160) / totalDistance) * 100;
    this.readingProgress = Math.min(100, Math.max(0, progress));
  }

  private syncRelatedPosts(): void {
    const currentPost = this.post;
    if (!currentPost) {
      this.relatedPosts = [];
      return;
    }

    const sameCategory = this.allPosts.filter(
      (item) =>
        item.slug !== currentPost.slug &&
        item.category === currentPost.category,
    );
    const fallback = this.allPosts.filter(
      (item) => item.slug !== currentPost.slug,
    );
    this.relatedPosts = (sameCategory.length ? sameCategory : fallback).slice(
      0,
      3,
    );
  }

  private getStoredBookmark(slug: string): boolean {
    return (
      typeof window !== 'undefined' &&
      localStorage.getItem(`pa-bookmark-${slug}`) === 'true'
    );
  }

  decreaseTextSize(): void {
    this.fontSizePx = Math.max(15, this.fontSizePx - 1);
  }

  increaseTextSize(): void {
    this.fontSizePx = Math.min(24, this.fontSizePx + 1);
  }

  toggleTheme(): void {
    this.isLightMode = !this.isLightMode;
  }

  toggleBookmark(): void {
    if (!this.post || typeof window === 'undefined') {
      return;
    }

    this.isBookmarked = !this.isBookmarked;
    localStorage.setItem(
      `pa-bookmark-${this.post.slug}`,
      String(this.isBookmarked),
    );
  }

  shareArticle(): void {
    if (
      !this.post ||
      typeof window === 'undefined' ||
      typeof navigator === 'undefined'
    ) {
      return;
    }

    const url = window.location.href;
    const shareData = { title: this.post.title, text: this.post.excerpt, url };

    if (navigator.share) {
      navigator.share(shareData).catch(() => undefined);
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => undefined);
    }
  }

  printArticle(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  onMarkdownError(): void {
    this.contentError = true;
  }
}
