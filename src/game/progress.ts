/** Hard unlock (CLAUDE.md §1, §3): levels 1–12 open one at a time; 13 and 14 are always open. */

export const HARD_UNLOCK_MAX = 12;
export const LEVEL_COUNT = 14;

export type CardStatus = 'done' | 'current' | 'locked' | 'open';

export function isUnlocked(id: number, progress: number): boolean {
  return id > HARD_UNLOCK_MAX || id <= progress + 1;
}

export function isCleared(id: number, progress: number): boolean {
  return id <= HARD_UNLOCK_MAX && id <= progress;
}

/** Progress after clearing level `id`. Only an unlocked level 1–12 can move it, and never backwards. */
export function progressAfterClear(progress: number, id: number): number {
  if (id > HARD_UNLOCK_MAX || !isUnlocked(id, progress)) return progress;
  return Math.max(progress, id);
}

export function cardStatus(id: number, progress: number): CardStatus {
  if (id > HARD_UNLOCK_MAX) return 'open';
  if (id <= progress) return 'done';
  if (id === progress + 1) return 'current';
  return 'locked';
}

/** A quiz attempt clears the level when at least `need` of the drawn questions are right. */
export function quizCleared(correct: boolean[], rule: { draw: number; need: number }): boolean {
  return correct.length === rule.draw && correct.filter(Boolean).length >= rule.need;
}
