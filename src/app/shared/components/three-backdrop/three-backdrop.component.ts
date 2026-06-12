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
 * Lazy 3D "constellation blueprint" backdrop.
 *
 * - Three.js is fetched via dynamic import() ONLY when the host element
 *   first intersects the viewport, so it never lands in the initial bundle
 *   and never loads on pages that don't use it.
 * - Renders gold particles + connecting lines that slowly rotate and react
 *   to pointer movement (depth parallax).
 * - Pauses rendering when scrolled offscreen or the tab is hidden.
 * - Renders nothing (static CSS gradient only) for reduced-motion users,
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

      &__canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 1200ms ease;

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
  `],
})
export class ThreeBackdropComponent implements AfterViewInit, OnDestroy {
  /** Particle count (desktop). Mobile automatically uses ~60%. */
  @Input() density = 110;

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
      return; // static gradient only
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
      return; // network failure: stay on static gradient
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
      return; // no WebGL: stay on static gradient
    }

    const isMobile = window.innerWidth < 768;
    const count = Math.round(this.density * (isMobile ? 0.6 : 1));
    const maxDist = 26;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1b1f3b, 60, 160);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
    camera.position.z = 70;

    // ── Particles ─────────────────────────────────────────────────────────
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      speeds[i] = 0.4 + Math.random() * 0.8;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xc9a961,
      size: 1.6,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // ── Connecting lines (rebuilt each frame from nearby pairs) ───────────
    const maxLinks = count * 4;
    const linePositions = new Float32Array(maxLinks * 6);
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lMat = new THREE.LineBasicMaterial({
      color: 0xc9a961,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lGeo, lMat);
    scene.add(lines);

    // ── Floating wireframe icosahedron (the "architecture" centrepiece) ───
    const icoGeo = new THREE.IcosahedronGeometry(16, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0xc9a961,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    ico.position.set(isMobile ? 0 : 28, 4, -10);
    scene.add(ico);

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

    const onVisibility = () => {
      if (document.hidden) this.running = false;
      else if (this.isHostOnScreen()) this.running = true;
    };

    // ── Render loop ───────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    const animate = () => {
      if (this.destroyed) return;
      this.rafId = requestAnimationFrame(animate);
      if (!this.running) return;

      const t = clock.getElapsedTime();
      const pos = pGeo.attributes['position'] as import('three').BufferAttribute;

      for (let i = 0; i < count; i++) {
        // Slow vertical drift with wraparound, unique speed per particle.
        let y = pos.getY(i) + speeds[i] * 0.012;
        if (y > 46) y = -46;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;

      // Rebuild proximity links.
      let linkCount = 0;
      for (let i = 0; i < count && linkCount < maxLinks; i++) {
        const xi = pos.getX(i), yi = pos.getY(i), zi = pos.getZ(i);
        for (let j = i + 1; j < count && linkCount < maxLinks; j++) {
          const dx = xi - pos.getX(j);
          const dy = yi - pos.getY(j);
          const dz = zi - pos.getZ(j);
          if (dx * dx + dy * dy + dz * dz < maxDist * maxDist) {
            const o = linkCount * 6;
            linePositions[o + 0] = xi;
            linePositions[o + 1] = yi;
            linePositions[o + 2] = zi;
            linePositions[o + 3] = pos.getX(j);
            linePositions[o + 4] = pos.getY(j);
            linePositions[o + 5] = pos.getZ(j);
            linkCount++;
          }
        }
      }
      lGeo.setDrawRange(0, linkCount * 2);
      (lGeo.attributes['position'] as import('three').BufferAttribute).needsUpdate = true;

      points.rotation.y = t * 0.02;
      lines.rotation.y = t * 0.02;
      ico.rotation.x = t * 0.08;
      ico.rotation.y = t * 0.12;
      ico.position.y = 4 + Math.sin(t * 0.5) * 2.5;

      // Ease camera toward pointer for depth parallax.
      camera.position.x += (this.pointer.x * 6 - camera.position.x) * 0.04;
      camera.position.y += (-this.pointer.y * 4 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      animate();
    });

    canvas.classList.add('is-ready');

    this.cleanup = () => {
      cancelAnimationFrame(this.rafId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      pGeo.dispose();
      pMat.dispose();
      lGeo.dispose();
      lMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
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
