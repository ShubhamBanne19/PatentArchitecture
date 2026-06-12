// ─── MOTION UTILITIES ────────────────────────────────────────────────────────
// Shared helpers for the motion layer. Every animation in the app must pass
// through these guards so reduced-motion users and non-browser contexts are
// always handled the same way.

/** True when the user has requested reduced motion at the OS level. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** True for coarse-pointer (touch) devices where hover effects don't apply. */
export function isTouchDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches
  );
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
