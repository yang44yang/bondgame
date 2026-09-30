import { describe, expect, it } from 'vitest';
import { cardStatus, isUnlocked, progressAfterClear, quizCleared } from './progress.ts';
import { placeBet, rewardFor, sandboxCapital } from './wallet.ts';
import { EMPTY_STATE, loadState, saveState, STORAGE_KEY } from './storage.ts';
import { cellState, durationState, examReady, justLit, ownerOf } from './lighting.ts';
import { drawQuiz, isCorrect } from './quiz.ts';
import { LEVELS } from '../content/levels/index.ts';

function memoryStore(init: Record<string, string> = {}) {
  const data = { ...init };
  return { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v; }, data };
}

describe('hard unlock', () => {
  it('opens levels 1–12 one at a time and 13–14 always', () => {
    expect(isUnlocked(1, 0)).toBe(true);
    expect(isUnlocked(2, 0)).toBe(false);
    expect(isUnlocked(3, 2)).toBe(true);
    expect(isUnlocked(13, 0)).toBe(true);
    expect(isUnlocked(14, 0)).toBe(true);
  });
  it('clearing moves progress forward only for an unlocked level', () => {
    expect(progressAfterClear(0, 1)).toBe(1);
    expect(progressAfterClear(1, 1)).toBe(1);
    expect(progressAfterClear(5, 2)).toBe(5);
    expect(progressAfterClear(1, 5)).toBe(1);
    expect(progressAfterClear(11, 13)).toBe(11);
  });
  it('labels level cards', () => {
    expect([1, 2, 3, 13].map((id) => cardStatus(id, 1))).toEqual(['done', 'current', 'locked', 'open']);
  });
  it('needs every drawn question right in levels 1–11', () => {
    expect(quizCleared([true, true, true], { draw: 3, need: 3 })).toBe(true);
    expect(quizCleared([true, false, true], { draw: 3, need: 3 })).toBe(false);
    expect(quizCleared([true, true], { draw: 3, need: 3 })).toBe(false);
  });
});

describe('Intuition Account', () => {
  const tiers = [{ maxErr: 500, reward: 200 }, { maxErr: 200, reward: 500 }];
  it('pays by the tightest tier that fits', () => {
    expect(rewardFor(0, tiers)).toBe(500);
    expect(rewardFor(200, tiers)).toBe(500);
    expect(rewardFor(201, tiers)).toBe(200);
    expect(rewardFor(501, tiers)).toBe(0);
  });
  it('allows one bet per level', () => {
    const s1 = placeBet(EMPTY_STATE, 1, 4300, 4275, tiers, 't');
    expect(s1.wallet).toBe(500);
    expect(s1.bets[1]).toEqual({ guess: 4300, answer: 4275, err: 25, reward: 500, at: 't' });
    const s2 = placeBet(s1, 1, 4275, 4275, tiers);
    expect(s2).toBe(s1);
  });
  it('tops up the sandbox capital', () => {
    expect(sandboxCapital(700)).toBe(100_700);
  });
});

describe('storage', () => {
  it('round-trips', () => {
    const store = memoryStore();
    const state = { ...EMPTY_STATE, progress: 2, wallet: 700, seen: 1 };
    saveState(state, store);
    expect(loadState(store)).toEqual(state);
  });
  it('survives garbage and clamps nonsense', () => {
    expect(loadState(memoryStore({ [STORAGE_KEY]: '{oops' }))).toEqual(EMPTY_STATE);
    const odd = loadState(memoryStore({ [STORAGE_KEY]: JSON.stringify({ progress: 99, wallet: 'x', seen: 50, bets: { 1: { guess: 'no' } } }) }));
    expect(odd).toEqual({ v: 1, progress: 12, wallet: 0, bets: {}, seen: 12 });
  });
  it('works without storage at all', () => {
    expect(loadState(null)).toEqual(EMPTY_STATE);
    expect(() => saveState(EMPTY_STATE, { getItem: () => null, setItem: () => { throw new Error('quota'); } })).not.toThrow();
  });
});

describe('lighting map (CLAUDE.md §4.0)', () => {
  it('assigns each cell group to its level', () => {
    expect(ownerOf('BOND36.product')).toBe(1);
    expect(ownerOf('BOND36.closing')).toBe(2);
    expect(ownerOf('BOND36.yields')).toBe(3);
    expect(ownerOf('buyButton')).toBe(4);
    expect(ownerOf('BOND36.quotes')).toBe(5);
    expect(ownerOf('filterRow')).toBe(6);
    expect(ownerOf('NOTE36F.row')).toBe(7);
    expect(ownerOf('duration.dim')).toBe(8);
    expect(ownerOf('duration.lit')).toBe(9);
    expect(['SP36.row', 'SI36.row', 'NSP36.row'].map((k) => ownerOf(k as 'SP36.row'))).toEqual([10, 10, 10]);
    expect(ownerOf('TSI36.row')).toBe(11);
  });
  it('lights progressively', () => {
    expect(cellState('BOND36.closing', 1)).toBe('blur');
    expect(cellState('BOND36.closing', 2)).toBe('lit');
    expect([7, 8, 9].map(durationState)).toEqual(['blur', 'dim', 'lit']);
    expect(justLit('BOND36.closing', 2, 1)).toBe(true);
    expect(justLit('BOND36.closing', 2, 2)).toBe(false);
    expect(examReady(10)).toBe(false);
    expect(examReady(11)).toBe(true);
  });
});

describe('quiz draw', () => {
  const bank = LEVELS[1]!.quiz;
  let seed = 7;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  it('draws distinct questions and keeps the answer findable after shuffling', () => {
    const d = drawQuiz(bank, 3, [], rng);
    expect(new Set(d.map((x) => x.bank)).size).toBe(3);
    for (const q of d) {
      expect([...q.order].sort()).toEqual([0, 1, 2, 3]);
      const shown = q.order.indexOf(q.question.answer);
      expect(isCorrect(q, shown)).toBe(true);
      expect(isCorrect(q, (shown + 1) % 4)).toBe(false);
    }
  });
  it('prefers new questions on a retry', () => {
    const first = drawQuiz(bank, 3, [], rng).map((x) => x.bank);
    const second = drawQuiz(bank, 3, first, rng).map((x) => x.bank);
    const overlap = second.filter((i) => first.includes(i));
    expect(overlap.length).toBe(1); // bank of 5: two new, one reused
  });
});

import { matchesTreasuryType } from './scannerFilter.ts';
import { pathShiftBp, ratePath } from '../data/ratePaths.ts';

describe('Bond Scanner Treasury Type filter (as observed on the screenshots)', () => {
  it('Note also lists Note STRIPS; Bond also lists Bond STRIPS', () => {
    expect(matchesTreasuryType('Note', 'Note STRIPS Principal')).toBe(true);
    expect(matchesTreasuryType('Bond', 'Bond STRIPS Interest')).toBe(true);
    expect(matchesTreasuryType('Bond', 'Bond STRIPS Principal')).toBe(true);
    expect(matchesTreasuryType('Bond', 'Note')).toBe(false);
    expect(matchesTreasuryType('Bill', 'Note')).toBe(false);
    expect(matchesTreasuryType('All', 'Bond TIPS')).toBe(true);
  });
});

describe('sandbox rate paths (CLAUDE.md §4.14)', () => {
  it('moves the short end below 1 year and the long end above 20 years', () => {
    expect(pathShiftBp(ratePath('P3'), 0.5)).toBe(-50);
    expect(pathShiftBp(ratePath('P3'), 25)).toBe(100);
    expect(pathShiftBp(ratePath('P3'), 10.5)).toBeCloseTo(25, 10);
    expect(pathShiftBp(ratePath('P1'), 7)).toBe(150);
  });
});
