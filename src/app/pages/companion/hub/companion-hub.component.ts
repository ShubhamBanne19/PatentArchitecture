import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';
import { SeoService } from '../../../core/services/seo.service';
import { Chapter, ErrataEntry, FeeSchedule } from '../../../core/models/content.models';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { HairlineRuleComponent } from '../../../shared/components/hairline-rule/hairline-rule.component';
import { BlueprintGridComponent } from '../../../shared/components/blueprint-grid/blueprint-grid.component';
import { forkJoin } from 'rxjs';
import { ReplacePipe } from '../../../shared/pipes/replace.pipe';

@Component({
  selector: 'pa-companion-hub',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnComponent, CardComponent, HairlineRuleComponent, BlueprintGridComponent, ReplacePipe, TitleCasePipe],
  templateUrl: './companion-hub.component.html',
  styleUrls: ['./companion-hub.component.scss']
})
export class CompanionHubComponent implements OnInit {
  private content = inject(ContentService);
  private seo     = inject(SeoService);

  chapters: Chapter[]      = [];
  errata: ErrataEntry[]    = [];
  fees: FeeSchedule[]      = [];
  changedFigures: { chapter: Chapter; figures: any[] }[] = [];
  loading = true;

  phases = [
    { num: 1, label: 'Foundations', range: '1–4' },
    { num: 2, label: 'Claims Drafting', range: '5–8' },
    { num: 3, label: 'Prosecution', range: '9–13' },
    { num: 4, label: 'AI & Strategy', range: '14–19' },
  ];

  ngOnInit(): void {
    this.seo.update({
      title: 'Living Companion Hub',
      description: 'The living companion to The Patent Architect - current fee schedules, errata, AI prompts, and updated statistics keyed to each chapter.',
    });

    forkJoin({
      chapters: this.content.getChapters(),
      errata: this.content.getErrata(),
      fees: this.content.getFeeSchedules(),
    }).subscribe(({ chapters, errata, fees }) => {
      this.chapters = chapters;
      this.errata   = errata;
      this.fees     = fees;
      this.changedFigures = chapters
        .map(c => ({ chapter: c, figures: c.figures.filter(f => f.changedSincePrint) }))
        .filter(item => item.figures.length > 0);
      this.loading = false;
    });
  }

  getChaptersForPhase(phase: number): Chapter[] {
    return this.chapters.filter(c => c.phase === phase);
  }

  chapterHasChangedFigures(ch: Chapter): boolean {
    return ch.figures.some(f => f.changedSincePrint);
  }

  feeLastUpdated(fees: FeeSchedule[]): string {
    if (!fees.length) return '';
    const latest = fees.reduce((a, b) =>
      new Date(a.lastUpdated) > new Date(b.lastUpdated) ? a : b
    );
    return latest.lastUpdated;
  }
}
