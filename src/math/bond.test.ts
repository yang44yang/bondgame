import { describe, expect, it } from 'vitest';
import {
  accrued, cashflows, cleanPrice, dirtyPrice, dv01, macaulayDuration, modDuration, schedule, ytm, zeroPrice,
} from './bond.ts';
import { addMonths, isoDate, toUTC } from './dates.ts';

// Tolerances in CLAUDE.md are written in percent (±0.002 means ±0.002 percentage points).
const pct = (x: number) => x * 100;
const B36 = '2036-02-15';

describe('CLAUDE.md 2.2 test cases (settle 2026-09-30)', () => {
  it('ytm(95.41406, 4.5, 2036-02-15) = 5.121% ±0.002', () => {
    expect(Math.abs(pct(ytm(95.41406, 4.5, B36)) - 5.121)).toBeLessThanOrEqual(0.002);
  });
  it('ytm(95.54688, 4.5, 2036-02-15) = 5.103% ±0.002', () => {
    expect(Math.abs(pct(ytm(95.54688, 4.5, B36)) - 5.103)).toBeLessThanOrEqual(0.002);
  });
  it('accrued(4.5, 2036-02-15) = 0.5625', () => {
    expect(accrued(4.5, B36)).toBeCloseTo(0.5625, 10);
  });
  it('ytm(91.77, 4.125, 2036-02-15) = 5.247% (IBKR shows 5.238, allowed ±0.01)', () => {
    const y = pct(ytm(91.77, 4.125, B36));
    expect(Math.abs(y - 5.247)).toBeLessThanOrEqual(0.001);
    expect(Math.abs(y - 5.238)).toBeLessThanOrEqual(0.01);
  });
  it('ytm(29.10, 0, 2048-08-15) = 5.72% ±0.01', () => {
    expect(Math.abs(pct(ytm(29.1, 0, '2048-08-15')) - 5.72)).toBeLessThanOrEqual(0.01);
  });
  it('ytm(38.3405, 0, 2043-11-15) = 5.68% ±0.01', () => {
    expect(Math.abs(pct(ytm(38.3405, 0, '2043-11-15')) - 5.68)).toBeLessThanOrEqual(0.01);
  });
  it('modDuration(5.112%, 4.5, 2036-02-15) = 7.47 ±0.02', () => {
    expect(Math.abs(modDuration(0.05112, 4.5, B36) - 7.47)).toBeLessThanOrEqual(0.02);
  });
  it('cleanPrice(4.112%, 4.5, 2036-02-15) = 102.99 ±0.02', () => {
    expect(Math.abs(cleanPrice(0.04112, 4.5, B36) - 102.99)).toBeLessThanOrEqual(0.02);
  });
  it('cashflows(4.5, 2036-02-15) has 19 entries, 2027-02-15 … 2036-02-15', () => {
    const cf = cashflows(4.5, B36);
    expect(cf).toHaveLength(19);
    expect(cf[0].date).toBe('2027-02-15');
    expect(cf[18].date).toBe('2036-02-15');
    expect(cf[0].amount).toBe(2.25);
    expect(cf[18].amount).toBe(102.25);
  });
  it('accrued(6.25, 2030-05-15) = 2.3438', () => {
    expect(Math.abs(accrued(6.25, '2030-05-15') - 2.3438)).toBeLessThanOrEqual(0.00005);
  });
});

describe('the engine reproduces the yields IBKR shows next to each price', () => {
  // [label, price, coupon, maturity, IBKR yield %, screenshot]
  const cases: [string, number, number, string, number, string][] = [
    ['BOND36 bid', 95.41406, 4.5, B36, 5.121, 'app/app-BOND36-详情-上半屏.png'],
    ['BOND36 ask', 95.54688, 4.5, B36, 5.103, 'app/app-BOND36-详情-上半屏.png'],
    ['NOTE36F bid (not the 91.77 close)', 91.84, 4.125, B36, 5.238, 'note scanner.png'],
    ['NOTE36A bid', 95.29, 4.625, '2036-08-15', 5.241, 'ScreenShot_2026-09-29_094643_710.png'],
    ['NOTE36A ask', 95.3, 4.625, '2036-08-15', 5.24, 'ScreenShot_2026-09-29_094643_710.png'],
    ['BOND30 bid', 103.5156, 6.25, '2030-05-15', 5.172, 'ScreenShot_2026-09-29_095125_954.png'],
    ['SP48 bid', 29.035, 0, '2048-08-15', 5.734, 'ScreenShot_2026-09-29_094820_891.png'],
    ['SP48 ask', 29.159, 0, '2048-08-15', 5.714, 'ScreenShot_2026-09-29_094820_891.png'],
    ['SP43 bid', 38.248, 0, '2043-11-15', 5.692, 'order.png'],
    ['SP43 ask', 38.433, 0, '2043-11-15', 5.663, 'order.png'],
    ['SI46 bid', 32.289, 0, '2046-05-15', 5.844, 'ScreenShot_2026-09-29_094557_961.png'],
    ['SI46 ask', 32.474, 0, '2046-05-15', 5.814, 'ScreenShot_2026-09-29_094557_961.png'],
    ['SI28 bid', 90.031, 0, '2028-11-15', 5.003, 'ScreenShot_2026-09-29_095125_954.png'],
    ['SP28 bid', 90.109, 0, '2028-11-15', 4.962, 'ScreenShot_2026-09-29_095125_954.png'],
    ['TIPS56 bid (real yield)', 82.594, 2.375, '2056-02-15', 3.305, 'ScreenShot_2026-09-29_095341_660.png'],
    ['TIPS56 ask (real yield)', 83.023, 2.375, '2056-02-15', 3.28, 'ScreenShot_2026-09-29_095341_660.png'],
    ['TIPS50 bid (real yield)', 50.1875, 0.25, '2050-02-15', 3.335, 'ScreenShot_2026-09-29_095316_819.png'],
  ];
  it.each(cases)('%s: %f → %f%%', (_label, price, c, m, shown) => {
    // IBKR rounds to 3 decimals; allow a quarter of a basis point for its own rounding.
    expect(Math.abs(pct(ytm(price, c, m)) - shown)).toBeLessThanOrEqual(0.0025);
  });
});

describe('schedule and conventions', () => {
  it('BOND36 sits between the 2026-08-15 and 2027-02-15 coupons with 19 left', () => {
    const s = schedule(B36);
    expect(isoDate(s.prev)).toBe('2026-08-15');
    expect(isoDate(s.next)).toBe('2027-02-15');
    expect(s.n).toBe(19);
  });
  it('month-end maturities keep month-end coupon dates', () => {
    const m = toUTC('2027-08-31');
    expect(isoDate(addMonths(m, -6, true))).toBe('2027-02-28');
    expect(isoDate(addMonths(toUTC('2028-02-29'), -6, true))).toBe('2027-08-31');
    const s = schedule('2027-08-31', '2026-09-30');
    expect(s.dates.map(isoDate)).toEqual(['2027-02-28', '2027-08-31']);
  });
  it('non-month-end days are clamped, not rolled into the next month', () => {
    expect(isoDate(addMonths(toUTC('2026-08-30'), -6))).toBe('2026-02-28');
  });
  it('accrued resets to 0 on a coupon date and full price = clean + accrued', () => {
    expect(accrued(4.5, B36, '2027-02-15')).toBe(0);
    const y = 0.05;
    expect(dirtyPrice(y, 4.5, B36) - cleanPrice(y, 4.5, B36)).toBeCloseTo(accrued(4.5, B36), 12);
  });
  it('price equals 100 when yield equals coupon on a coupon date', () => {
    expect(cleanPrice(0.045, 4.5, B36, '2027-02-15')).toBeCloseTo(100, 10);
  });
  it('ytm inverts cleanPrice', () => {
    for (const y of [0.01, 0.045, 0.05112, 0.09]) expect(ytm(cleanPrice(y, 4.5, B36), 4.5, B36)).toBeCloseTo(y, 10);
  });
  it('rejects settlement on or after maturity', () => {
    expect(() => schedule('2026-09-30')).toThrow(RangeError);
  });
});

describe('duration family', () => {
  const y = ytm(95.48047, 4.5, B36);
  it('modified = Macaulay / (1 + y/2)', () => {
    expect(modDuration(y, 4.5, B36)).toBeCloseTo(macaulayDuration(y, 4.5, B36).years / (1 + y / 2), 5);
  });
  it('Macaulay of a zero equals its time to maturity in coupon-period years', () => {
    const { years, flows } = macaulayDuration(0.0525, 0, B36);
    expect(flows).toHaveLength(19);
    expect(years).toBeCloseTo(flows[18].t, 10);
  });
  it('dv01 ≈ full price × modified duration / 10,000', () => {
    const approx = (dirtyPrice(y, 4.5, B36) * modDuration(y, 4.5, B36)) / 10000;
    expect(dv01(y, 4.5, B36)).toBeCloseTo(approx, 6);
  });
  it('STRIPS Feb15\'36 at 5.25% prices near 61.5 with modified duration 9.14', () => {
    expect(zeroPrice(0.0525, B36)).toBeCloseTo(61.5, 1);
    expect(modDuration(0.0525, 0, B36)).toBeCloseTo(9.14, 2);
  });
  it('a zero pays only its principal', () => {
    expect(cashflows(0, B36)).toEqual([expect.objectContaining({ date: '2036-02-15', coupon: 0, principal: 100 })]);
  });
});
