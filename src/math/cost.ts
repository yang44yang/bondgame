/** What an order costs in cash: price, accrued interest and commission (level 4). Prices are per 100 face. */

export interface CommissionSchedule {
  /** Rate on the first USD 1,000,000 of face. */
  rate: number;
  /** Rate on face above USD 1,000,000. */
  rateAbove1M: number;
  /** Minimum per order, USD. */
  min: number;
}

export function treasuryCommission(face: number, s: CommissionSchedule): number {
  const first = Math.min(face, 1_000_000) * s.rate;
  const rest = Math.max(0, face - 1_000_000) * s.rateAbove1M;
  return Math.max(s.min, first + rest);
}

export interface OrderCost {
  /** Clean price × face / 100: IBKR's "Amount". */
  amount: number;
  accrued: number;
  commission: number;
  /** Amount + accrued + commission: IBKR's "Total". */
  total: number;
  /** Commission as a fraction of the total paid. */
  commissionShare: number;
}

export function orderCost(cleanPer100: number, accruedPer100: number, face: number, commission: number): OrderCost {
  const amount = (cleanPer100 * face) / 100;
  const accrued = (accruedPer100 * face) / 100;
  const total = amount + accrued + commission;
  return { amount, accrued, commission, total, commissionShare: commission / total };
}
