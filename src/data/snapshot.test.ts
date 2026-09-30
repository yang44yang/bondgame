import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import raw from './snapshot-2026-09-29.json';
import spreads from './spreads.json';
import { rebuild, spreadTable } from './model.ts';
import { model, scannerQuote, SNAPSHOT } from './snapshot.ts';
import type { Code, Snapshot } from './types.ts';

const SHOTS = new URL('../../IBKR截图/', import.meta.url);
const shot = (p: string) => existsSync(new URL(p, SHOTS));
/** The screenshots are private and not in the public repository; skip the file check without them. */
const HAVE_SHOTS = existsSync(SHOTS);

describe('snapshot-2026-09-29.json', () => {
  it('computed records are current (run `npm run build:data` after changing the engine or assumptions)', () => {
    const rebuilt = rebuild(raw as unknown as Snapshot);
    expect(rebuilt).toEqual(raw);
    expect(spreadTable(rebuilt)).toEqual(spreads.rows);
  });

  it('JSON on disk is exactly what the build script writes', () => {
    const disk = readFileSync(new URL('./snapshot-2026-09-29.json', import.meta.url), 'utf8');
    expect(disk).toBe(JSON.stringify(rebuild(raw as unknown as Snapshot), null, 2) + '\n');
  });

  it('has unique codes and every record carries a known source', () => {
    const codes = SNAPSHOT.instruments.map((i) => i.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const inst of SNAPSHOT.instruments) {
      for (const r of inst.records) expect(['ibkr', 'computed', 'claude-md']).toContain(r.source);
      for (const n of inst.names) expect(['ibkr', 'inferred']).toContain(n.source);
      expect(inst.records.filter((r) => r.source === 'computed')).toHaveLength(1);
    }
  });

  it.skipIf(!HAVE_SHOTS)('every IBKR number points at a screenshot that exists', () => {
    for (const inst of SNAPSHOT.instruments) {
      for (const r of inst.records) if (r.source === 'ibkr') expect(shot(r.screenshot), `${inst.code} ${r.screenshot}`).toBe(true);
      for (const n of inst.names) if (n.source === 'ibkr') expect(shot(n.screenshot!), `${inst.code} ${n.screenshot}`).toBe(true);
    }
    for (const s of SNAPSHOT.orderTicket.screenshots) expect(shot(s)).toBe(true);
    for (const n of SNAPSHOT.noise) expect(shot(n.screenshot)).toBe(true);
  });

  it('rows with no screenshot have no IBKR quote, only a computed one', () => {
    for (const code of ['SP36', 'SI36', 'NSP36', 'TSI36'] as Code[]) {
      const inst = SNAPSHOT.instruments.find((i) => i.code === code)!;
      expect(inst.records.some((r) => r.source === 'ibkr')).toBe(false);
      expect(scannerQuote(code).closing.computed).toBe(true);
    }
  });
});

describe('agrees with the CLAUDE.md 2.1 table', () => {
  // [code, today price, engine YTM %, modified duration, accrued per 100]
  const rows: [Code, number, number, number | null, number][] = [
    ['BILL27', 96.009, 4.46, 0.9, 0],
    ['BOND30', 104.17, 4.98, 3.16, 2.3438],
    ['BOND36', 95.48, 5.112, 7.47, 0.5625],
    ['NOTE36F', 91.77, 5.247, 7.55, 0.5156],
    ['NOTE36A', 95.295, 5.241, 7.73, 0.5781],
    ['SP36', 61.52, 5.25, 9.14, 0],
    ['SP48', 29.097, 5.723, 21.27, 0],
    ['SP43', 38.34, 5.677, null, 0],
  ];
  it.each(rows)('%s', (code, price, y, dur, acc) => {
    const m = model(code);
    expect(Math.abs(m.cleanPrice - price)).toBeLessThan(0.006);
    expect(Math.abs(m.ytm - y)).toBeLessThan(0.006);
    if (dur !== null) expect(Math.abs(m.modDuration - dur)).toBeLessThan(0.006);
    expect(Math.abs(m.accrued - acc)).toBeLessThan(0.00006);
  });

  it('TIPS STRIPS Feb\'36 at a 3.3% real yield prices ≈73.6 (CLAUDE.md), duration 9.22 (CLAUDE.md says 9.1)', () => {
    expect(model('TSI36').cleanPrice).toBeCloseTo(73.58, 1);
    expect(model('TSI36').modDuration).toBeCloseTo(9.22, 2);
  });
});

import { TIPS_INDEX } from './tipsIndex.ts';

describe('TIPS index ratios (TreasuryDirect, settlement 2026-09-30)', () => {
  it('each ratio is the settlement reference CPI over the dated-date reference CPI', () => {
    for (const r of Object.values(TIPS_INDEX)) {
      expect(Math.abs(r.refCpiSettle / r.refCpiDated - r.indexRatio)).toBeLessThan(0.000006);
    }
  });
  it('matches the CUSIPs of the TIPS in the snapshot', () => {
    expect(TIPS_INDEX.TIPS56.cusip).toBe(SNAPSHOT.instruments.find((i) => i.code === 'TIPS56')!.cusip);
  });
});
