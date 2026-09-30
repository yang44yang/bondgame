/** Typed access to the 2026-09-29 teaching data set. */
import raw from './snapshot-2026-09-29.json';
import { yieldAt, type Priceable } from '../math/instrument.ts';
import { quoteRecords } from './model.ts';
import type { Code, Instrument, ModelRecord, NameRecord, QuoteRecord, Snapshot } from './types.ts';

export const SNAPSHOT = raw as unknown as Snapshot;
export const SETTLE_DATE = SNAPSHOT.settle;

const BY_CODE = new Map<Code, Instrument>(SNAPSHOT.instruments.map((i) => [i.code, i]));

export function instrument(code: Code): Instrument {
  const inst = BY_CODE.get(code);
  if (!inst) throw new Error(`Unknown instrument ${code}`);
  return inst;
}

export function quotes(code: Code): QuoteRecord[] {
  return quoteRecords(instrument(code));
}

export function model(code: Code): ModelRecord {
  const m = instrument(code).records.find((r): r is ModelRecord => r.type === 'model');
  if (!m) throw new Error(`${code} has no computed record; run npm run build:data`);
  return m;
}

export function nameOf(code: Code, use: NameRecord['use'] = 'scanner'): NameRecord {
  const names = instrument(code).names;
  return names.find((n) => n.use === use) ?? names.find((n) => n.use === 'header') ?? names[0];
}

export function priceable(code: Code): Priceable {
  const i = instrument(code);
  return { pricing: i.pricing, coupon: i.coupon, maturity: i.maturity };
}

/** "Today's price" used in lessons: the headline IBKR number, or the model price when there is none. */
export function todayPrice(code: Code): number {
  return model(code).cleanPrice;
}

const TODAY_YIELD = new Map<Code, number>();

/** Decimal yield that reproduces todayPrice exactly (the stored model.ytm is rounded for display). */
export function todayYield(code: Code): number {
  let y = TODAY_YIELD.get(code);
  if (y === undefined) {
    y = yieldAt(priceable(code), todayPrice(code), SETTLE_DATE);
    TODAY_YIELD.set(code, y);
  }
  return y;
}

/** One Bond Scanner cell: a number plus whether it came from the screen or from the engine. */
export interface ScannerCell {
  value: number | null;
  computed: boolean;
}

export interface ScannerQuote {
  closing: ScannerCell;
  bidYield: ScannerCell;
  bid: ScannerCell;
  bidSizeK: ScannerCell;
  askYield: ScannerCell;
  ask: ScannerCell;
  askSizeK: ScannerCell;
  duration: ScannerCell;
}

const ibkr = (value: number | null | undefined): ScannerCell => ({ value: value ?? null, computed: false });
const calc = (value: number | null | undefined): ScannerCell => ({ value: value ?? null, computed: true });

/** What the home-page Bond Scanner row shows for an instrument. */
export function scannerQuote(code: Code): ScannerQuote {
  const inst = instrument(code);
  const m = model(code);
  if (!inst.headline) {
    const s = m.synthetic!;
    return {
      closing: calc(m.cleanPrice), bidYield: calc(s.bidYield), bid: calc(s.bid), bidSizeK: calc(null),
      askYield: calc(s.askYield), ask: calc(s.ask), askSizeK: calc(null), duration: calc(m.modDuration),
    };
  }
  const q = quotes(code)[inst.headline.quote];
  return {
    closing: ibkr(q.closing ?? q.last),
    bidYield: ibkr(q.bidYield),
    bid: ibkr(q.bid),
    bidSizeK: ibkr(q.bidSizeK),
    askYield: ibkr(q.askYield),
    ask: typeof q.ask === 'number' ? ibkr(q.ask) : calc(m.askFromYield?.ask),
    askSizeK: ibkr(q.askSizeK),
    duration: calc(m.modDuration),
  };
}

/** What an IBKR detail-page header shows: big price, change, and the Ask / Bid lines with yields and sizes. */
export interface HeaderQuote {
  last: ScannerCell;
  change: number | null;
  changePct: number | null;
  bid: ScannerCell;
  ask: ScannerCell;
  bidYield: ScannerCell;
  askYield: ScannerCell;
  bidSizeK: ScannerCell;
  askSizeK: ScannerCell;
  screenshot: string;
}

export function headerQuote(code: Code): HeaderQuote {
  const inst = instrument(code);
  const m = model(code);
  if (!inst.headline) throw new Error(`${code} has no IBKR quote`);
  const q = quotes(code)[inst.headline.quote];
  return {
    last: ibkr(q.last ?? q.closing),
    change: q.change ?? null,
    changePct: q.changePct ?? null,
    bid: ibkr(q.bid),
    ask: typeof q.ask === 'number' ? ibkr(q.ask) : calc(m.askFromYield?.ask),
    bidYield: ibkr(q.bidYield),
    askYield: ibkr(q.askYield),
    bidSizeK: ibkr(q.bidSizeK),
    askSizeK: ibkr(q.askSizeK),
    screenshot: q.screenshot,
  };
}

/** Mid of the bid and ask yields IBKR shows (percent), from the first quote that has both; null if none. */
export function screenMidYield(code: Code): number | null {
  const q = quotes(code).find((r) => typeof r.bidYield === 'number' && typeof r.askYield === 'number');
  return q ? (q.bidYield! + q.askYield!) / 2 : null;
}
