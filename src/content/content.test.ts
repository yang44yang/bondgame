import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEVEL_META, LEVELS } from './levels/index.ts';
import { REVEALS_FOR, type LightKey } from './types.ts';
import { cleanPrice } from '../math/bond.ts';

const built = Object.values(LEVELS).filter((l) => l !== undefined);

describe('level content', () => {
  it('builds levels 1–9 so far', () => {
    expect(Object.keys(LEVELS).map(Number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it.each(built.map((l) => [l.id, l] as const))('level %i: the side-bet reveal is one its demo understands', (_id, level) => {
    expect(REVEALS_FOR[level.demo.component]).toContain(level.bet!.reveal.kind);
  });

  it.each(built.map((l) => [l.id, l] as const))('level %i: quiz bank is complete', (_id, level) => {
    expect(level.quiz.length).toBeGreaterThanOrEqual(level.quizRule.draw);
    for (const q of level.quiz) {
      expect(q.opts).toHaveLength(4);
      expect(new Set(q.opts).size).toBe(4);
      expect([0, 1, 2, 3]).toContain(q.answer);
      expect(q.why.length).toBeGreaterThan(10);
      // "你选的这个错在哪": every wrong option explains itself.
      for (const i of [0, 1, 2, 3] as const) {
        if (i === q.answer) expect(q.wrong[i]).toBeUndefined();
        else expect(q.wrong[i]?.length ?? 0, `${q.q} option ${i}`).toBeGreaterThan(5);
      }
    }
  });

  it.each(built.map((l) => [l.id, l] as const))('level %i: every term in the text is bilingual markup-safe', (_id, level) => {
    for (const text of [level.lesson, level.demoGuide]) {
      const terms = text.match(/\[\[[^\]]*\]\]/g) ?? [];
      for (const t of terms) expect(t, t).toMatch(/^\[\[[^|\]]+\|[^|\]]+\]\]$/);
      expect((text.match(/`/g) ?? []).length % 2, 'unbalanced backticks').toBe(0);
      expect((text.match(/\*\*/g) ?? []).length % 2, 'unbalanced bold').toBe(0);
    }
  });

  it('side-bet answers come from the engine and match CLAUDE.md', () => {
    expect(LEVELS[1]!.bet!.answer).toBe(4275);
    expect(Math.abs(LEVELS[2]!.bet!.answer - 102.99)).toBeLessThan(0.02);
    expect(LEVELS[9]!.bet!.answer).toBeCloseTo(53.3, 1);
    // §4.3: price on 2031-02-15 if the yield never moves.
    expect(LEVELS[3]!.bet!.answer).toBeCloseTo(cleanPrice(0.051121, 4.5, '2036-02-15', '2031-02-15'), 2);
    expect(LEVELS[3]!.bet!.answer).toBeCloseTo(97.33, 2);
    // §4.4: $5 on a $5,000-face BOND36 order: 5 / (50 × (95.48047 + 0.5625) + 5).
    expect(LEVELS[4]!.bet!.answer).toBeCloseTo((5 / (50 * (95.48047 + 0.5625) + 5)) * 100, 6);
    // §4.5: (95.54688 − 95.41406) × 1,000.
    expect(LEVELS[5]!.bet!.answer).toBeCloseTo(132.82, 6);
    // §4.6: read at 2 years off the curve drawn through the real points (CLAUDE.md estimated ≈4.7%).
    expect(LEVELS[6]!.bet!.answer).toBeCloseTo(4.747, 2);
    // §4.7: NOTE36F priced at BOND36's yield (CLAUDE.md: 92.72).
    expect(LEVELS[7]!.bet!.answer).toBeCloseTo(92.72, 2);
    // §4.8: yields −0.75% on $50,000 face of BOND36 (duration estimate +$2,691; convexity adds the rest).
    expect(LEVELS[8]!.bet!.answer).toBeCloseTo(2783.43, 1);
    for (const l of built) {
      const b = l.bet!;
      expect(b.answer).toBeGreaterThanOrEqual(b.slider.min);
      expect(b.answer).toBeLessThanOrEqual(b.slider.max);
      expect(b.tiers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('CLAUDE.md 4.1 / 4.2 payout tiers', () => {
    expect(LEVELS[1]!.bet!.tiers).toEqual([{ maxErr: 200, reward: 500 }, { maxErr: 500, reward: 200 }]);
    expect(LEVELS[2]!.bet!.tiers).toEqual([{ maxErr: 1, reward: 500 }, { maxErr: 3, reward: 200 }]);
  });
});

describe('lighting map covers CLAUDE.md §4.0 exactly once', () => {
  it('each light key belongs to one level', () => {
    const keys = LEVEL_META.flatMap((m) => m.lights);
    const all: LightKey[] = ['BOND36.product', 'BOND36.closing', 'BOND36.yields', 'buyButton', 'BOND36.quotes', 'filterRow',
      'NOTE36F.row', 'duration.dim', 'duration.lit', 'SP36.row', 'SI36.row', 'NSP36.row', 'TSI36.row'];
    expect([...keys].sort()).toEqual([...all].sort());
  });
  it('has 14 levels, 1–12 hard-unlocked and 12/14 opening their own views', () => {
    expect(LEVEL_META.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(LEVEL_META.find((m) => m.id === 12)!.view).toBe('exam');
    expect(LEVEL_META.find((m) => m.id === 14)!.view).toBe('sandbox');
  });
});

describe('content stays out of components (CLAUDE.md §3)', () => {
  const CJK = /[　-〿㐀-鿿＀-￯]/;
  const root = new URL('..', import.meta.url).pathname;
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx?|css)$/.test(name) && !name.endsWith('.test.ts')) files.push(p);
    }
  };
  for (const d of ['components', 'views', 'game', 'lib']) walk(join(root, d));
  files.push(join(root, 'App.tsx'));

  it.each(files.map((f) => [f.slice(root.length)]))('%s has no Chinese text', (rel) => {
    const src = readFileSync(join(root, rel), 'utf8');
    const offending = src.split('\n').filter((line) => CJK.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*'));
    expect(offending).toEqual([]);
  });
});
