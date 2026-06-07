import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { BlogPost } from '../../core/models/content.models';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';

@Component({
  selector: 'pa-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, HairlineRuleComponent, BlueprintGridComponent],
  template: `
    <pa-blueprint-grid opacity="0.04">
      <section class="blog-hero section section--dark">
        <div class="container">
          <span class="eyebrow">Blog &amp; Resources</span>
          <h1>Essays, Frameworks &amp; Analysis</h1>
          <p>Deep-dives into patent strategy, examiner traps, India's innovation landscape, and AI tools for IP work.</p>
        </div>
      </section>
    </pa-blueprint-grid>

    <section class="blog-list section section--dark">
      <div class="container">
        <div class="blog-list__grid">
          @for (post of posts; track post.slug) {
            <a [routerLink]="['/blog', post.slug]" class="bl-card">
              <div class="bl-card__meta">
                <span class="bl-card__cat">{{post.category | titlecase}}</span>
                <span class="bl-card__time">{{post.readingTime}} min read</span>
                @if (post.featured) { <span class="bl-card__feat">Featured</span> }
              </div>
              <h2 class="bl-card__title">{{post.title}}</h2>
              @if (post.subtitle) { <p class="bl-card__sub">{{post.subtitle}}</p> }
              <p class="bl-card__excerpt">{{post.excerpt}}</p>
              <div class="bl-card__footer">
                <span class="bl-card__author">{{post.author}}</span>
                <span class="bl-card__date">{{post.datePublished | date:'MMMM y'}}</span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    @use '../../../styles/mixins' as *;
    .blog-hero { padding-block: var(--space-16) var(--space-8); h1 { margin-bottom: var(--space-3); } p { color: rgba(244,239,230,0.7); } }
    .blog-list { padding-block: var(--space-4) var(--space-16); }
    .blog-list__grid { display: grid; gap: var(--space-6); grid-template-columns: 1fr; @include bp(md) { grid-template-columns: 1fr 1fr; } @include bp(xl) { grid-template-columns: 1fr 1fr 1fr; } }
    .bl-card { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-6); background: var(--color-surface-1); border: 1px solid rgba(201,169,97,0.1); border-radius: var(--border-radius-md); text-decoration: none; transition: all var(--duration); &:hover { border-color: rgba(201,169,97,0.3); transform: translateY(-2px); box-shadow: var(--shadow-card); } }
    .bl-card__meta { display: flex; align-items: center; gap: var(--space-3); }
    .bl-card__cat { font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-gold); }
    .bl-card__time { font-size: var(--text-xs); color: var(--color-text-muted); }
    .bl-card__feat { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--color-navy); background: var(--color-gold); padding: 2px 6px; border-radius: 3px; }
    .bl-card__title { font-family: $font-display; font-size: var(--text-xl); color: var(--color-ivory); line-height: 1.25; }
    .bl-card__sub { font-style: italic; font-size: var(--text-sm); color: var(--color-silver); max-width: none; }
    .bl-card__excerpt { font-size: var(--text-sm); color: rgba(244,239,230,0.65); line-height: 1.65; flex: 1; max-width: none; }
    .bl-card__footer { display: flex; justify-content: space-between; font-size: var(--text-xs); color: var(--color-text-muted); margin-top: auto; padding-top: var(--space-3); border-top: 1px solid rgba(201,169,97,0.08); }
  `]
})
export class BlogComponent implements OnInit {
  private content = inject(ContentService);
  private seo     = inject(SeoService);
  posts: BlogPost[] = [];
  ngOnInit(): void {
    this.seo.update({ title: 'Blog & Resources', description: 'Essays on patent strategy, examiner traps, India\'s innovation paradox, and AI tools for IP work - from The Patent Architect.' });
    this.content.getBlogPosts().subscribe(p => this.posts = p);
  }
}
