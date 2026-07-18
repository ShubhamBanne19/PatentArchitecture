import {
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

/**
 * Brand-launch intro — a ~5s cinematic cold open, shot as one continuous
 * sequence (any click or keypress skips it):
 *
 *   ACT 0  THE FRAME      letterboxed navy void, film grain breathing
 *   ACT I  FIRST LIGHT    a gold light-leak sweeps the void; the hexagon
 *                         fuse-burns into being behind a travelling ember
 *   ACT II TITLE FORGED   the title lines rise from depth; at THE BEAT a
 *                         light sweep crosses them, "Architect" ignites
 *                         gold, a shockwave ring blooms and dies
 *   ACT III THE SETTLE    rule draws, tagline and author whisper in
 *   ACT IV MATCH CUT      the camera flies THROUGH the plate (scale +
 *                         defocus) while the letterbox bars retract,
 *                         landing inside the still-moving hero
 *
 * - The HOST decides whether to render it (session gate + reduced-motion
 *   check live in HomeComponent) — this component only performs.
 * - Scroll is locked while the curtain is up and restored on destroy.
 * - Emits (closed) after the exit move so the host can fire the hero
 *   ignition (title shimmer echo + book presentation sweep).
 */
@Component({
  selector: 'pa-brand-intro',
  standalone: true,
  template: `
    <div
      class="brand-intro"
      [class.is-leaving]="leaving"
      (click)="dismiss()"
      aria-hidden="true"
    >
      <div class="brand-intro__void">
        <div class="brand-intro__grid"></div>
        <div class="brand-intro__glow brand-intro__glow--gold"></div>
        <div class="brand-intro__glow brand-intro__glow--indigo"></div>
        <div class="brand-intro__leak"></div>
        <div class="brand-intro__frame"></div>

        <div class="brand-intro__inner">
          <svg class="brand-intro__hex" viewBox="0 0 100 100" fill="none">
            <polygon
              class="brand-intro__hex-under"
              points="50,4 89.8,27 89.8,73 50,96 10.2,73 10.2,27"
              pathLength="100"
            />
            <polygon
              class="brand-intro__hex-ember"
              points="50,4 89.8,27 89.8,73 50,96 10.2,73 10.2,27"
              pathLength="100"
            />
          </svg>
          <span class="brand-intro__eyebrow">The Definitive Reference</span>
          <div class="brand-intro__shock"></div>
          <div class="brand-intro__name-wrap">
            <div class="brand-intro__name">
              <span class="brand-intro__line brand-intro__line--one">The Patent</span>
              <span class="brand-intro__line brand-intro__line--two brand-intro__accent">Architect</span>
            </div>
            <div class="brand-intro__sweep"></div>
          </div>
          <div class="brand-intro__rule"></div>
          <div class="brand-intro__tag">
            Where the architecture of ideas becomes protectable.
          </div>
          <div class="brand-intro__author">Shubham Sanjay Banne</div>
        </div>

        <div class="brand-intro__grain"></div>
      </div>

      <div class="brand-intro__bar brand-intro__bar--top"></div>
      <div class="brand-intro__bar brand-intro__bar--bottom"></div>
    </div>
  `,
  styles: [`
    // ── Root: transparent shell; the world lives in __void so the exit can
    //    fly the camera through it while the letterbox bars slide away. ─────
    .brand-intro {
      position: fixed;
      inset: 0;
      z-index: 1000;
      overflow: hidden;
      cursor: pointer;

      &.is-leaving { pointer-events: none; }
    }

    // ── ACT IV — the match cut: scale up + defocus + brighten = the camera
    //    passes through the title into the world behind it. ─────────────────
    .brand-intro__void {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      background:
        radial-gradient(90% 70% at 50% 42%,
          #181c36 0%,
          #101327 58%,
          #090b18 100%);
      transition:
        opacity 1s cubic-bezier(0.5, 0, 0.2, 1),
        transform 1s cubic-bezier(0.5, 0, 0.2, 1),
        filter 1s cubic-bezier(0.5, 0, 0.2, 1);

      // Edge vignette — the frame's darkness pushing in.
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        background: radial-gradient(
          ellipse at 50% 45%,
          transparent 48%,
          rgba(5, 6, 13, 0.55) 82%,
          rgba(5, 6, 13, 0.85) 100%
        );
      }
    }
    .brand-intro.is-leaving .brand-intro__void {
      opacity: 0;
      transform: scale(1.14);
      filter: blur(14px) brightness(1.3);
    }

    // ── ACT 0 — letterbox bars: present from frame one, retract on the cut ─
    .brand-intro__bar {
      position: absolute;
      left: 0;
      right: 0;
      height: clamp(48px, 11vh, 150px);
      background: #05060d;
      z-index: 3;
      transition: transform 0.9s cubic-bezier(0.64, 0, 0.35, 1);

      &--top    { top: 0; }
      &--bottom { bottom: 0; }
    }
    .brand-intro.is-leaving .brand-intro__bar--top    { transform: translateY(-101%); }
    .brand-intro.is-leaving .brand-intro__bar--bottom { transform: translateY(101%); }

    // ── ACT 0 — film grain, alive on the lens, over everything in the void ─
    .brand-intro__grain {
      position: absolute;
      inset: -30%;
      z-index: 3;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 160px 160px;
      mix-blend-mode: overlay;
      opacity: 0.07;
      animation: grain-jitter 0.85s steps(1) infinite;
    }

    // Faint gold blueprint grid — held back until ACT II so the void opens
    // truly empty. Masked away from the plate's centre.
    .brand-intro__grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(201, 169, 97, 0.055) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201, 169, 97, 0.055) 1px, transparent 1px);
      background-size: 44px 44px;
      -webkit-mask: radial-gradient(75% 65% at 50% 45%, transparent 28%, #000 78%);
              mask: radial-gradient(75% 65% at 50% 45%, transparent 28%, #000 78%);
      opacity: 0;
      animation: intro-fade 1.6s ease 1.4s forwards;
    }

    // Twin aurora glows. The gold one flares at THE BEAT.
    .brand-intro__glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(30px);
      opacity: 0;
      pointer-events: none;

      &--gold {
        left: 50%;
        top: 40%;
        width: min(64vw, 36rem);
        aspect-ratio: 1;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle,
          rgba(201, 169, 97, 0.17) 0%,
          rgba(201, 169, 97, 0.05) 45%,
          transparent 70%);
        animation:
          intro-fade 2s ease-out 0.9s forwards,
          glow-flare 1.2s ease-out 2.35s;
      }

      &--indigo {
        left: 18%;
        bottom: -18%;
        width: min(55vw, 30rem);
        aspect-ratio: 1;
        background: radial-gradient(circle,
          rgba(124, 116, 196, 0.14) 0%,
          transparent 65%);
        animation: intro-fade 2.4s ease-out 1.2s forwards;
      }
    }

    // ── ACT I — the light-leak: a hairline of gold crossing the void ───────
    .brand-intro__leak {
      position: absolute;
      top: 50%;
      left: -30%;
      width: 26%;
      height: 2px;
      background: linear-gradient(90deg,
        transparent,
        rgba(240, 226, 187, 0.9),
        transparent);
      filter: blur(1px) drop-shadow(0 0 14px rgba(201, 169, 97, 0.8));
      mix-blend-mode: screen;
      opacity: 0;
      animation: leak-sweep 1.15s cubic-bezier(0.6, 0, 0.3, 1) 0.35s forwards;
    }

    // Drafting-frame corner ticks (mirrors the book cover's frame motif).
    .brand-intro__frame {
      position: absolute;
      inset: clamp(70px, 13vh, 180px) clamp(18px, 4vw, 40px);
      pointer-events: none;
      opacity: 0;
      animation: intro-fade 1.2s ease 1.2s forwards;

      &::before,
      &::after {
        content: '';
        position: absolute;
        width: clamp(18px, 3vw, 28px);
        height: clamp(18px, 3vw, 28px);
        border: 0 solid rgba(201, 169, 97, 0.55);
      }
      &::before { top: 0;    left: 0;  border-top-width: 1px;    border-left-width: 1px;  }
      &::after  { bottom: 0; right: 0; border-bottom-width: 1px; border-right-width: 1px; }
    }

    .brand-intro__inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0 1.5rem;
    }

    // ── ACT I — hexagon fuse-burn: the stroke draws while a bright ember
    //    head travels the same path just ahead of it. ────────────────────────
    .brand-intro__hex {
      width: clamp(60px, 9vw, 84px);
      margin-bottom: 1.5rem;
      overflow: visible;
    }
    .brand-intro__hex-under {
      stroke: var(--color-gold, #c9a961);
      stroke-width: 1.6;
      stroke-linejoin: round;
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      filter: drop-shadow(0 0 12px rgba(201, 169, 97, 0.45));
      animation: hex-draw 1.15s cubic-bezier(0.4, 0, 0.2, 1) 0.7s forwards;
    }
    .brand-intro__hex-ember {
      stroke: #f6ebc9;
      stroke-width: 2.4;
      stroke-linejoin: round;
      stroke-dasharray: 3 97;
      stroke-dashoffset: 100;
      opacity: 0;
      filter: drop-shadow(0 0 6px rgba(246, 235, 201, 0.95))
              drop-shadow(0 0 16px rgba(201, 169, 97, 0.8));
      animation: hex-ember 1.15s cubic-bezier(0.4, 0, 0.2, 1) 0.7s forwards;
    }

    // ── The type — the theme's voice, entering in order of rank ────────────
    .brand-intro__eyebrow {
      font-family: var(--font-body, system-ui, sans-serif);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--color-gold, #c9a961);
      margin-bottom: 0.9rem;
      opacity: 0;
      animation: intro-ink 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.5s forwards;
    }

    // ── ACT II — the title rises from depth ────────────────────────────────
    .brand-intro__name-wrap {
      position: relative;
      overflow: hidden;
      padding: 0.3em 0.8em;
      margin: -0.3em -0.8em;
    }
    .brand-intro__name {
      font-family: var(--font-display, Georgia, serif);
      font-size: clamp(2.6rem, 8vw, 4.2rem);
      font-weight: 700;
      line-height: 1.02;
      letter-spacing: -0.02em;
      color: var(--color-ivory, #f4efe6);
      text-shadow: 0 2px 32px rgba(0, 0, 0, 0.45);
      perspective: 900px;
    }
    .brand-intro__line {
      display: block;
      opacity: 0;
      transform: translateZ(-140px);
      filter: blur(12px);
      animation: line-rise 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;

      &--one { animation-delay: 1.7s; }
      &--two { animation-delay: 1.9s; }
    }

    // "Architect": gold at rest; at THE BEAT it ignites — one fast shimmer
    // pass, then the same slow 7s shimmer the hero title carries. Solid gold
    // fallback wherever background-clip:text is unsupported.
    .brand-intro__accent {
      color: var(--color-gold, #c9a961);

      @supports (-webkit-background-clip: text) or (background-clip: text) {
        background: linear-gradient(
          100deg,
          var(--color-gold, #c9a961) 38%,
          #f0e2bb 50%,
          var(--color-gold, #c9a961) 62%
        );
        background-size: 200% auto;
        background-position: 200% center;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
        animation:
          line-rise 1.1s cubic-bezier(0.22, 1, 0.36, 1) 1.9s forwards,
          intro-shimmer 0.9s linear 2.4s,
          intro-shimmer 7s linear 3.3s infinite;
      }
    }

    // ── THE BEAT — light sweep across the title + shockwave ring ───────────
    .brand-intro__sweep {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      transform: translateX(-130%) skewX(-18deg);
      background: linear-gradient(90deg,
        transparent 20%,
        rgba(244, 239, 230, 0.26) 46%,
        rgba(240, 226, 187, 0.55) 50%,
        rgba(244, 239, 230, 0.26) 54%,
        transparent 80%);
      mix-blend-mode: screen;
      animation: title-sweep 0.75s cubic-bezier(0.5, 0, 0.4, 1) 2.35s forwards;
    }
    .brand-intro__shock {
      position: absolute;
      left: 50%;
      top: 52%;
      width: clamp(200px, 32vw, 300px);
      aspect-ratio: 1;
      pointer-events: none;
      border-radius: 50%;
      border: 1px solid rgba(222, 192, 122, 0.7);
      box-shadow:
        0 0 40px rgba(201, 169, 97, 0.25),
        inset 0 0 30px rgba(201, 169, 97, 0.18);
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.35);
      animation: shockwave 1.1s cubic-bezier(0.16, 1, 0.3, 1) 2.35s forwards;
    }

    // ── ACT III — the settle ────────────────────────────────────────────────
    .brand-intro__rule {
      width: min(220px, 44vw);
      height: 1px;
      margin: 1.2rem 0 1rem;
      background: linear-gradient(90deg,
        transparent,
        var(--color-gold, #c9a961),
        transparent);
      transform: scaleX(0);
      animation: intro-rule 0.9s cubic-bezier(0.22, 1, 0.36, 1) 2.95s forwards;
    }
    .brand-intro__tag {
      font-family: var(--font-display, Georgia, serif);
      font-style: italic;
      font-size: clamp(0.95rem, 2.2vw, 1.15rem);
      line-height: 1.5;
      color: rgba(244, 239, 230, 0.82);
      opacity: 0;
      animation: intro-ink 0.9s cubic-bezier(0.22, 1, 0.36, 1) 3.15s forwards;
    }
    .brand-intro__author {
      margin-top: 1.1rem;
      font-family: var(--font-body, system-ui, sans-serif);
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--color-gold-light, #dec07a);
      opacity: 0;
      animation: intro-ink 0.9s cubic-bezier(0.22, 1, 0.36, 1) 3.4s forwards;
    }

    // ── Keyframes ───────────────────────────────────────────────────────────
    @keyframes intro-fade {
      to { opacity: 1; }
    }
    @keyframes grain-jitter {
      0%   { transform: translate(0, 0); }
      25%  { transform: translate(-16%, 7%); }
      50%  { transform: translate(9%, -13%); }
      75%  { transform: translate(-6%, -9%); }
      100% { transform: translate(0, 0); }
    }
    @keyframes leak-sweep {
      0%   { opacity: 0; transform: translateX(0); }
      15%  { opacity: 1; }
      85%  { opacity: 1; }
      100% { opacity: 0; transform: translateX(520%); }
    }
    @keyframes hex-draw {
      to { stroke-dashoffset: 0; }
    }
    @keyframes hex-ember {
      0%   { stroke-dashoffset: 100; opacity: 0; }
      8%   { opacity: 1; }
      92%  { opacity: 1; }
      100% { stroke-dashoffset: 0; opacity: 0; }
    }
    @keyframes line-rise {
      to { opacity: 1; transform: translateZ(0); filter: blur(0); }
    }
    @keyframes intro-shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    @keyframes title-sweep {
      0%   { opacity: 0; transform: translateX(-130%) skewX(-18deg); }
      12%  { opacity: 1; }
      88%  { opacity: 1; }
      100% { opacity: 0; transform: translateX(130%) skewX(-18deg); }
    }
    @keyframes shockwave {
      0%   { opacity: 0;   transform: translate(-50%, -50%) scale(0.35); }
      12%  { opacity: 0.9; }
      100% { opacity: 0;   transform: translate(-50%, -50%) scale(2.6); }
    }
    @keyframes glow-flare {
      0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      18%  { opacity: 1; transform: translate(-50%, -50%) scale(1.22); }
      100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes intro-ink {
      from { opacity: 0; filter: blur(10px); letter-spacing: 0.22em; }
      to   { opacity: 1; filter: blur(0); }
    }
    @keyframes intro-rule {
      to { transform: scaleX(1); }
    }

    // ── Short viewports (landscape phones, squat windows): compact the
    //    plate so nothing clips behind the letterbox bars. ──────────────────
    @media (max-height: 620px) {
      .brand-intro__bar     { height: clamp(22px, 6vh, 48px); }
      .brand-intro__frame   { display: none; }
      .brand-intro__hex     { width: 46px; margin-bottom: 0.7rem; }
      .brand-intro__eyebrow { margin-bottom: 0.5rem; }
      .brand-intro__name    { font-size: clamp(1.7rem, 7.5vh, 2.7rem); }
      .brand-intro__rule    { margin: 0.7rem 0 0.55rem; }
      .brand-intro__tag     { font-size: 0.85rem; }
      .brand-intro__author  { margin-top: 0.55rem; font-size: 0.6rem; }
    }
  `],
})
export class BrandIntroComponent implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();

  leaving = false;

  /** Full sequence length before the cut, and the exit-move length. */
  private static readonly AUTO_DISMISS_MS = 5000;
  private static readonly EXIT_MS = 1000;

  private timers: number[] = [];
  private prevOverflow = '';

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      this.prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    }
    this.timers.push(
      window.setTimeout(() => this.dismiss(), BrandIntroComponent.AUTO_DISMISS_MS),
    );
  }

  /** The match cut (auto after the sequence, or on click / keypress). */
  dismiss(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.timers.push(
      window.setTimeout(() => this.closed.emit(), BrandIntroComponent.EXIT_MS),
    );
  }

  @HostListener('document:keydown')
  onKeydown(): void {
    this.dismiss();
  }

  ngOnDestroy(): void {
    this.timers.forEach(t => clearTimeout(t));
    if (typeof document !== 'undefined') {
      document.documentElement.style.overflow = this.prevOverflow;
    }
  }
}
