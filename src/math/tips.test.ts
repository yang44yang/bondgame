import { describe, expect, it } from 'vitest';
import { tipsInvoice } from './tips.ts';

describe('tipsInvoice', () => {
  it('scales price and accrued by the index ratio', () => {
    const inv = tipsInvoice(82.80859, 1.01, 1000, 0.5);
    expect(inv.adjustedFace).toBeCloseTo(1010, 10);
    expect(inv.amount).toBeCloseTo(836.37, 2);
    expect(inv.accrued).toBeCloseTo(5.05, 10);
    expect(inv.total).toBeCloseTo(inv.amount + inv.accrued, 10);
  });
  it('index ratio 1 is a plain bond', () => {
    expect(tipsInvoice(50.25, 1, 10000).amount).toBeCloseTo(5025, 10);
  });
});
