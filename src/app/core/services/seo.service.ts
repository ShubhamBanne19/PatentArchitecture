import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SITE_BASE_URL } from '../config/site.config';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noIndex?: boolean;
}

const BASE_TITLE = 'The Patent Architect';
const BASE_URL   = SITE_BASE_URL;
const DEFAULT_OG  = `${BASE_URL}/assets/images/og-default.jpg`;
const DEFAULT_DESC = 'The definitive practitioner\'s guide to patent drafting, prosecution & AI-augmented IP strategy across India, USA & the world - with a living companion website that stays current forever.';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleSvc = inject(Title);
  private metaSvc  = inject(Meta);
  private router   = inject(Router);
  // Injected (not the global) so canonical/JSON-LD tags also land in
  // prerendered HTML, where no global `document` exists.
  private doc      = inject(DOCUMENT);

  update(config: SeoConfig): void {
    const pageTitle  = config.title ? `${config.title} | ${BASE_TITLE}` : BASE_TITLE;
    const desc       = config.description ?? DEFAULT_DESC;
    const ogTitle    = config.ogTitle ?? pageTitle;
    const ogDesc     = config.ogDescription ?? desc;
    const ogImage    = config.ogImage ?? DEFAULT_OG;
    const canonical  = config.canonical ?? `${BASE_URL}${this.router.url}`;

    this.titleSvc.setTitle(pageTitle);

    const metas: { name?: string; property?: string; content: string }[] = [
      { name: 'description',           content: desc },
      { name: 'keywords',              content: config.keywords ?? 'patent drafting, patent prosecution, IP strategy, India patent, USPTO, AI patent tools, patent book' },
      { name: 'robots',                content: config.noIndex ? 'noindex, nofollow' : 'index, follow' },
      { property: 'og:title',          content: ogTitle },
      { property: 'og:description',    content: ogDesc },
      { property: 'og:image',          content: ogImage },
      { property: 'og:type',           content: config.ogType ?? 'website' },
      { property: 'og:url',            content: canonical },
      { property: 'og:site_name',      content: BASE_TITLE },
      { name: 'twitter:card',          content: 'summary_large_image' },
      { name: 'twitter:title',         content: ogTitle },
      { name: 'twitter:description',   content: ogDesc },
      { name: 'twitter:image',         content: ogImage },
    ];

    metas.forEach(m => {
      if (m.property) {
        this.metaSvc.updateTag({ property: m.property, content: m.content });
      } else if (m.name) {
        this.metaSvc.updateTag({ name: m.name, content: m.content });
      }
    });

    // Canonical link
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', canonical);
  }

  addBookStructuredData(): void {
    const existing = this.doc.getElementById('book-jsonld');
    if (existing) return;

    const script = this.doc.createElement('script');
    script.id   = 'book-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: 'The Patent Architect - A Practitioner\'s Definitive Guide to Drafting, Prosecution & AI-Augmented IP Strategy Across India, USA & the World',
      alternateName: 'The Patent Architect',
      author: {
        '@type': 'Person',
        name: 'Shubham Sanjay Banne',
        url: `${BASE_URL}/about`,
      },
      description: DEFAULT_DESC,
      inLanguage: 'en',
      numberOfPages: 600,
      bookFormat: 'Hardcover',
      url: BASE_URL,
      image: DEFAULT_OG,
      publisher: {
        '@type': 'Organization',
        name: 'Self-Published / Independent',
      },
      genre: ['Law', 'Intellectual Property', 'Patent Law', 'Technology Law'],
      about: [
        { '@type': 'Thing', name: 'Patent Drafting' },
        { '@type': 'Thing', name: 'Patent Prosecution' },
        { '@type': 'Thing', name: 'IP Strategy' },
        { '@type': 'Thing', name: 'Artificial Intelligence in Law' },
        { '@type': 'Thing', name: 'India Patent Law' },
        { '@type': 'Thing', name: 'USPTO Patent Practice' },
      ],
    });
    this.doc.head.appendChild(script);
  }

  addOrganizationStructuredData(): void {
    const existing = this.doc.getElementById('org-jsonld');
    if (existing) return;

    const script = this.doc.createElement('script');
    script.id   = 'org-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'The Patent Architect',
      url: BASE_URL,
      description: DEFAULT_DESC,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_URL}/prompts?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });
    this.doc.head.appendChild(script);
  }
}
