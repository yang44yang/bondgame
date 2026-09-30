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

import { breakevenInflation, growSemiannual, tipsNominalReturn } from './tips.ts';

describe('breakeven inflation', () => {
  it('is where the TIPS return meets the nominal yield', () => {
    const be = breakevenInflation(0.0574, 0.03315);
    expect(tipsNominalReturn(0.03315, be)).toBeCloseTo(0.0574, 12);
    expect(be).toBeCloseTo(0.0574 - 0.03315, 3);
    expect(be).toBeLessThan(0.0574 - 0.03315);
  });
  it('grows money semiannually', () => {
    expect(growSemiannual(100, 0.05, 1)).toBeCloseTo(105.0625, 10);
  });
});
