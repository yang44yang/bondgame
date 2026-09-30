import { describe, expect, it } from 'vitest';
import { monotoneCubic } from './curve.ts';

describe('monotoneCubic', () => {
  const xs = [0.92, 3.62, 9.87, 17.13, 21.87, 30];
  const ys = [4.523, 5.032, 5.2405, 5.6775, 5.724, 5.8];
  const f = monotoneCubic(xs, ys);
  it('passes through every point', () => {
    xs.forEach((x, i) => expect(f(x)).toBeCloseTo(ys[i], 12));
  });
  it('never overshoots on increasing data', () => {
    let prev = -Infinity;
    for (let x = 0.92; x <= 30; x += 0.05) {
      const y = f(x);
      expect(y).toBeGreaterThanOrEqual(prev - 1e-12);
      expect(y).toBeLessThanOrEqual(5.8 + 1e-12);
      prev = y;
    }
  });
  it('reads about 4.75% at two years on the 2026-09-29 curve', () => {
    expect(f(2)).toBeCloseTo(4.747, 2);
  });
  it('rejects bad input', () => {
    expect(() => monotoneCubic([1], [1])).toThrow();
    expect(() => monotoneCubic([1, 1], [1, 2])).toThrow();
  });
});
