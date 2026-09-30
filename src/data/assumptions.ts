/**
 * Every number CLAUDE.md §5 marks 待核实 (to be verified), plus the modelling assumptions used for
 * rows that have no screenshot. Each one is a named constant so it can be found and fixed in one place.
 * Nothing here is an IBKR screen value.
 */

// §5.3 IBKR Treasury commission, checked 2026-09-30 on https://www.interactivebrokers.com/en/pricing/commissions-bonds.php
// "United States - Treasuries (Bills, Notes, Bonds)": first USD 1,000,000 face 0.002% (0.2 bps), minimum USD 5.00;
// face above USD 1,000,000 0.0001% (0.01 bps). Example on that page: USD 1,000,000 face = USD 20.00.
// TODO(待核实 §5.3): the Order Ticket (order2.png) still shows an estimate range "5.00 … 8.00 USD" for $1,000 face
// and its Total uses the midpoint (384.30 + 6.50 = 390.80); the pricing page does not explain the upper end.
export const IBKR_TREASURY_COMMISSION = { rate: 0.00002, rateAbove1M: 0.000001, min: 5 } as const;
export const IBKR_MIN_COMMISSION_USD = IBKR_TREASURY_COMMISSION.min;
export const IBKR_COMMISSION_RATE_OF_FACE = IBKR_TREASURY_COMMISSION.rate;

// TODO(待核实 §5.4): TIPS index ratios for 2026-09-30 are estimates; look them up on TreasuryDirect.
export const TIPS56_INDEX_RATIO = 1.01;
export const TIPS50_INDEX_RATIO = 1.25;

// TODO(待核实 §5.5): Moody's cut the US from Aaa to Aa1 in May 2025 (believed to be 2025-05-16).
export const MOODYS_DOWNGRADE = { from: 'Aaa', to: 'Aa1', month: '2025-05' } as const;

// TODO(待核实 §5.6): IBKR idle-cash rate for the sandbox, assumed to be the benchmark rate minus 0.5%.
export const IDLE_CASH_RATE = 0.035;

// TODO(待核实 §5.7): no 30-year coupon bond was captured; inferred from the May'46 interest strip.
export const NOMINAL_30Y_YIELD = 0.058;

// TODO(待核实 §5.8): the Feb'36 STRIPS and TIPS STRIPS rows of the home table have no screenshot.
// They are priced off neighbouring screen quotes: Note STRIPS May15'36 bid/ask 5.263%/5.244% and
// Nov15'35 5.260%/5.240% (note scanner.png); TIPS 20–30y real yields ≈3.3% (TIPS scanner).
export const SIX_PACK_STRIPS_YIELD = 0.0525;
export const SIX_PACK_TIPS_STRIPS_REAL_YIELD = 0.033;

// Bid/ask width (price points) used only to draw synthetic quotes for those unscreenshotted rows.
// Observed: SP48 0.124, SP43 0.185, SI46 0.185 (STRIPS); TIPS56 0.429.
export const STRIPS_TYPICAL_SPREAD = 0.15;
export const TIPS_TYPICAL_SPREAD = 0.43;

// §5.2: BOND36 yields ~13bp less than same-maturity Notes (5.11% vs 5.24%). The sandbox must price
// off the curve, not off 95.48, or it creates a fake arbitrage.
export const SANDBOX_10Y_CURVE_YIELD = 0.0524;
