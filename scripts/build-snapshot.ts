// Regenerates the computed parts of the data set:
//   src/data/snapshot-2026-09-29.json  (records with source "computed")
//   src/data/spreads.json              (bid/ask widths)
//   src/data/curve.json                (curve points for levels 6 and 14)
// Run with:  npm run build:data
import { readFileSync, writeFileSync } from 'node:fs';
import { yearsLeft } from '../src/math/bond.ts';
import { NOMINAL_30Y_YIELD } from '../src/data/assumptions.ts';
import { quoteRecords, rebuild, spreadTable } from '../src/data/model.ts';
import type { Snapshot } from '../src/data/types.ts';

const file = new URL('../src/data/snapshot-2026-09-29.json', import.meta.url);
const snap = rebuild(JSON.parse(readFileSync(file, 'utf8')) as Snapshot);
writeFileSync(file, JSON.stringify(snap, null, 2) + '\n');

const spreads = { source: 'computed', from: 'snapshot-2026-09-29.json', unit: 'price points per 100 face; yieldBp = bid yield − ask yield', rows: spreadTable(snap) };
writeFileSync(new URL('../src/data/spreads.json', import.meta.url), JSON.stringify(spreads, null, 2) + '\n');

// Curve: mid of IBKR's bid and ask yields, one point per instrument that shows both.
const CURVE: Record<'nominal' | 'real', string[]> = {
  nominal: ['BILL27', 'SP28', 'SI28', 'BOND30', 'NOTE36F', 'BOND36', 'NSP36M', 'NOTE36M', 'NOTE36A', 'SP43', 'SI46', 'SP48'],
  real: ['TIPS50', 'TIPS56'],
};
const point = (code: string) => {
  const inst = snap.instruments.find((i) => i.code === code)!;
  const q = quoteRecords(inst).find((r) => typeof r.bidYield === 'number' && typeof r.askYield === 'number')!;
  return {
    code, years: Math.round(yearsLeft(inst.maturity, snap.settle) * 100) / 100,
    yield: Math.round(((q.bidYield! + q.askYield!) / 2) * 10000) / 10000,
    source: 'computed', basis: 'IBKR bid / ask 收益率的中点', screenshot: q.screenshot,
  };
};
const curve = {
  snapshot: snap.snapshot,
  unit: 'percent',
  nominal: [
    ...CURVE.nominal.map(point),
    { code: null, years: 30, yield: NOMINAL_30Y_YIELD * 100, source: 'inferred', basis: 'assumptions.ts NOMINAL_30Y_YIELD（待核实 §5.7）' },
  ],
  real: CURVE.real.map(point),
  note: 'BOND36 比同到期 Note 低约 13bp（CLAUDE.md 五.2），沙盒定价用曲线，不用 95.48。',
};
writeFileSync(new URL('../src/data/curve.json', import.meta.url), JSON.stringify(curve, null, 2) + '\n');
console.log(`snapshot: ${snap.instruments.length} instruments · spreads: ${spreads.rows.length} rows · curve: ${curve.nominal.length} + ${curve.real.length} points`);
