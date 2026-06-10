import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { subscriptionGuard } from './core/guards/subscription.guard';

export const routes: Routes = [
  // ── Sales / discovery routes ────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'The Patent Architect - Buy Once. Stay Current Forever.',
  },
  {
    path: 'book',
    loadComponent: () => import('./pages/book/book.component').then(m => m.BookComponent),
    title: 'Book Overview & Chapters | The Patent Architect',
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing/pricing.component').then(m => m.PricingComponent),
    title: 'Pricing | The Patent Architect',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
    title: 'About the Author | The Patent Architect',
  },
  {
    path: 'sample',
    loadComponent: () => import('./pages/sample/sample.component').then(m => m.SampleComponent),
    title: 'Free Sample Chapter | The Patent Architect',
  },
  {
    path: 'endorsements',
    loadComponent: () => import('./pages/endorsements/endorsements.component').then(m => m.EndorsementsComponent),
    title: 'Endorsements | The Patent Architect',
  },
  {
    path: 'newsletter',
    loadComponent: () => import('./pages/newsletter/newsletter.component').then(m => m.NewsletterComponent),
    title: 'Newsletter | The Patent Architect',
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact | The Patent Architect',
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy/privacy.component').then(m => m.PrivacyComponent),
    title: 'Privacy Policy | The Patent Architect',
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms/terms.component').then(m => m.TermsComponent),
    title: 'Terms of Use | The Patent Architect',
  },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Login | The Patent Architect',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Register | The Patent Architect',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard | The Patent Architect',
  },
  {
    path: 'subscription',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/subscription/subscription.component').then(m => m.SubscriptionComponent),
    title: 'My Subscription | The Patent Architect',
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    title: 'Profile | The Patent Architect',
  },
  {
    path: 'premium',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/premium/premium.component').then(m => m.PremiumComponent),
    title: 'Premium Companion | The Patent Architect',
  },
  {
    path: 'premium/:id',
    canActivate: [authGuard, subscriptionGuard],
    loadComponent: () => import('./pages/premium/premium.component').then(m => m.PremiumComponent),
    title: 'Premium Resource | The Patent Architect',
  },

  // ── Blog ─────────────────────────────────────────────────────────────────
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog.component').then(m => m.BlogComponent),
    title: 'Blog & Resources | The Patent Architect',
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog/post/blog-post.component').then(m => m.BlogPostComponent),
  },

  // ── AI Prompt Library ─────────────────────────────────────────────────────
  {
    path: 'prompts',
    loadComponent: () => import('./pages/prompts/prompts.component').then(m => m.PromptsComponent),
    title: 'AI Prompt Library | The Patent Architect',
  },

  // ── Companion Hub (non-chapter routes) ───────────────────────────────────
  {
    path: 'companion',
    loadComponent: () => import('./pages/companion/hub/companion-hub.component').then(m => m.CompanionHubComponent),
    title: 'Companion Hub | The Patent Architect',
  },
  {
    path: 'companion/fees',
    loadComponent: () => import('./pages/companion/hub/companion-hub.component').then(m => m.CompanionHubComponent),
    title: 'Fee Schedules | The Patent Architect',
  },
  {
    path: 'companion/errata',
    loadComponent: () => import('./pages/companion/hub/companion-hub.component').then(m => m.CompanionHubComponent),
    title: 'Errata & Updates | The Patent Architect',
  },
  {
    path: 'companion/figures',
    loadComponent: () => import('./pages/companion/hub/companion-hub.component').then(m => m.CompanionHubComponent),
    title: 'Figures & Currency Tracker | The Patent Architect',
  },

  // ── Chapter Companion Pages - PERMANENT QR deep-link targets ─────────────
  // WARNING: These paths are printed in the physical book via QR codes.
  // They must NEVER be changed or removed. Add new ones; never delete.
  { path: 'companion/chapter-01', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-02', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-03', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-04', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-05', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-06', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-07', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-08', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-09', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-10', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-11', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-12', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-13', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-14', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-15', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-16', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-17', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-18', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },
  { path: 'companion/chapter-19', loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent) },

  // Generic companion/:id (supports runtime navigation between chapters)
  {
    path: 'companion/:id',
    loadComponent: () => import('./pages/companion/chapter/chapter-companion.component').then(m => m.ChapterCompanionComponent),
  },

  // ── Catch-all 404 ─────────────────────────────────────────────────────────
  // WARNING: Never remove or change this path. It must remain ** so unmatched routes
  // show a proper 404 page rather than silently redirecting to home.
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found | The Patent Architect',
  },
];
