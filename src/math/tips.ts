/**
 * TIPS settlement amounts. IBKR quotes TIPS in real (unadjusted) price per 100;
 * the cash you pay scales by the index ratio (CPI now ÷ CPI at issue).
 */
export interface TipsInvoice {
  /** Face value after inflation adjustment. */
  adjustedFace: number;
  /** Price × index ratio × face: IBKR's "Amount". */
  amount: number;
  accrued: number;
  total: number;
}

export function tipsInvoice(price: number, indexRatio: number, face: number, accruedPer100 = 0): TipsInvoice {
  const adjustedFace = face * indexRatio;
  const amount = (price / 100) * adjustedFace;
  const accrued = (accruedPer100 / 100) * adjustedFace;
  return { adjustedFace, amount, accrued, total: amount + accrued };
}

/**
 * Breakeven inflation between a nominal and a real yield, both bond-equivalent (semiannual):
 * the inflation rate that makes (1 + real/2)(1 + π/2) = 1 + nominal/2. Close to nominal − real.
 */
export function breakevenInflation(nominal: number, real: number): number {
  return 2 * ((1 + nominal / 2) / (1 + real / 2) - 1);
}

/** Annualized (semiannual) nominal return of a TIPS held to maturity if inflation averages `inflation`. */
export function tipsNominalReturn(real: number, inflation: number): number {
  return 2 * ((1 + real / 2) * (1 + inflation / 2) - 1);
}

/** Grow an amount at a semiannually compounded rate for `years`. */
export function growSemiannual(amount: number, rate: number, years: number): number {
  return amount * Math.pow(1 + rate / 2, 2 * years);
}
