/**
 * Treasury bill conventions (bills are quoted differently from coupon bonds):
 *   - discount rate: d = (100 − P)/100 × 360/days  (actual/360)
 *   - bond-equivalent yield (BEY), Treasury's formula:
 *       days ≤ half a year: BEY = (100 − P)/P × B/days
 *       longer:             BEY solves  100/P = (1 + BEY/2)·(1 + BEY·(days/B − ½))
 *     where B is 365, or 366 when a Feb 29 falls in the year after settlement.
 * IBKR's Bond Scanner shows BEY: 95.9279 / 95.9747 ↔ 4.550% / 4.496% for the Sep02'27 bill.
 * Units match bond.ts: decimal yields, prices per 100 face.
 */
import { DAY_MS, daysBetween, toUTC, type DateInput } from './dates.ts';
import { SETTLE } from './bond.ts';

export function billDays(maturity: DateInput, settle: DateInput = SETTLE): number {
  const days = daysBetween(settle, maturity);
  if (days <= 0) throw new RangeError('settle must be before maturity');
  return days;
}

/** 366 if a Feb 29 falls within the year that follows settlement, else 365. */
export function billYearBasis(settle: DateInput = SETTLE): 365 | 366 {
  const s = toUTC(settle);
  const end = s + 365 * DAY_MS;
  for (let y = new Date(s).getUTCFullYear(); y <= new Date(end).getUTCFullYear(); y++) {
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (!leap) continue;
    const feb29 = Date.UTC(y, 1, 29);
    if (feb29 > s && feb29 <= end) return 366;
  }
  return 365;
}

export function billDiscountRate(price: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  return ((100 - price) / 100) * (360 / billDays(maturity, settle));
}

export function billPriceFromDiscount(d: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  return 100 * (1 - (d * billDays(maturity, settle)) / 360);
}

/** Bond-equivalent yield (decimal) from price per 100. */
export function billYield(price: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  const t = billDays(maturity, settle);
  const B = billYearBasis(settle);
  if (t <= B / 2) return ((100 - price) / price) * (B / t);
  const a = t / B;
  const inner = a * a - (2 * a - 1) * (1 - 100 / price);
  return (-2 * a + 2 * Math.sqrt(inner)) / (2 * a - 1);
}

/** Price per 100 from a bond-equivalent yield (inverse of billYield). */
export function billPrice(bey: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  const t = billDays(maturity, settle);
  const B = billYearBasis(settle);
  if (t <= B / 2) return 100 / (1 + (bey * t) / B);
  return 100 / ((1 + bey / 2) * (1 + bey * (t / B - 0.5)));
}

/** Modified duration of a bill under BEY: −(1/P)·dP/dy, numerically. */
export function billModDuration(bey: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  const h = 1e-5;
  return (billPrice(bey - h, maturity, settle) - billPrice(bey + h, maturity, settle)) / (2 * h) / billPrice(bey, maturity, settle);
}
