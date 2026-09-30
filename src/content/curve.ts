/** The nominal yield curve of 2026-09-29, drawn through real IBKR points; levels 6 and 11 read the same one. */
import { monotoneCubic } from '../math/curve.ts';
import { yearsLeft } from '../math/bond.ts';
import { NOMINAL_30Y_YIELD } from '../data/assumptions.ts';
import { instrument, screenMidYield, SETTLE_DATE } from '../data/snapshot.ts';
import type { Code } from '../data/types.ts';

/** Points the curve goes through: IBKR bid / ask yield midpoints, short to long. */
export const CURVE_KNOTS: Code[] = ['BILL27', 'BOND30', 'NOTE36A', 'SP43', 'SP48'];
/** Inferred 30-year point (no 30-year coupon bond was captured; CLAUDE.md §5.7). */
export const CURVE_30Y = { years: 30, yield: NOMINAL_30Y_YIELD * 100 };

export const yearsTo = (c: Code) => yearsLeft(instrument(c).maturity, SETTLE_DATE);

/** Percent yield on the drawn curve at `years`. */
export const nominalCurve = monotoneCubic(
  [...CURVE_KNOTS.map(yearsTo), CURVE_30Y.years],
  [...CURVE_KNOTS.map((c) => screenMidYield(c)!), CURVE_30Y.yield],
);
