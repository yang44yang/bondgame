/** Which home-page Bond Scanner cells are lit, driven by each level's `lights` (CLAUDE.md §4.0). */
import { LEVEL_META } from '../content/levels/meta.ts';
import type { LightKey } from '../content/types.ts';

export type CellState = 'blur' | 'dim' | 'lit';

const OWNER = new Map<LightKey, number>();
for (const m of LEVEL_META) for (const k of m.lights) OWNER.set(k, m.id);

export function ownerOf(key: LightKey): number {
  const id = OWNER.get(key);
  if (id === undefined) throw new Error(`No level lights ${key}`);
  return id;
}

export function isLit(key: LightKey, progress: number): boolean {
  return ownerOf(key) <= progress;
}

export function cellState(key: LightKey, progress: number): CellState {
  return isLit(key, progress) ? 'lit' : 'blur';
}

/** The duration shadow column greys in at level 8 and lights at level 9. */
export function durationState(progress: number): CellState {
  if (isLit('duration.lit', progress)) return 'lit';
  if (isLit('duration.dim', progress)) return 'dim';
  return 'blur';
}

/** Lit since the player last looked at the home page: these glow once. */
export function justLit(key: LightKey, progress: number, seen: number): boolean {
  const id = ownerOf(key);
  return id <= progress && id > seen;
}

/** Level 12, the screen test, opens once every cell is lit (after level 11). */
export function examReady(progress: number): boolean {
  return progress >= 11;
}
