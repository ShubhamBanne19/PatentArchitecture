import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { ContentService } from '../../core/services/content.service';
import { SiteConfigService, SiteConfig } from '../../core/services/site-config.service';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { Testimonial, BlogPost } from '../../core/models/content.models';

@Component({
  selector: 'pa-home',
  standalone: true,
  imports: [CommonModule, RouterModule, BlueprintGridComponent, BtnComponent, CardComponent, HairlineRuleComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private seo            = inject(SeoService);
  private content        = inject(ContentService);
  private siteConfigSvc  = inject(SiteConfigService);

  siteConfig: SiteConfig | null = null;
  testimonials: Testimonial[]   = [];
  featuredPosts: BlogPost[]     = [];

  phases = [
    { num: 1, title: 'Foundations', chapters: '1–4',  desc: 'The patent system, patentability, subject-matter eligibility, and the anatomy of a patent document.' },
    { num: 2, title: 'Claims Drafting', chapters: '5–8', desc: 'The fortress metaphor, drafting methodology, specification writing, and examiner psychology.' },
    { num: 3, title: 'Prosecution Mastery', chapters: '9–13', desc: 'India IPO, USPTO, PCT, EPO, and the art of responding to examination across all jurisdictions.' },
    { num: 4, title: 'AI-Augmented Strategy', chapters: '14–19', desc: 'AI tools, the prompt library, portfolio strategy, India\'s Innovation Paradox, and the future of patents.' },
  ];

  reasons = [
    { icon: '⚖️', title: 'Jurisdictional Depth', desc: 'India, USA, PCT & EPO - not as footnotes, but as equal, parallel treatment throughout every chapter.' },
    { icon: '🤖', title: '60+ AI Prompts', desc: 'Tested, annotated prompts for every stage of the patent lifecycle - and the website keeps them updated.' },
    { icon: '📐', title: 'Practitioner-Focused', desc: 'Written for working practitioners. Every concept grounded in real prosecution history and filed applications.' },
    { icon: '🌐', title: 'Living Companion', desc: 'Fees change. Statistics age. Case law moves. The companion website keeps your copy perpetually current.' },
    { icon: '🏛️', title: 'Mission-Driven', desc: 'Written to put rigorous IP knowledge in the public domain and to build India\'s IP culture.' },
    { icon: '📚', title: '19 Chapters, 7 Appendices', desc: 'The most comprehensive single-volume treatment of Indian and international patent practice available.' },
  ];

  ngOnInit(): void {
    this.seo.update({
      title: 'Buy Once. Stay Current Forever.',
      description: 'The Patent Architect - the definitive practitioner\'s guide to patent drafting, prosecution & AI-augmented IP strategy across India, USA & the world. With a living companion website.',
      ogType: 'website',
    });
    this.seo.addBookStructuredData();
    this.seo.addOrganizationStructuredData();

    this.siteConfigSvc.config$.subscribe(c => this.siteConfig = c);
    this.content.getTestimonials().subscribe(t => this.testimonials = t.slice(0, 4));
    this.content.getFeaturedPosts().subscribe(p => this.featuredPosts = p.slice(0, 3));
  }
}
