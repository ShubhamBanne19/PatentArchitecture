// ─── PATENT ARCHITECT - CONTENT MODELS ───────────────────────────────────────

export interface Chapter {
  id: string;           // e.g. "chapter-01"
  number: number;       // 1-19
  phase: number;        // 1-4
  phaseTitle: string;
  title: string;
  subtitle?: string;
  summary: string;
  keyTopics: string[];
  figures: FigureEntry[];
  errata: ErrataEntry[];
  prompts: string[];    // prompt IDs relevant to this chapter
  furtherReading?: ReadingLink[];
  lastUpdated: string;  // ISO date
}

export interface FigureEntry {
  figureId: string;       // e.g. "fig-3-2"
  caption: string;
  dataType: 'fee' | 'statistic' | 'table' | 'chart';
  currentValue?: string;
  unit?: string;
  sourceUrl?: string;
  lastUpdated: string;
  changedSincePrint: boolean;
  changeNote?: string;
}

export interface ErrataEntry {
  errataId: string;
  chapterId: string;
  pageRef: string;
  severity: 'correction' | 'clarification' | 'update';
  description: string;
  correction: string;
  dateAdded: string;
}

export interface ReadingLink {
  title: string;
  url: string;
  source: string;
}

// ── FEE SCHEDULES ─────────────────────────────────────────────────────────────
export interface FeeSchedule {
  jurisdiction: string;     // "India IPO" | "USPTO" | "EPO" | "PCT"
  jurisdictionCode: string; // "IN" | "US" | "EP" | "PCT"
  currency: string;
  lastUpdated: string;
  effectiveDate: string;
  sourceUrl: string;
  categories: FeeCategory[];
}

export interface FeeCategory {
  category: string;
  fees: Fee[];
}

export interface Fee {
  feeId: string;
  label: string;
  description?: string;
  amount: number;
  amountSmallEntity?: number;
  amountMicro?: number;
  unit?: string;
  notes?: string;
}

// ── AI PROMPTS ────────────────────────────────────────────────────────────────
export interface Prompt {
  promptId: string;
  title: string;
  description: string;
  category: PromptCategory;
  jurisdiction: string[];   // ["IN","US","PCT","ANY"]
  chapterIds: string[];
  tags: string[];
  promptText: string;
  variables?: PromptVariable[];
  modelNotes?: string;
  dateAdded: string;
  lastUpdated: string;
  featured: boolean;
}

export type PromptCategory =
  | 'drafting'
  | 'prosecution'
  | 'claims-analysis'
  | 'prior-art'
  | 'freedom-to-operate'
  | 'strategy'
  | 'research'
  | 'office-action'
  | 'translation'
  | 'misc';

export interface PromptVariable {
  name: string;
  description: string;
  example: string;
}

// ── BLOG / RESOURCES ──────────────────────────────────────────────────────────
export interface BlogPost {
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  datePublished: string;
  lastUpdated?: string;
  category: BlogCategory;
  tags: string[];
  excerpt: string;
  readingTime: number;      // minutes
  featured: boolean;
  heroImageAlt?: string;
  contentPath: string;      // path to .md file
}

export type BlogCategory =
  | 'patent-strategy'
  | 'ai-tools'
  | 'india-ip'
  | 'global-ip'
  | 'innovation-paradox'
  | 'examiner-traps'
  | 'case-law';

// ── SITE META / TESTIMONIALS ──────────────────────────────────────────────────
export interface Testimonial {
  id: string;
  name: string;
  title: string;
  organization: string;
  quote: string;
  avatarAlt?: string;
  type: 'practitioner' | 'academic' | 'student' | 'inventor' | 'corporate';
}

export interface BookPhase {
  phase: number;
  title: string;
  subtitle: string;
  description: string;
  chapterRange: string;    // e.g. "Chapters 1–5"
  chapters: number[];
}
