import { describe, expect, it } from 'vitest';
import { orderCost, treasuryCommission } from './cost.ts';
import { accrued } from './bond.ts';
import { IBKR_TREASURY_COMMISSION as S } from '../data/assumptions.ts';

describe('IBKR Treasury commission (pricing page, checked 2026-09-30)', () => {
  it('matches the examples on the pricing page', () => {
    expect(treasuryCommission(1_000_000, S)).toBeCloseTo(20, 10);
    expect(treasuryCommission(2_000_000, S)).toBeCloseTo(21, 10);
  });
  it('charges the $5 minimum up to $250,000 face', () => {
    expect(treasuryCommission(1_000, S)).toBe(5);
    expect(treasuryCommission(100_000, S)).toBe(5);
    expect(treasuryCommission(250_000, S)).toBe(5);
    expect(treasuryCommission(300_000, S)).toBeCloseTo(6, 10);
  });
});

describe('order cost', () => {
  it('reproduces order2.png: 1 × SP43 at 38.43 → Amount 384.30, Total 390.80 with the 6.50 midpoint', () => {
    const c = orderCost(38.43, 0, 1_000, 6.5);
    expect(c.amount).toBeCloseTo(384.3, 10);
    expect(c.accrued).toBe(0);
    expect(c.total).toBeCloseTo(390.8, 10);
  });
  it('BOND36 settling 2026-09-30: accrued 0.5625 per 100 = $5.63 per $1,000', () => {
    const c = orderCost(95.48047, accrued(4.5, '2036-02-15'), 1_000, 5);
    expect(c.accrued).toBeCloseTo(5.625, 10);
    expect(c.commissionShare).toBeCloseTo(5 / (954.8047 + 5.625 + 5), 12);
  });
  it('accrued climbs to nearly a full coupon the day before payment and restarts after', () => {
    expect(accrued(4.5, '2036-02-15', '2027-02-14')).toBeCloseTo((2.25 * 183) / 184, 10);
    expect(accrued(4.5, '2036-02-15', '2027-02-16')).toBeCloseTo(2.25 / 181, 10);
  });
});
