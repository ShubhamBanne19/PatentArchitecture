import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';
import { SeoService } from '../../../core/services/seo.service';
import { BlogPost } from '../../../core/models/content.models';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { HairlineRuleComponent } from '../../../shared/components/hairline-rule/hairline-rule.component';
import { MarkdownModule } from 'ngx-markdown';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'pa-blog-post',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, HairlineRuleComponent, MarkdownModule],
  template: `
    @if (loading) {
      <div class="post-loading section section--dark"><div class="container"><p>Loading…</p></div></div>
    } @else if (!post) {
      <div class="post-not-found section section--dark">
        <div class="container">
          <h1>Post not found</h1>
          <pa-btn variant="primary" routerLink="/blog">Back to Blog</pa-btn>
        </div>
      </div>
    } @else {
      <article>
        <header class="post-header section section--dark">
          <div class="container">
            <div class="post-header__breadcrumb">
              <a routerLink="/blog">Blog</a> / <span>{{post.category | titlecase}}</span>
            </div>
            <div class="post-header__meta">
              <span class="post-header__cat">{{post.category | titlecase}}</span>
              <span class="post-header__time">{{post.readingTime}} min read</span>
            </div>
            <h1 class="post-header__title">{{post.title}}</h1>
            @if (post.subtitle) { <p class="post-header__sub">{{post.subtitle}}</p> }
            <div class="post-header__byline">
              <strong>{{post.author}}</strong>
              <span>·</span>
              <span>{{post.datePublished | date:'MMMM d, y'}}</span>
              @if (post.lastUpdated && post.lastUpdated !== post.datePublished) {
                <span>· Updated {{post.lastUpdated | date:'MMMM d, y'}}</span>
              }
            </div>
          </div>
        </header>

        <pa-rule></pa-rule>

        <div class="post-body section section--dark">
          <div class="container">
            <div class="prose">
              <markdown [src]="post.contentPath" (error)="onMarkdownError()"></markdown>
            </div>
          </div>
        </div>

        <footer class="post-footer section section--surface">
          <div class="container">
            <div class="post-footer__inner">
              <pa-btn variant="outline" routerLink="/blog">← All Essays</pa-btn>
              <pa-btn variant="primary" href="https://www.amazon.in" [external]="true">Buy the Book →</pa-btn>
            </div>
          </div>
        </footer>
      </article>
    }
  `,
  styles: [`
    @use '../../../../styles/tokens' as *;
    @use '../../../../styles/mixins' as *;
    .post-loading, .post-not-found { padding-block: var(--space-20); text-align: center; }
    .post-header { padding-block: var(--space-12) var(--space-8); }
    .post-header__breadcrumb { font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); a { color: var(--color-gold); text-decoration: underline; text-underline-offset: 2px; } }
    .post-header__meta { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); }
    .post-header__cat { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-gold); }
    .post-header__time { font-size: var(--text-xs); color: var(--color-text-muted); }
    .post-header__title { font-size: clamp(1.75rem, 4vw, 3rem); margin-bottom: var(--space-3); }
    .post-header__sub { font-family: $font-display; font-style: italic; font-size: var(--text-xl); color: var(--color-silver); margin-bottom: var(--space-4); max-width: none; }
    .post-header__byline { font-size: var(--text-sm); color: var(--color-silver); display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .post-body { padding-block: var(--space-8) var(--space-16); }
    .prose {
      max-width: var(--max-width-prose);
      h1,h2,h3,h4 { font-family: $font-display; color: var(--color-ivory); margin-block: var(--space-6) var(--space-3); }
      h2 { font-size: var(--text-2xl); border-bottom: 1px solid rgba(201,169,97,0.15); padding-bottom: var(--space-3); }
      h3 { font-size: var(--text-xl); }
      p  { color: rgba(244,239,230,0.78); margin-bottom: var(--space-4); line-height: 1.8; max-width: none; }
      ul,ol { color: rgba(244,239,230,0.78); margin-bottom: var(--space-4); padding-left: var(--space-6); }
      li { margin-bottom: var(--space-2); line-height: 1.7; list-style: disc; }
      blockquote { border-left: 3px solid var(--color-gold); padding: var(--space-4) var(--space-5); background: rgba(201,169,97,0.04); margin-block: var(--space-6); font-style: italic; }
      strong { color: var(--color-ivory); font-weight: 600; }
      em { color: var(--color-silver); }
      hr { border: none; border-top: 1px solid rgba(201,169,97,0.2); margin-block: var(--space-8); }
      a { color: var(--color-gold); text-decoration: underline; text-underline-offset: 3px; }
      code { font-family: $font-mono; font-size: 0.9em; background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 3px; }
    }
    .post-footer { padding-block: var(--space-8); }
    .post-footer__inner { display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
  `]
})
export class BlogPostComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private content = inject(ContentService);
  private seo     = inject(SeoService);

  post?: BlogPost;
  loading = true;

  ngOnInit(): void {
    this.route.params.pipe(
      switchMap(params => this.content.getBlogPost(params['slug']))
    ).subscribe(post => {
      this.post = post;
      this.loading = false;
      if (post) {
        this.seo.update({
          title: post.title,
          description: post.excerpt,
          ogType: 'article',
        });
      }
    });
  }

  onMarkdownError(): void {
    console.warn('Could not load markdown content');
  }
}
