/** Progress and the Intuition Account live only in this browser (CLAUDE.md §1: no accounts, no export). */

export interface BetRecord {
  guess: number;
  answer: number;
  err: number;
  reward: number;
  at: string;
}

export interface SaveState {
  v: 1;
  /** Highest level cleared, 0–12 (CLAUDE.md §3: levels 13 and 14 do not count). */
  progress: number;
  /** Intuition Account balance in virtual USD. */
  wallet: number;
  /** One side bet per level, keyed by level id. */
  bets: Record<string, BetRecord>;
  /** Highest progress already shown on the home page, so newly lit cells can glow once. */
  seen: number;
}

export const STORAGE_KEY = 'bondgame.v1';
export const EMPTY_STATE: SaveState = { v: 1, progress: 0, wallet: 0, bets: {}, seen: 0 };

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function browserStore(): Store | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

function cleanBets(raw: unknown): Record<string, BetRecord> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, BetRecord> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const b = v as Partial<BetRecord> | null;
    if (b && finite(b.guess) && finite(b.answer) && finite(b.err) && finite(b.reward)) {
      out[k] = { guess: b.guess, answer: b.answer, err: b.err, reward: b.reward, at: typeof b.at === 'string' ? b.at : '' };
    }
  }
  return out;
}

/** Reads saved state; anything missing or malformed falls back to a fresh start. */
export function loadState(store: Store | null = browserStore()): SaveState {
  try {
    const text = store?.getItem(STORAGE_KEY);
    if (!text) return EMPTY_STATE;
    const raw = JSON.parse(text) as Partial<SaveState>;
    const progress = finite(raw.progress) ? Math.min(12, Math.max(0, Math.floor(raw.progress))) : 0;
    return {
      v: 1,
      progress,
      wallet: finite(raw.wallet) ? raw.wallet : 0,
      bets: cleanBets(raw.bets),
      seen: finite(raw.seen) ? Math.min(progress, Math.max(0, Math.floor(raw.seen))) : progress,
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveState(state: SaveState, store: Store | null = browserStore()): void {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: the game still works for this session.
  }
}
