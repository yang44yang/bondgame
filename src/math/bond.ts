/**
 * Coupon bond and STRIPS math, street convention:
 *   semiannual compounding, actual/actual day count inside the coupon period,
 *   settlement T+1 (the 2026-09-29 snapshot settles 2026-09-30),
 *   coupon dates stepped back from maturity in 6-month steps.
 *
 * Units: `c` is the annual coupon per 100 face (4.5 means 4.5%); `y` is a decimal yield (0.05112).
 * Every price is per 100 face. Bills do NOT use this file: see bill.ts.
 */
import { addMonths, isLastDayOfMonth, isoDate, toUTC, yearsBetween, type DateInput } from './dates.ts';

export const SETTLE = '2026-09-30';

export interface Schedule {
  /** Last coupon date on or before settlement (a quasi-coupon date for zeros). */
  prev: number;
  /** First coupon date after settlement. */
  next: number;
  /** Remaining coupon dates, the last one being maturity. */
  n: number;
  dates: number[];
}

export function schedule(maturity: DateInput, settle: DateInput = SETTLE): Schedule {
  const m = toUTC(maturity);
  const s = toUTC(settle);
  if (!(s < m)) throw new RangeError(`settle ${isoDate(s)} must be before maturity ${isoDate(m)}`);
  const eom = isLastDayOfMonth(m);
  const dates: number[] = [];
  let k = 0;
  let d = m;
  while (d > s) {
    dates.unshift(d);
    k += 1;
    d = addMonths(m, -6 * k, eom);
  }
  return { prev: d, next: dates[0], n: dates.length, dates };
}

/** Fraction of the current coupon period still to run: w in (0, 1]. */
function periodFraction(sch: Schedule, settle: DateInput): number {
  return (sch.next - toUTC(settle)) / (sch.next - sch.prev);
}

/** Full ("dirty") price per 100 face: what changes hands before commissions. */
export function dirtyPrice(y: number, c: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  const sch = schedule(maturity, settle);
  const w = periodFraction(sch, settle);
  const v = 1 / (1 + y / 2);
  let pv = 0;
  for (let k = 0; k < sch.n; k++) {
    const cf = c / 2 + (k === sch.n - 1 ? 100 : 0);
    pv += cf * Math.pow(v, k + w);
  }
  return pv;
}

/** Accrued interest per 100 face: the part of the running coupon that belongs to the seller. */
export function accrued(c: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  const sch = schedule(maturity, settle);
  return (c / 2) * (toUTC(settle) - sch.prev) / (sch.next - sch.prev);
}

/** Quoted ("clean") price per 100 face: the number IBKR shows. */
export function cleanPrice(y: number, c: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  return dirtyPrice(y, c, maturity, settle) - accrued(c, maturity, settle);
}

/** Yield to maturity (decimal) from a clean price, by bisection. */
export function ytm(price: number, c: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  let lo = -0.05;
  let hi = 0.6;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (cleanPrice(mid, c, maturity, settle) > price) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Modified duration in years: −(1/P)·dP/dy on the full price, central difference. */
export function modDuration(y: number, c: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  const h = 1e-5;
  const up = dirtyPrice(y + h, c, maturity, settle);
  const dn = dirtyPrice(y - h, c, maturity, settle);
  return (dn - up) / (2 * h) / dirtyPrice(y, c, maturity, settle);
}

export interface WeightedFlow {
  date: string;
  /** Years from settlement in coupon-period units / 2 (the time used for discounting). */
  t: number;
  cf: number;
  pv: number;
}

/**
 * Macaulay duration: the present-value-weighted average time of the cash flows.
 * For the level-8 balance beam the fulcrum sits at `years` = Σ t·PV / Σ PV.
 */
export function macaulayDuration(
  y: number,
  c: number,
  maturity: DateInput,
  settle: DateInput = SETTLE,
): { years: number; flows: WeightedFlow[] } {
  const sch = schedule(maturity, settle);
  const w = periodFraction(sch, settle);
  const v = 1 / (1 + y / 2);
  const flows: WeightedFlow[] = sch.dates.map((d, k) => {
    const cf = c / 2 + (k === sch.n - 1 ? 100 : 0);
    return { date: isoDate(d), t: (k + w) / 2, cf, pv: cf * Math.pow(v, k + w) };
  });
  const total = flows.reduce((s, f) => s + f.pv, 0);
  const years = flows.reduce((s, f) => s + f.t * f.pv, 0) / total;
  return { years, flows };
}

/** Dollar value of one basis point, per 100 face (price points). Multiply by face/100 for dollars. */
export function dv01(y: number, c: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  return (dirtyPrice(y - 0.0001, c, maturity, settle) - dirtyPrice(y + 0.0001, c, maturity, settle)) / 2;
}

export interface CashFlow {
  date: string;
  /** Years from settlement (365.25-day years): for drawing a time axis. */
  t: number;
  coupon: number;
  principal: number;
  amount: number;
}

/** Remaining cash flows per 100 face. Zero-coupon securities return only the final 100. */
export function cashflows(c: number, maturity: DateInput, settle: DateInput = SETTLE): CashFlow[] {
  const sch = schedule(maturity, settle);
  const out: CashFlow[] = [];
  sch.dates.forEach((d, k) => {
    const coupon = c / 2;
    const principal = k === sch.n - 1 ? 100 : 0;
    if (coupon === 0 && principal === 0) return;
    out.push({ date: isoDate(d), t: yearsBetween(settle, d), coupon, principal, amount: coupon + principal });
  });
  return out;
}

/** STRIPS price per 100 face: a zero-coupon bond with semiannual compounding (street convention). */
export function zeroPrice(y: number, maturity: DateInput, settle: DateInput = SETTLE): number {
  return cleanPrice(y, 0, maturity, settle);
}

export function yearsLeft(maturity: DateInput, settle: DateInput = SETTLE): number {
  return yearsBetween(settle, maturity);
}
