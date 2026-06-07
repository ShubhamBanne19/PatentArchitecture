import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, shareReplay, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Chapter, FeeSchedule, Prompt, BlogPost, Testimonial, ErrataEntry, FigureEntry
} from '../models/content.models';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);

  // ── Chapters ───────────────────────────────────────────────────────────────
  private chapters$?: Observable<Chapter[]>;

  getChapters(): Observable<Chapter[]> {
    if (!this.chapters$) {
      this.chapters$ = this.http
        .get<Chapter[]>('assets/content/chapters/chapters.json')
        .pipe(shareReplay(1));
    }
    return this.chapters$;
  }

  getChapter(id: string): Observable<Chapter | undefined> {
    return this.getChapters().pipe(
      map(chapters => chapters.find(c => c.id === id))
    );
  }

  getChaptersByPhase(phase: number): Observable<Chapter[]> {
    return this.getChapters().pipe(
      map(chapters => chapters.filter(c => c.phase === phase))
    );
  }

  // ── Fee Schedules ─────────────────────────────────────────────────────────
  private fees$?: Observable<FeeSchedule[]>;

  getFeeSchedules(): Observable<FeeSchedule[]> {
    if (!this.fees$) {
      this.fees$ = forkJoin([
        this.http.get<FeeSchedule>('assets/content/fees/india-ipo.json'),
        this.http.get<FeeSchedule>('assets/content/fees/uspto.json'),
        this.http.get<FeeSchedule>('assets/content/fees/epo.json'),
        this.http.get<FeeSchedule>('assets/content/fees/pct.json'),
      ]).pipe(
        map(schedules => schedules),
        shareReplay(1)
      );
    }
    return this.fees$;
  }

  getFeeSchedule(jurisdictionCode: string): Observable<FeeSchedule | undefined> {
    return this.getFeeSchedules().pipe(
      map(fees => fees.find(f => f.jurisdictionCode === jurisdictionCode))
    );
  }

  // ── Prompts ────────────────────────────────────────────────────────────────
  private prompts$?: Observable<Prompt[]>;

  getPrompts(): Observable<Prompt[]> {
    if (!this.prompts$) {
      this.prompts$ = this.http
        .get<Prompt[]>('assets/content/prompts/prompts.json')
        .pipe(shareReplay(1));
    }
    return this.prompts$;
  }

  getPromptsByChapter(chapterId: string): Observable<Prompt[]> {
    return this.getPrompts().pipe(
      map(prompts => prompts.filter(p => p.chapterIds.includes(chapterId)))
    );
  }

  getPromptsByCategory(category: string): Observable<Prompt[]> {
    return this.getPrompts().pipe(
      map(prompts => prompts.filter(p => p.category === category))
    );
  }

  getFeaturedPrompts(): Observable<Prompt[]> {
    return this.getPrompts().pipe(
      map(prompts => prompts.filter(p => p.featured))
    );
  }

  searchPrompts(query: string): Observable<Prompt[]> {
    const q = query.toLowerCase();
    return this.getPrompts().pipe(
      map(prompts => prompts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      ))
    );
  }

  // ── Errata ────────────────────────────────────────────────────────────────
  private errata$?: Observable<ErrataEntry[]>;

  getErrata(): Observable<ErrataEntry[]> {
    if (!this.errata$) {
      this.errata$ = this.http
        .get<ErrataEntry[]>('assets/content/errata/errata.json')
        .pipe(shareReplay(1));
    }
    return this.errata$;
  }

  getErrataByChapter(chapterId: string): Observable<ErrataEntry[]> {
    return this.getErrata().pipe(
      map(errata => errata.filter(e => e.chapterId === chapterId))
    );
  }

  // ── Blog Posts ────────────────────────────────────────────────────────────
  private posts$?: Observable<BlogPost[]>;

  getBlogPosts(): Observable<BlogPost[]> {
    if (!this.posts$) {
      this.posts$ = this.http
        .get<BlogPost[]>('assets/content/blog/index.json')
        .pipe(shareReplay(1));
    }
    return this.posts$;
  }

  getBlogPost(slug: string): Observable<BlogPost | undefined> {
    return this.getBlogPosts().pipe(
      map(posts => posts.find(p => p.slug === slug))
    );
  }

  getFeaturedPosts(): Observable<BlogPost[]> {
    return this.getBlogPosts().pipe(
      map(posts => posts.filter(p => p.featured))
    );
  }

  getBlogPostContent(contentPath: string): Observable<string> {
    return this.http.get(contentPath, { responseType: 'text' }).pipe(
      catchError(() => of('*Content coming soon.*'))
    );
  }

  // ── Testimonials ──────────────────────────────────────────────────────────
  private testimonials$?: Observable<Testimonial[]>;

  getTestimonials(): Observable<Testimonial[]> {
    if (!this.testimonials$) {
      this.testimonials$ = this.http
        .get<Testimonial[]>('assets/content/testimonials.json')
        .pipe(shareReplay(1));
    }
    return this.testimonials$;
  }

  // ── Changed Figures ────────────────────────────────────────────────────────
  getChangedFigures(): Observable<{ chapter: Chapter; figures: FigureEntry[] }[]> {
    return this.getChapters().pipe(
      map(chapters =>
        chapters
          .map(c => ({ chapter: c, figures: c.figures.filter(f => f.changedSincePrint) }))
          .filter(item => item.figures.length > 0)
      )
    );
  }
}
