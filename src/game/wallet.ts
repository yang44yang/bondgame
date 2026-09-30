/** The Intuition Account (CLAUDE.md §1): side-bet winnings that later top up the sandbox's capital. */
import type { SaveState } from './storage.ts';

export const SANDBOX_BASE_CAPITAL = 100_000;

export interface Tier {
  maxErr: number;
  reward: number;
}

export function rewardFor(err: number, tiers: Tier[]): number {
  const sorted = [...tiers].sort((a, b) => a.maxErr - b.maxErr);
  for (const t of sorted) if (err <= t.maxErr + 1e-9) return t.reward;
  return 0;
}

/** Records the one allowed bet for a level and pays out. A second bet on the same level is ignored. */
export function placeBet(state: SaveState, levelId: number, guess: number, answer: number, tiers: Tier[], at = new Date().toISOString()): SaveState {
  if (state.bets[levelId]) return state;
  const err = Math.abs(guess - answer);
  const reward = rewardFor(err, tiers);
  return {
    ...state,
    wallet: state.wallet + reward,
    bets: { ...state.bets, [levelId]: { guess, answer, err, reward, at } },
  };
}

export function sandboxCapital(wallet: number): number {
  return SANDBOX_BASE_CAPITAL + wallet;
}
