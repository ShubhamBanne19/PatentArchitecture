import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { BtnComponent } from '../btn/btn.component';
import { SiteConfigService, SiteConfig } from '../../../core/services/site-config.service';
import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  label: string;
  path: string;
  children?: NavLink[];
}

@Component({
  selector: 'pa-header',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, BtnComponent],
  template: `
    <header class="site-header" [class.site-header--scrolled]="scrolled()">
      <div class="site-header__inner container">

        <!-- Logo -->
        <a routerLink="/" class="site-header__logo" aria-label="The Patent Architect - Home">
          <span class="site-header__logo-mark" aria-hidden="true">⬡</span>
          <span class="site-header__logo-text">
            <span class="site-header__logo-title">The Patent Architect</span>
            <span class="site-header__logo-sub">by Shubham Sanjay Banne</span>
          </span>
        </a>

        <!-- Desktop nav -->
        <nav class="site-header__nav" aria-label="Primary navigation">
          @for (link of navLinks; track link.path) {
            @if (link.children) {
              <div class="nav-item nav-item--dropdown" [class.nav-item--open]="openDropdown() === link.path">
                <button
                  class="nav-item__trigger"
                  (click)="toggleDropdown(link.path)"
                  [attr.aria-expanded]="openDropdown() === link.path"
                >
                  {{link.label}}
                  <span class="nav-item__chevron" aria-hidden="true">▾</span>
                </button>
                <div class="nav-item__dropdown">
                  @for (child of link.children; track child.path) {
                    <a [routerLink]="child.path" class="nav-item__child" (click)="closeDropdown()">
                      {{child.label}}
                    </a>
                  }
                </div>
              </div>
            } @else {
              <a
                [routerLink]="link.path"
                class="nav-item__link"
                routerLinkActive="nav-item__link--active"
                [routerLinkActiveOptions]="{exact: link.path === '/'}"
              >{{link.label}}</a>
            }
          }
        </nav>

        <!-- CTAs -->
        <div class="site-header__actions">
          <pa-btn variant="ghost" size="sm" routerLink="/pricing">Pricing</pa-btn>
          <pa-btn variant="ghost" size="sm" [routerLink]="auth.isAuthenticated() ? '/dashboard' : '/login'">
            {{ auth.isAuthenticated() ? 'Dashboard' : 'Login' }}
          </pa-btn>
          @if (siteConfig?.isLive) {
            <pa-btn variant="primary" size="sm" [href]="siteConfig!.amazonUrl" [external]="true">
              Buy the Book
            </pa-btn>
          } @else {
            <pa-btn variant="outline" size="sm" routerLink="/newsletter">
              Coming {{ siteConfig?.launchDateDisplay }}
            </pa-btn>
          }
        </div>

        <!-- Mobile menu toggle -->
        <button
          class="site-header__menu-btn"
          (click)="mobileOpen.set(!mobileOpen())"
          [attr.aria-expanded]="mobileOpen()"
          aria-label="Toggle navigation menu"
        >
          <span class="site-header__hamburger" [class.site-header__hamburger--open]="mobileOpen()">
            <span></span><span></span><span></span>
          </span>
        </button>
      </div>

      <!-- Mobile nav -->
      @if (mobileOpen()) {
        <nav class="site-header__mobile-nav" aria-label="Mobile navigation">
          @for (link of navLinks; track link.path) {
            <a [routerLink]="link.path" class="mobile-nav__link" (click)="mobileOpen.set(false)">
              {{link.label}}
            </a>
            @if (link.children) {
              @for (child of link.children; track child.path) {
                <a [routerLink]="child.path" class="mobile-nav__link mobile-nav__link--child" (click)="mobileOpen.set(false)">
                  {{child.label}}
                </a>
              }
            }
          }
          <div class="mobile-nav__ctas">
            <pa-btn variant="outline" routerLink="/companion" [fullWidth]="true" (clicked)="mobileOpen.set(false)">
              Open Companion
            </pa-btn>
            <pa-btn variant="outline" routerLink="/pricing" [fullWidth]="true" (clicked)="mobileOpen.set(false)">
              Pricing
            </pa-btn>
            <pa-btn
              variant="outline"
              [routerLink]="auth.isAuthenticated() ? '/dashboard' : '/login'"
              [fullWidth]="true"
              (clicked)="mobileOpen.set(false)"
            >
              {{ auth.isAuthenticated() ? 'Dashboard' : 'Login' }}
            </pa-btn>
            @if (siteConfig?.isLive) {
              <pa-btn variant="primary" [href]="siteConfig!.amazonUrl" [fullWidth]="true" [external]="true">
                Buy the Book
              </pa-btn>
            } @else {
              <pa-btn variant="outline" routerLink="/newsletter" [fullWidth]="true">
                Coming {{ siteConfig?.launchDateDisplay }}
              </pa-btn>
            }
          </div>
        </nav>
      }
    </header>
  `,
  styles: [`
    .site-header {
      position: sticky;
      top: 0;
      z-index: 200;
      height: var(--header-h);
      background: rgba(27, 31, 59, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(201,169,97,0.1);
      transition: border-color 200ms, box-shadow 200ms;

      &--scrolled {
        border-bottom-color: rgba(201,169,97,0.25);
        box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      }

      &__inner {
        height: 100%;
        display: flex;
        align-items: center;
        gap: var(--space-6);
      }

      &__logo {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        text-decoration: none;
        flex-shrink: 0;
      }

      &__logo-mark {
        font-size: 1.5rem;
        color: var(--color-gold);
        line-height: 1;
      }

      &__logo-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      &__logo-title {
        font-family: var(--font-display);
        font-size: var(--text-md);
        font-weight: 700;
        color: var(--color-ivory);
        letter-spacing: -0.01em;
      }

      &__logo-sub {
        font-size: var(--text-xs);
        color: var(--color-silver);
        font-weight: 400;
        letter-spacing: 0.05em;
      }

      &__nav {
        display: none;
        align-items: center;
        gap: var(--space-1);
        margin-left: auto;

        @media (min-width: 1024px) { display: flex; }
      }

      &__actions {
        display: none;
        align-items: center;
        gap: var(--space-3);

        @media (min-width: 1024px) { display: flex; }
      }

      &__menu-btn {
        display: flex;
        margin-left: auto;
        padding: var(--space-2);
        background: none;
        border: none;
        cursor: pointer;

        @media (min-width: 1024px) { display: none; }
      }

      &__hamburger {
        display: flex;
        flex-direction: column;
        gap: 5px;
        width: 22px;

        span {
          display: block;
          height: 2px;
          background: var(--color-ivory);
          transition: all 220ms var(--ease-out);
          transform-origin: center;
        }

        &--open {
          span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
          span:nth-child(2) { opacity: 0; transform: scaleX(0); }
          span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        }
      }

      &__mobile-nav {
        background: var(--color-navy);
        border-top: 1px solid rgba(201,169,97,0.15);
        padding: var(--space-4) var(--space-6) var(--space-6);
        display: flex;
        flex-direction: column;
        gap: var(--space-1);

        @media (min-width: 1024px) { display: none; }
      }
    }

    // Nav items
    .nav-item {
      position: relative;

      &__link {
        display: block;
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
        font-weight: 500;
        color: rgba(244,239,230,0.75);
        text-decoration: none;
        border-radius: var(--border-radius);
        transition: color var(--duration), background var(--duration);

        &:hover { color: var(--color-ivory); background: rgba(201,169,97,0.06); }
        &--active { color: var(--color-gold); }
      }

      &__trigger {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
        font-weight: 500;
        color: rgba(244,239,230,0.75);
        border-radius: var(--border-radius);
        cursor: pointer;
        background: none;
        border: none;
        font-family: var(--font-body);
        transition: color var(--duration);

        &:hover { color: var(--color-ivory); }
      }

      &__chevron {
        font-size: 0.7em;
        transition: transform var(--duration);
      }

      &--open .nav-item__chevron { transform: rotate(180deg); }

      &__dropdown {
        display: none;
        position: absolute;
        top: calc(100% + var(--space-2));
        left: 0;
        min-width: 200px;
        background: var(--color-surface-1);
        border: 1px solid rgba(201,169,97,0.2);
        border-radius: var(--border-radius-md);
        box-shadow: var(--shadow-card);
        padding: var(--space-2);
        z-index: 300;
      }

      &--open &__dropdown {
        display: block;
      }

      &__child {
        display: block;
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
        color: rgba(244,239,230,0.75);
        text-decoration: none;
        border-radius: var(--border-radius);
        transition: color var(--duration), background var(--duration);

        &:hover { color: var(--color-gold); background: rgba(201,169,97,0.06); }
      }
    }

    // Mobile nav
    .mobile-nav {
      &__link {
        display: block;
        padding: var(--space-3) var(--space-2);
        font-size: var(--text-base);
        color: rgba(244,239,230,0.8);
        text-decoration: none;
        border-bottom: 1px solid rgba(201,169,97,0.08);
        transition: color var(--duration);

        &:hover { color: var(--color-gold); }
        &--child { padding-left: var(--space-6); font-size: var(--text-sm); }
      }

      &__ctas {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid rgba(201,169,97,0.15);
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  private siteConfigService = inject(SiteConfigService);
  readonly auth = inject(AuthService);
  siteConfig: SiteConfig | null = null;

  scrolled = signal(false);
  mobileOpen = signal(false);
  openDropdown = signal<string | null>(null);

  navLinks: NavLink[] = [
    { label: 'Home', path: '/' },
    { label: 'The Book', path: '/book' },
    { label: 'Pricing', path: '/pricing' },
    {
      label: 'Companion', path: '/companion',
      children: [
        { label: 'Companion Hub', path: '/companion' },
        { label: 'Fee Schedules', path: '/companion/fees' },
        { label: 'AI Prompt Library', path: '/prompts' },
        { label: 'Premium Companion', path: '/premium' },
      ]
    },
    { label: 'Blog', path: '/blog' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  ngOnInit(): void {
    this.siteConfigService.config$.subscribe(c => this.siteConfig = c);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  toggleDropdown(path: string): void {
    this.openDropdown.set(this.openDropdown() === path ? null : path);
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }
}
