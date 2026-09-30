/** Numbers that lesson text quotes, computed once from the engine so text and demos never disagree. */
import { priceAt } from '../math/instrument.ts';
import { yearsLeft } from '../math/bond.ts';
import { priceable, SETTLE_DATE, todayPrice, todayYield, instrument } from '../data/snapshot.ts';
import type { Code } from '../data/types.ts';

/** Percent price change of `code` if its yield moves by `dy` (decimal), from today's price. */
export function pctChange(code: Code, dy: number): number {
  return (priceAt(priceable(code), todayYield(code) + dy, SETTLE_DATE) / todayPrice(code) - 1) * 100;
}

export function priceAfter(code: Code, dy: number): number {
  return priceAt(priceable(code), todayYield(code) + dy, SETTLE_DATE);
}

export function years(code: Code): number {
  return yearsLeft(instrument(code).maturity, SETTLE_DATE);
}

export const f1 = (x: number) => x.toFixed(1);
export const f2 = (x: number) => x.toFixed(2);
/** Signed with a real minus sign: +7.9 / −19.2 */
export const s1 = (x: number) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(1);
