import {
  Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { ContentService } from '../../core/services/content.service';
import { SiteConfigService, SiteConfig } from '../../core/services/site-config.service';
import { BlueprintGridComponent } from '../../shared/components/blueprint-grid/blueprint-grid.component';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { HairlineRuleComponent } from '../../shared/components/hairline-rule/hairline-rule.component';
import { ThreeBackdropComponent } from '../../shared/components/three-backdrop/three-backdrop.component';
import { BrandIntroComponent } from '../../shared/components/brand-intro/brand-intro.component';
import {
  ScrollRevealDirective, TiltDirective, ParallaxDirective, MagneticDirective,
  prefersReducedMotion, isTouchDevice,
} from '../../shared/motion';
import { Testimonial, BlogPost } from '../../core/models/content.models';

@Component({
  selector: 'pa-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule, BlueprintGridComponent, BtnComponent, CardComponent,
    HairlineRuleComponent, ThreeBackdropComponent, BrandIntroComponent, ScrollRevealDirective,
    TiltDirective, ParallaxDirective, MagneticDirective,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private seo            = inject(SeoService);
  private content        = inject(ContentService);
  private siteConfigSvc  = inject(SiteConfigService);

  siteConfig: SiteConfig | null = null;
  testimonials: Testimonial[]   = [];
  featuredPosts: BlogPost[]     = [];

  /** Turning leaves for the cinematic 3D book (count drives the page flutter). */
  bookPages = new Array(10);

  /** Brand-launch intro curtain — shown once per session, never on reduced motion. */
  showIntro = false;

  /** Match-cut handoff: fired when the intro's curtain lifts. `heroIgnite`
   *  echoes the intro title's shimmer on the hero title; `bookPresenting`
   *  runs the book's one-time presentation sweep (the product hero shot). */
  heroIgnite = false;
  bookPresenting = false;
  private presentTimer = 0;

  // ── The living book: an "earned" open the reader triggers, a seal on close,
  //    and a living-canon caption that proves the copy is current *today*. ────
  @ViewChild('bookStage') private bookStage?: ElementRef<HTMLElement>;

  bookArmed   = false;   // in view, breathing, inviting a first touch
  bookOpen    = false;   // cover + pages flipped open
  bookOpening = false;   // transient: the scene "holds its breath" + dedication flash
  bookSealing = false;   // transient: golden seal stamped as it closes
  hasOpened   = false;   // has it ever been opened? (hint → living-canon caption)
  isTouch     = false;

  /** Living Canon — the copy knows what "now" is. */
  todayDisplay = '';
  currentYear  = new Date().getFullYear();

  /** "Since you last visited" — honest, from localStorage, no fabricated data. */
  returning = false;
  daysSince = 0;

  private reduced         = false;
  private bookInteractive = false;
  private io?: IntersectionObserver;
  private dwellTimer   = 0;
  private closeTimer   = 0;
  private openingTimer = 0;
  private sealTimer    = 0;
  private sealHideTimer = 0;
  private openedAt     = 0;

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

    this.setupLivingCanon();
    this.setupBrandIntro();

    // Reduced motion / no IntersectionObserver (including server-side
    // prerendering): present the open spread statically. Decided here, before
    // the first change-detection pass — flipping bookOpen in ngAfterViewInit
    // throws NG0100 (ExpressionChangedAfterItHasBeenChecked).
    if (this.reduced || typeof IntersectionObserver === 'undefined') {
      this.bookOpen = true;
      this.hasOpened = true;
    }
  }

  /** One curtain per session: skipped for reduced motion and outside browsers. */
  private setupBrandIntro(): void {
    if (this.reduced || typeof window === 'undefined') return;
    try {
      const KEY = 'pa_intro_seen';
      if (!sessionStorage.getItem(KEY)) {
        this.showIntro = true;
        sessionStorage.setItem(KEY, '1');
      }
    } catch { /* storage blocked: skip the intro rather than replay it forever */ }
  }

  /** The curtain has lifted: fire the hero ignition + book presentation. */
  onIntroClosed(): void {
    this.showIntro = false;
    if (this.reduced) return;
    this.heroIgnite = true;
    this.bookPresenting = true;
    clearTimeout(this.presentTimer);
    this.presentTimer = window.setTimeout(() => (this.bookPresenting = false), 2600);
  }

  // ── Living Canon + returning-visitor state ──────────────────────────────────
  private setupLivingCanon(): void {
    const now = new Date();
    this.todayDisplay = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    this.isTouch = isTouchDevice();
    this.reduced = prefersReducedMotion();

    try {
      const KEY = 'pa_last_visit';
      const prev = localStorage.getItem(KEY);
      if (prev) {
        const days = Math.floor((now.getTime() - Number(prev)) / 86_400_000);
        if (Number.isFinite(days) && days >= 1) {
          this.returning = true;
          this.daysSince = days;
        }
      }
      localStorage.setItem(KEY, String(now.getTime()));
    } catch { /* storage blocked (private mode): just skip the welcome-back note */ }
  }

  // ── "Earned" open: the book waits in view, then opens when the reader leans
  //    in (hover / tap), or on its own after a short dwell so passive and
  //    assistive-tech readers still see the spread. ─────────────────────────────
  ngAfterViewInit(): void {
    // Static presentation already decided in ngOnInit.
    if (this.bookOpen) return;

    const node = this.bookStage?.nativeElement;
    if (!node) return;

    this.bookInteractive = true;
    this.io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.arm();
          else this.disarm();
        }
      },
      { threshold: 0.35 },
    );
    this.io.observe(node);
  }

  private arm(): void {
    if (this.hasOpened) return;          // already engaged — leave it as-is
    this.bookArmed = true;
    clearTimeout(this.dwellTimer);       // fallback: open on its own if simply watched
    this.dwellTimer = window.setTimeout(() => this.openBook(), 3200);
  }

  private disarm(): void {
    clearTimeout(this.dwellTimer);
    if (!this.hasOpened) this.bookArmed = false;
  }

  /** Desktop hover-in. */
  onEngage(): void {
    if (!this.bookInteractive || this.isTouch) return;
    this.openBook();
  }

  /** Desktop hover-out — let it close and stamp its seal. */
  onRelease(): void {
    if (!this.bookInteractive || this.isTouch) return;
    this.scheduleClose();
  }

  /** Touch / click — tap to open, tap again to seal it shut. */
  onTap(): void {
    if (!this.bookInteractive || !this.isTouch) return;
    if (this.bookOpen) this.closeBook(true);
    else this.openBook();
  }

  private openBook(): void {
    clearTimeout(this.closeTimer);
    clearTimeout(this.dwellTimer);
    if (this.bookOpen) return;

    // Re-opening cancels any pending / in-flight seal from a previous close.
    clearTimeout(this.sealTimer);
    clearTimeout(this.sealHideTimer);
    this.bookSealing = false;

    this.bookArmed = false;
    this.bookOpen = true;
    this.hasOpened = true;
    this.openedAt = Date.now();

    // The scene holds its breath while the cover swings open, and the
    // handwritten dedication flashes for a beat.
    this.bookOpening = true;
    clearTimeout(this.openingTimer);
    this.openingTimer = window.setTimeout(() => (this.bookOpening = false), 1500);
  }

  private scheduleClose(): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => this.closeBook(true), 900);
  }

  private closeBook(seal: boolean): void {
    clearTimeout(this.closeTimer);
    if (!this.bookOpen) return;
    const heldOpenMs = Date.now() - this.openedAt;
    this.bookOpen = false;

    // Only seal a deliberate read (avoids a flicker if the pointer just grazed
    // it), and only once the cover has actually swung shut — so the seal lands
    // on the closed navy cover rather than the still-fluttering pages.
    if (seal && !this.reduced && heldOpenMs > 900) {
      clearTimeout(this.sealTimer);
      clearTimeout(this.sealHideTimer);
      this.sealTimer = window.setTimeout(() => {
        this.bookSealing = true;
        this.sealHideTimer = window.setTimeout(() => (this.bookSealing = false), 1200);
      }, 900);
    }
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    clearTimeout(this.presentTimer);
    clearTimeout(this.dwellTimer);
    clearTimeout(this.closeTimer);
    clearTimeout(this.openingTimer);
    clearTimeout(this.sealTimer);
    clearTimeout(this.sealHideTimer);
  }
}
