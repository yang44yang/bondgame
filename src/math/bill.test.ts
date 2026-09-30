import { describe, expect, it } from 'vitest';
import { billDays, billDiscountRate, billPrice, billPriceFromDiscount, billYearBasis, billYield } from './bill.ts';

const M = '2027-09-02';
const pct = (x: number) => x * 100;

describe('Treasury bill US-T Govt Bill Sep02\'27, settle 2026-09-30', () => {
  it('has 337 days to run on a 365-day basis', () => {
    expect(billDays(M)).toBe(337);
    expect(billYearBasis()).toBe(365);
  });

  // Calibration pair: the Bill Scanner page shows price and yield side by side
  // (IBKR截图/ScreenShot_2026-09-29_094456_610.png).
  it('Scanner bid 95.9279 ↔ 4.550% (bond-equivalent yield)', () => {
    expect(Math.abs(pct(billYield(95.9279, M)) - 4.55)).toBeLessThanOrEqual(0.002);
  });
  it('Scanner ask 95.9747 ↔ 4.496% (bond-equivalent yield)', () => {
    expect(Math.abs(pct(billYield(95.9747, M)) - 4.496)).toBeLessThanOrEqual(0.002);
  });

  // CLAUDE.md pairs the detail page's 95.987 / 96.031 with the Scanner's 4.550% / 4.496%.
  // Those came from two screens at different moments (bill info.png shows no yields at all);
  // under the same formula the detail-page prices give these yields instead.
  it('detail-page quotes 95.98666 / 96.031 give 4.483% / 4.431%, not 4.550% / 4.496%', () => {
    expect(pct(billYield(95.98666, M))).toBeCloseTo(4.4825, 3);
    expect(pct(billYield(96.031, M))).toBeCloseTo(4.4314, 3);
  });

  it('discount rate is actual/360: 95.9279 ↔ 4.350%', () => {
    expect(pct(billDiscountRate(95.9279, M))).toBeCloseTo(4.35, 3);
    expect(billPriceFromDiscount(billDiscountRate(95.9279, M), M)).toBeCloseTo(95.9279, 10);
  });

  it('billPrice inverts billYield', () => {
    for (const p of [95.9279, 96.00883, 99.5]) expect(billPrice(billYield(p, M), M)).toBeCloseTo(p, 10);
  });

  it('bills under half a year use simple interest', () => {
    // 91 days, price 98.9 → (1.1 / 98.9) × 365 / 91
    const y = billYield(98.9, '2026-12-30');
    expect(y).toBeCloseTo((1.1 / 98.9) * (365 / 91), 12);
    expect(billPrice(y, '2026-12-30')).toBeCloseTo(98.9, 10);
  });

  it('uses a 366-day year when Feb 29 falls in the year after settlement', () => {
    expect(billYearBasis('2027-06-01')).toBe(366);
    expect(billYearBasis('2028-03-01')).toBe(365);
  });
});
