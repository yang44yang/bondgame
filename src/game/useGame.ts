/** React binding for the saved game state. */
import { useCallback, useEffect, useState } from 'react';
import { EMPTY_STATE, loadState, saveState, type SaveState } from './storage.ts';
import { progressAfterClear } from './progress.ts';
import { placeBet, type Tier } from './wallet.ts';

export interface Game {
  state: SaveState;
  clearLevel: (id: number) => void;
  bet: (id: number, guess: number, answer: number, tiers: Tier[]) => void;
  markSeen: () => void;
  devSetProgress: (n: number) => void;
  reset: () => void;
}

export function useGame(): Game {
  const [state, setState] = useState<SaveState>(() => loadState());
  useEffect(() => saveState(state), [state]);
  const clearLevel = useCallback((id: number) => setState((s) => {
    const progress = progressAfterClear(s.progress, id);
    return progress === s.progress ? s : { ...s, progress };
  }), []);
  const bet = useCallback((id: number, guess: number, answer: number, tiers: Tier[]) => setState((s) => placeBet(s, id, guess, answer, tiers)), []);
  const markSeen = useCallback(() => setState((s) => (s.seen === s.progress ? s : { ...s, seen: s.progress })), []);
  const devSetProgress = useCallback((n: number) => setState((s) => ({ ...s, progress: n, seen: Math.min(s.seen, n) })), []);
  const reset = useCallback(() => setState(EMPTY_STATE), []);
  return { state, clearLevel, bet, markSeen, devSetProgress, reset };
}
