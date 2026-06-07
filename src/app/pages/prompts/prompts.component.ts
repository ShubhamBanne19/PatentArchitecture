import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { Prompt, PromptCategory } from '../../core/models/content.models';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { ReplacePipe } from '../../shared/pipes/replace.pipe';
import { TitleCasePipe } from '@angular/common';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';

interface CategoryFilter {
  value: string;
  label: string;
}

@Component({
  selector: 'pa-prompts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BtnComponent, HairlineRuleComponent, BlueprintGridComponent, ReplacePipe, TitleCasePipe],
  templateUrl: './prompts.component.html',
  styleUrls: ['./prompts.component.scss']
})
export class PromptsComponent implements OnInit {
  private content = inject(ContentService);
  private seo     = inject(SeoService);
  private route   = inject(ActivatedRoute);

  allPrompts: Prompt[]   = [];
  searchQuery = signal('');
  activeCategory = signal<string>('all');
  activeJurisdiction = signal<string>('all');
  copiedId = signal<string | undefined>(undefined);
  expandedId = signal<string | undefined>(undefined);
  loading = true;

  categories: CategoryFilter[] = [
    { value: 'all',              label: 'All Categories' },
    { value: 'drafting',         label: 'Drafting' },
    { value: 'claims-analysis',  label: 'Claims Analysis' },
    { value: 'prosecution',      label: 'Prosecution' },
    { value: 'office-action',    label: 'Office Actions' },
    { value: 'prior-art',        label: 'Prior Art' },
    { value: 'freedom-to-operate', label: 'FTO' },
    { value: 'strategy',         label: 'Strategy' },
    { value: 'research',         label: 'Research' },
  ];

  jurisdictions = ['all', 'ANY', 'IN', 'US', 'EP', 'PCT'];

  filteredPrompts = computed(() => {
    let list = this.allPrompts;
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.activeCategory();
    const j = this.activeJurisdiction();

    if (q) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (cat !== 'all') {
      list = list.filter(p => p.category === cat);
    }
    if (j !== 'all') {
      list = list.filter(p => p.jurisdiction.includes(j) || p.jurisdiction.includes('ANY'));
    }
    return list;
  });

  ngOnInit(): void {
    this.seo.update({
      title: 'AI Prompt Library',
      description: 'The Patent Architect AI Prompt Library - 60+ tested, annotated prompts for every stage of the patent lifecycle, from drafting to prosecution to FTO.',
      keywords: 'AI patent prompts, patent drafting AI, LLM patent, ChatGPT patent, Claude patent',
    });

    this.content.getPrompts().subscribe(prompts => {
      this.allPrompts = prompts;
      this.loading = false;

      // handle deep-link from chapter companion ?id=
      this.route.queryParams.subscribe(params => {
        if (params['id']) {
          this.expandedId.set(params['id']);
          setTimeout(() => {
            const el = document.getElementById(`prompt-${params['id']}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      });
    });
  }

  copyPrompt(prompt: Prompt): void {
    navigator.clipboard.writeText(prompt.promptText).then(() => {
      this.copiedId.set(prompt.promptId);
      setTimeout(() => this.copiedId.set(undefined), 2200);
    });
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? undefined : id);
  }

  formatPromptText(text: string): string {
    return text.replace(/\[([A-Z\s]+)\]/g, '<mark class="prompt-var">[$1]</mark>');
  }
}
