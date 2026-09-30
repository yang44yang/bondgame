/** Small animation helpers that respect "reduce motion". */

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Tween a number; returns a cancel function. */
export function tween(from: number, to: number, ms: number, onFrame: (v: number) => void, onDone?: () => void): () => void {
  if (prefersReducedMotion() || ms <= 0) {
    onFrame(to);
    onDone?.();
    return () => {};
  }
  let raf = 0;
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / ms);
    onFrame(from + (to - from) * ease(t));
    if (t < 1) raf = requestAnimationFrame(step);
    else onDone?.();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/** Call onStep(1..n) every `ms`; returns a cancel function. */
export function stepper(n: number, ms: number, onStep: (i: number) => void): () => void {
  if (prefersReducedMotion()) {
    onStep(n);
    return () => {};
  }
  let i = 0;
  const id = window.setInterval(() => {
    i += 1;
    onStep(i);
    if (i >= n) window.clearInterval(id);
  }, ms);
  return () => window.clearInterval(id);
}

/** Map a pointer event on an SVG to viewBox x coordinate. */
export function svgX(ev: { clientX: number }, svg: SVGSVGElement, viewWidth: number): number {
  const r = svg.getBoundingClientRect();
  return ((ev.clientX - r.left) / r.width) * viewWidth;
}
