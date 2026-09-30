/**
 * Builds the `source: "computed"` records of the snapshot from its `source: "ibkr"` records.
 * Used by scripts/build-snapshot.ts (writes the JSON) and by snapshot.test.ts (checks the JSON is current).
 */
import { accrued, dirtyPrice, macaulayDuration } from '../math/bond.ts';
import { durationAt, priceAt, yieldAt, type Priceable } from '../math/instrument.ts';
import * as A from './assumptions.ts';
import type { Instrument, ModelRecord, QuoteRecord, Snapshot } from './types.ts';

const round = (x: number, digits: number) => Math.round(x * 10 ** digits) / 10 ** digits;

export function quoteRecords(inst: Instrument): QuoteRecord[] {
  return inst.records.filter((r): r is QuoteRecord => r.type === 'quote');
}

function priceable(inst: Instrument): Priceable {
  return { pricing: inst.pricing, coupon: inst.coupon, maturity: inst.maturity };
}

function measures(inst: Instrument, y: number, settle: string) {
  const p = priceable(inst);
  const clean = priceAt(p, y, settle);
  const acc = inst.pricing === 'coupon' ? accrued(inst.coupon, inst.maturity, settle) : 0;
  const dirty = inst.pricing === 'bill' ? clean : dirtyPrice(y, inst.coupon, inst.maturity, settle);
  return {
    ytm: round(y * 100, 4),
    cleanPrice: round(clean, 5),
    accrued: round(acc, 6),
    dirtyPrice: round(dirty, 5),
    modDuration: round(durationAt(p, y, settle), 4),
    macaulay: inst.pricing === 'bill' ? null : round(macaulayDuration(y, inst.coupon, inst.maturity, settle).years, 4),
  };
}

export function buildModel(inst: Instrument, settle: string): ModelRecord {
  const p = priceable(inst);
  if (inst.headline) {
    const q = quoteRecords(inst)[inst.headline.quote];
    const price = q?.[inst.headline.field];
    if (typeof price !== 'number') throw new Error(`${inst.code}: headline ${inst.headline.field} is missing`);
    const y = yieldAt(p, price, settle);
    const model: ModelRecord = {
      source: 'computed',
      type: 'model',
      method: inst.pricing === 'bill'
        ? 'bill.ts：Treasury 债券等价收益率 BEY（实际/365）'
        : 'bond.ts：半年复利、实际/实际、T+1',
      input: { price, field: inst.headline.field },
      ...measures(inst, y, settle),
    };
    if ((q.ask === null || q.ask === undefined) && typeof q.askYield === 'number') {
      model.askFromYield = { askYield: q.askYield, ask: round(priceAt(p, q.askYield / 100, settle), 4) };
    }
    return model;
  }
  // No screenshot at all (the Feb'36 STRIPS / TIPS STRIPS rows): price off an assumed yield.
  const tips = inst.realYield === true;
  const y = tips ? A.SIX_PACK_TIPS_STRIPS_REAL_YIELD : A.SIX_PACK_STRIPS_YIELD;
  const spread = tips ? A.TIPS_TYPICAL_SPREAD : A.STRIPS_TYPICAL_SPREAD;
  const mid = priceAt(p, y, settle);
  const bid = mid - spread / 2;
  const ask = mid + spread / 2;
  return {
    source: 'computed',
    type: 'model',
    method: tips
      ? 'bond.ts 零息定价，实际收益率取假设值；价格未含 index ratio'
      : 'bond.ts 零息定价，收益率取邻近 Note STRIPS 的屏幕报价',
    input: { yield: round(y * 100, 4), assumption: tips ? 'SIX_PACK_TIPS_STRIPS_REAL_YIELD' : 'SIX_PACK_STRIPS_YIELD' },
    ...measures(inst, y, settle),
    synthetic: {
      assumption: tips ? 'TIPS_TYPICAL_SPREAD' : 'STRIPS_TYPICAL_SPREAD',
      spread,
      bid: round(bid, 4),
      ask: round(ask, 4),
      bidYield: round(yieldAt(p, bid, settle) * 100, 4),
      askYield: round(yieldAt(p, ask, settle) * 100, 4),
    },
  };
}

/** The snapshot with every computed record rebuilt from the IBKR records. */
export function rebuild(snap: Snapshot): Snapshot {
  return {
    ...snap,
    instruments: snap.instruments.map((inst) => ({
      ...inst,
      records: [...inst.records.filter((r) => r.source !== 'computed'), buildModel(inst, snap.settle)],
    })),
  };
}

export interface SpreadRow {
  code: string;
  bid: number;
  ask: number;
  points: number;
  yieldBp: number | null;
  source: 'ibkr' | 'computed';
  screenshot: string;
  note?: string;
}

/** Bid/ask width per instrument, from the first quote that shows both sides (or the rebuilt ask). */
export function spreadTable(snap: Snapshot): SpreadRow[] {
  const rows: SpreadRow[] = [];
  for (const inst of snap.instruments) {
    const qs = quoteRecords(inst);
    const both = qs.find((q) => typeof q.bid === 'number' && typeof q.ask === 'number');
    if (both) {
      rows.push({
        code: inst.code, bid: both.bid!, ask: both.ask!, points: round(both.ask! - both.bid!, 5),
        yieldBp: typeof both.bidYield === 'number' && typeof both.askYield === 'number' ? round((both.bidYield - both.askYield) * 100, 2) : null,
        source: 'ibkr', screenshot: both.screenshot,
      });
      continue;
    }
    const model = inst.records.find((r): r is ModelRecord => r.type === 'model');
    const q = inst.headline ? qs[inst.headline.quote] : undefined;
    if (model?.askFromYield && q && typeof q.bid === 'number') {
      rows.push({
        code: inst.code, bid: q.bid, ask: model.askFromYield.ask, points: round(model.askFromYield.ask - q.bid, 5),
        yieldBp: typeof q.bidYield === 'number' ? round((q.bidYield - model.askFromYield.askYield) * 100, 2) : null,
        source: 'computed', screenshot: q.screenshot,
        note: model.askFromYield.ask - q.bid < 0.01
          ? 'ask 价格被截图截断，用 IBKR 的 ask 收益率反算；差值小于收益率三位小数的舍入误差（约 ±0.004 点），只能说点差 ≤0.01'
          : 'ask 价格被截图截断，用 IBKR 的 ask 收益率反算',
      });
    }
  }
  return rows.sort((a, b) => a.points - b.points);
}
