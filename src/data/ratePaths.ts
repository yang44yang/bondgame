/**
 * The four 12-month rate paths of the sandbox (CLAUDE.md §4.14). Level 6 previews three of them.
 * CLAUDE.md gives each path as a short-end and a long-end move; how that spreads across maturities is
 * this file's assumption: the short-end move up to 1 year, the long-end move from 20 years, linear between.
 */
export type PathId = 'P1' | 'P2' | 'P3' | 'P4';

export interface RatePath {
  id: PathId;
  shortBp: number;
  longBp: number;
  /** Inflation assumed for TIPS on this path (CLAUDE.md §4.14). */
  inflation: number;
}

export const RATE_PATHS: RatePath[] = [
  { id: 'P1', shortBp: 150, longBp: 150, inflation: 0.035 },
  { id: 'P2', shortBp: -150, longBp: -150, inflation: 0.015 },
  { id: 'P3', shortBp: -50, longBp: 100, inflation: 0.03 },
  { id: 'P4', shortBp: 100, longBp: -50, inflation: 0.02 },
];

export const SHORT_END_YEARS = 1;
export const LONG_END_YEARS = 20;

/** Yield change (basis points) at a maturity of `years` after the full 12 months of a path. */
export function pathShiftBp(path: RatePath, years: number): number {
  const w = Math.min(1, Math.max(0, (years - SHORT_END_YEARS) / (LONG_END_YEARS - SHORT_END_YEARS)));
  return path.shortBp + (path.longBp - path.shortBp) * w;
}

export function ratePath(id: PathId): RatePath {
  return RATE_PATHS.find((p) => p.id === id)!;
}
