import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';
import { SeoService } from '../../../core/services/seo.service';
import { Chapter, Prompt, ErrataEntry } from '../../../core/models/content.models';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { HairlineRuleComponent } from '../../../shared/components/hairline-rule/hairline-rule.component';
import { forkJoin } from 'rxjs';
import { ReplacePipe } from '../../../shared/pipes/replace.pipe';
import { TitleCasePipe } from '@angular/common';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'pa-chapter-companion',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, CardComponent, HairlineRuleComponent, ReplacePipe, TitleCasePipe],
  templateUrl: './chapter-companion.component.html',
  styleUrls: ['./chapter-companion.component.scss']
})
export class ChapterCompanionComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private content = inject(ContentService);
  private seo     = inject(SeoService);

  chapter?: Chapter;
  prompts: Prompt[]        = [];
  errata: ErrataEntry[]    = [];
  copiedPromptId?: string;
  loading = true;
  notFound = false;

  ngOnInit(): void {
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'];
        return forkJoin({
          chapter: this.content.getChapter(id),
          prompts: this.content.getPromptsByChapter(id),
          errata:  this.content.getErrataByChapter(id),
        });
      })
    ).subscribe(({ chapter, prompts, errata }) => {
      if (!chapter) {
        this.notFound = true;
        this.loading  = false;
        return;
      }
      this.chapter = chapter;
      this.prompts = prompts;
      this.errata  = errata;
      this.loading = false;

      this.seo.update({
        title: `Chapter ${chapter.number}: ${chapter.title}`,
        description: chapter.summary,
        keywords: chapter.keyTopics.join(', '),
      });
    });
  }

  copyPrompt(prompt: Prompt): void {
    navigator.clipboard.writeText(prompt.promptText).then(() => {
      this.copiedPromptId = prompt.promptId;
      setTimeout(() => { this.copiedPromptId = undefined; }, 2200);
    });
  }

  get hasChangedFigures(): boolean {
    return this.chapter?.figures.some(f => f.changedSincePrint) ?? false;
  }

  get hasFeeData(): boolean {
    return this.chapter?.figures.some(f => f.dataType === 'fee') ?? false;
  }

  prevChapterId(): string | null {
    if (!this.chapter || this.chapter.number <= 1) return null;
    const n = String(this.chapter.number - 1).padStart(2, '0');
    return `chapter-${n}`;
  }

  nextChapterId(): string | null {
    if (!this.chapter || this.chapter.number >= 19) return null;
    const n = String(this.chapter.number + 1).padStart(2, '0');
    return `chapter-${n}`;
  }
}
