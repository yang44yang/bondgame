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
