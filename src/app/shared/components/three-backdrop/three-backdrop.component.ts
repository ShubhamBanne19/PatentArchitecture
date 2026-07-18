import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { prefersReducedMotion } from '../../motion';

/**
 * Lazy 3D "constellation blueprint" backdrop — the brand-launch scene.
 *
 * - Three.js is fetched via dynamic import() ONLY when the host element
 *   first intersects the viewport, so it never lands in the initial bundle
 *   and never loads on pages that don't use it.
 * - Soft luminous gold/ivory particles (custom point shader: round sprites,
 *   per-particle size + twinkle, depth fade, additive glow) joined by
 *   distance-graded constellation lines.
 * - A "gyroscope" centrepiece: the wireframe icosahedron wrapped in two
 *   slowly counter-tumbling gold hexagon rings — the brand's ⬡ motif.
 * - Occasional comet streaks arc across the far field.
 * - Cinematic entrance: the camera flies in from deep space on first render,
 *   then hands over to pointer parallax and scroll-linked drift.
 * - Pauses rendering when scrolled offscreen or the tab is hidden.
 * - Renders nothing but a static aurora gradient for reduced-motion users,
 *   on WebGL failure, or while loading - the page works identically.
 * - Purely decorative: aria-hidden, pointer-events none, z-index below
 *   content. Removing this component changes nothing functionally.
 */
@Component({
  selector: 'pa-three-backdrop',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="three-backdrop" aria-hidden="true">
      <div class="three-backdrop__aurora"></div>
      <canvas #canvas class="three-backdrop__canvas"></canvas>
      <div class="three-backdrop__vignette"></div>
    </div>
  `,
  styles: [`
    .three-backdrop {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;

      // Soft nebula wash behind the particles: gives the scene atmosphere and
      // doubles as the static fallback when WebGL / motion is unavailable.
      &__aurora {
        position: absolute;
        inset: -22%;
        background:
          radial-gradient(42% 34% at 68% 30%, rgba(201, 169, 97, 0.11), transparent 70%),
          radial-gradient(50% 42% at 22% 72%, rgba(124, 116, 196, 0.13), transparent 72%),
          radial-gradient(36% 28% at 52% 12%, rgba(222, 192, 122, 0.07), transparent 70%);
        filter: blur(34px);
        animation: aurora-drift 26s ease-in-out infinite alternate;
      }

      &__canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 1600ms ease;

        &.is-ready { opacity: 1; }
      }

      &__vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse at 50% 40%,
          transparent 0%,
          transparent 55%,
          rgba(27, 31, 59, 0.85) 100%
        );
      }
    }

    @keyframes aurora-drift {
      from { transform: translate3d(-2%, -1.5%, 0) scale(1); }
      to   { transform: translate3d(2%, 2%, 0) scale(1.07); }
    }

    @media (prefers-reduced-motion: reduce) {
      .three-backdrop__aurora { animation: none; }
    }
  `],
})
export class ThreeBackdropComponent implements AfterViewInit, OnDestroy {
  /** Particle count (desktop). Mobile automatically uses ~60%. */
  @Input() density = 130;

  @ViewChild('canvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private host = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);

  private visibilityObserver?: IntersectionObserver;
  private rafId = 0;
  private running = false;
  private destroyed = false;
  private cleanup: (() => void) | null = null;
  private pointer = { x: 0, y: 0 };

  ngAfterViewInit(): void {
    if (
      prefersReducedMotion() ||
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return; // static aurora only
    }

    // Defer the three.js download until the backdrop is near the viewport.
    this.visibilityObserver = new IntersectionObserver(
      entries => {
        const visible = entries.some(e => e.isIntersecting);
        if (visible && !this.cleanup) {
          this.init();
        }
        this.running = visible;
      },
      { rootMargin: '200px' }
    );
    this.visibilityObserver.observe(this.host.nativeElement);
  }

  private async init(): Promise<void> {
    this.cleanup = () => {}; // guard against double-init while importing
    let THREE: typeof import('three');
    try {
      THREE = await import('three');
    } catch {
      this.cleanup = null;
      return; // network failure: stay on static aurora
    }
    if (this.destroyed) return;

    const canvas = this.canvasRef.nativeElement;
    const hostEl = this.host.nativeElement as HTMLElement;

    let renderer: import('three').WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.devicePixelRatio < 2,
        powerPreference: 'low-power',
      });
    } catch {
      this.cleanup = null;
      return; // no WebGL: stay on static aurora
    }

    const isMobile = window.innerWidth < 768;
    const count = Math.round(this.density * (isMobile ? 0.6 : 1));
    const maxDist = 26;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1b1f3b, 60, 160);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
    camera.position.z = 175; // cinematic fly-in eases this to 70

    // ── Particles: soft round glow sprites with per-particle size/twinkle ──
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const tints = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      speeds[i] = 0.4 + Math.random() * 0.8;
      sizes[i] = 1.4 + Math.random() * 2.4;          // px at reference depth
      phases[i] = Math.random() * Math.PI * 2;        // desynced twinkle
      tints[i] = Math.random() < 0.28 ? 1 : Math.random() * 0.35; // mostly gold, a few ivory
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    pGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    pGeo.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
    const pMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute float aTint;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        varying float vTint;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float twinkle = 0.68 + 0.32 * sin(uTime * 1.5 + aPhase);
          float depthFade = smoothstep(-170.0, -25.0, mv.z);
          vAlpha = twinkle * depthFade;
          vTint = aTint;
          gl_PointSize = aSize * uPixelRatio * (150.0 / -mv.z) * (0.85 + 0.25 * twinkle);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vTint;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = pow(smoothstep(0.5, 0.0, d), 1.8);
          vec3 gold  = vec3(0.85, 0.71, 0.44);
          vec3 ivory = vec3(0.96, 0.94, 0.88);
          gl_FragColor = vec4(mix(gold, ivory, vTint), a * vAlpha * 0.9);
        }
      `,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // ── Connecting lines (rebuilt each frame; brightness graded by distance) ─
    const maxLinks = count * 4;
    const linePositions = new Float32Array(maxLinks * 6);
    const lineColors = new Float32Array(maxLinks * 6);
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    const lMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lGeo, lMat);
    scene.add(lines);

    // ── Centrepiece: wireframe icosahedron inside a gyroscope of gold
    //    hexagon rings (the brand's ⬡ motif, drawn in space). ────────────────
    const arch = new THREE.Group();
    arch.position.set(isMobile ? 0 : 28, 4, -10);
    scene.add(arch);

    const icoGeo = new THREE.IcosahedronGeometry(16, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0xc9a961,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    arch.add(ico);

    const hexRing = (radius: number, opacity: number) => {
      const pts: import('three').Vector3[] = [];
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0xdec07a,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.LineLoop(geo, mat);
    };
    const ringA = hexRing(21, 0.4);   // spins in its own plane
    const ringB = hexRing(26, 0.24);  // tumbles end over end
    ringA.rotation.x = 1.15;
    arch.add(ringA, ringB);

    // ── Comet streaks: rare gold shooting stars in the far field ───────────
    const COMET_TRAIL = 16;
    const cometCount = isMobile ? 1 : 2;
    interface Comet {
      line: import('three').Line;
      geo: import('three').BufferGeometry;
      mat: import('three').LineBasicMaterial;
      a: import('three').Vector3;
      b: import('three').Vector3;
      dur: number;
      start: number;
      nextAt: number;
      active: boolean;
    }
    const comets: Comet[] = [];
    for (let c = 0; c < cometCount; c++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COMET_TRAIL * 3), 3));
      const colors = new Float32Array(COMET_TRAIL * 3);
      for (let k = 0; k < COMET_TRAIL; k++) {
        const f = (1 - k / (COMET_TRAIL - 1)) ** 2; // bright head → dark tail
        colors[k * 3 + 0] = 0.95 * f;
        colors[k * 3 + 1] = 0.82 * f;
        colors[k * 3 + 2] = 0.55 * f;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.visible = false;
      scene.add(line);
      comets.push({
        line, geo, mat,
        a: new THREE.Vector3(), b: new THREE.Vector3(),
        // First comet held back until after the brand-intro's match cut —
        // the opening seconds of the hero stay calm.
        dur: 0, start: 0, nextAt: 6.5 + Math.random() * 6, active: false,
      });
    }
    const launchComet = (c: Comet, t: number) => {
      const fromLeft = Math.random() < 0.5;
      const y0 = -8 + Math.random() * 42;
      const z = -32 + Math.random() * 24;
      c.a.set(fromLeft ? -95 : 95, y0, z);
      c.b.set(fromLeft ? 95 : -95, y0 - (10 + Math.random() * 22), z);
      c.dur = 2.2 + Math.random() * 1.4;
      c.start = t;
      c.active = true;
      c.line.visible = true;
    };
    const cometHead = new THREE.Vector3();
    const cometDir = new THREE.Vector3();

    // ── Sizing ────────────────────────────────────────────────────────────
    const resize = () => {
      const w = hostEl.clientWidth || 1;
      const h = hostEl.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hostEl);

    // ── Pointer parallax (listens on window: canvas has pointer-events none)
    const onPointer = (ev: PointerEvent) => {
      this.pointer.x = (ev.clientX / window.innerWidth - 0.5) * 2;
      this.pointer.y = (ev.clientY / window.innerHeight - 0.5) * 2;
    };

    // Scroll-linked drift: the scene sinks and recedes slightly as the hero
    // scrolls away, adding depth to the page itself.
    let scrollDrift = 0;
    const onScroll = () => {
      scrollDrift = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.2);
    };
    onScroll();

    const onVisibility = () => {
      if (document.hidden) this.running = false;
      else if (this.isHostOnScreen()) this.running = true;
    };

    // ── Render loop ───────────────────────────────────────────────────────
    // Fly-in is timed against the ~5s brand intro: the camera is still
    // visibly settling when the curtain lifts, so the reveal lands inside a
    // moving world rather than on a finished page.
    const INTRO_DUR = 4.6; // seconds of camera fly-in after first render
    const clock = new THREE.Clock();
    let archTiltX = 0;
    const animate = () => {
      if (this.destroyed) return;
      this.rafId = requestAnimationFrame(animate);
      if (!this.running) return;

      const t = clock.getElapsedTime();
      const pos = pGeo.attributes['position'] as import('three').BufferAttribute;

      pMat.uniforms['uTime'].value = t;

      for (let i = 0; i < count; i++) {
        // Slow vertical drift with wraparound, unique speed per particle.
        let y = pos.getY(i) + speeds[i] * 0.012;
        if (y > 46) y = -46;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;

      // Rebuild proximity links, brightness graded by closeness.
      let linkCount = 0;
      for (let i = 0; i < count && linkCount < maxLinks; i++) {
        const xi = pos.getX(i), yi = pos.getY(i), zi = pos.getZ(i);
        for (let j = i + 1; j < count && linkCount < maxLinks; j++) {
          const dx = xi - pos.getX(j);
          const dy = yi - pos.getY(j);
          const dz = zi - pos.getZ(j);
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < maxDist * maxDist) {
            const o = linkCount * 6;
            linePositions[o + 0] = xi;
            linePositions[o + 1] = yi;
            linePositions[o + 2] = zi;
            linePositions[o + 3] = pos.getX(j);
            linePositions[o + 4] = pos.getY(j);
            linePositions[o + 5] = pos.getZ(j);
            const s = 0.08 + 0.4 * (1 - Math.sqrt(d2) / maxDist);
            lineColors[o + 0] = lineColors[o + 3] = 0.79 * s;
            lineColors[o + 1] = lineColors[o + 4] = 0.66 * s;
            lineColors[o + 2] = lineColors[o + 5] = 0.38 * s;
            linkCount++;
          }
        }
      }
      lGeo.setDrawRange(0, linkCount * 2);
      (lGeo.attributes['position'] as import('three').BufferAttribute).needsUpdate = true;
      (lGeo.attributes['color'] as import('three').BufferAttribute).needsUpdate = true;

      points.rotation.y = t * 0.02;
      lines.rotation.y = t * 0.02;

      // Gyroscope centrepiece: rings counter-tumble, the whole group floats
      // and leans gently toward the pointer.
      ico.rotation.x = t * 0.08;
      ico.rotation.y = t * 0.12;
      ringA.rotation.z = t * 0.3;
      ringB.rotation.x = t * 0.22;
      ringB.rotation.y = t * 0.1;
      arch.rotation.y = t * 0.05 + this.pointer.x * 0.12;
      archTiltX += (this.pointer.y * 0.2 - archTiltX) * 0.04;
      arch.rotation.x = archTiltX;
      arch.position.y = 4 + Math.sin(t * 0.5) * 2.5;

      // Comets.
      for (const c of comets) {
        if (!c.active) {
          if (t >= c.nextAt) launchComet(c, t);
          continue;
        }
        const p = (t - c.start) / c.dur;
        if (p >= 1) {
          c.active = false;
          c.line.visible = false;
          c.nextAt = t + 7 + Math.random() * 9;
          continue;
        }
        cometHead.lerpVectors(c.a, c.b, p);
        cometDir.subVectors(c.b, c.a).normalize();
        const cPos = c.geo.attributes['position'] as import('three').BufferAttribute;
        for (let k = 0; k < COMET_TRAIL; k++) {
          cPos.setXYZ(
            k,
            cometHead.x - cometDir.x * k * 1.7,
            cometHead.y - cometDir.y * k * 1.7,
            cometHead.z,
          );
        }
        cPos.needsUpdate = true;
        c.mat.opacity = Math.sin(Math.PI * p) * 0.9;
      }

      // Cinematic fly-in, then pointer parallax + scroll drift take over —
      // with a slow dolly "breathing" so the framing never goes dead.
      const k = Math.min(t / INTRO_DUR, 1);
      const ease = 1 - Math.pow(1 - k, 4);
      camera.position.z =
        175 - 105 * ease + Math.sin(t * 0.45) * 1.3 * ease + scrollDrift * 8;
      camera.position.x += (this.pointer.x * 6 * ease - camera.position.x) * 0.04;
      camera.position.y +=
        ((-this.pointer.y * 4 - scrollDrift * 9) * ease - camera.position.y) * 0.04;
      scene.rotation.z = (1 - ease) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      animate();
    });

    canvas.classList.add('is-ready');

    this.cleanup = () => {
      cancelAnimationFrame(this.rafId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      pGeo.dispose();
      pMat.dispose();
      lGeo.dispose();
      lMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      [ringA, ringB].forEach(r => {
        r.geometry.dispose();
        (r.material as import('three').Material).dispose();
      });
      comets.forEach(c => {
        c.geo.dispose();
        c.mat.dispose();
      });
      renderer.dispose();
    };
  }

  private isHostOnScreen(): boolean {
    const rect = (this.host.nativeElement as HTMLElement).getBoundingClientRect();
    return rect.bottom > -200 && rect.top < window.innerHeight + 200;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.visibilityObserver?.disconnect();
    this.cleanup?.();
  }
}
