/**
 * TIPS index ratios for settlement 2026-09-30, looked up on TreasuryDirect on 2026-09-30
 * (resolves CLAUDE.md §5.4, which had estimated 1.01 and 1.25). Index ratio = reference CPI on the
 * settlement date ÷ reference CPI on the dated date. The IBKR screens never show these numbers.
 */
export interface TipsIndexRecord {
  cusip: string;
  datedDate: string;
  refCpiDated: number;
  refCpiSettle: number;
  indexRatio: number;
  asOf: string;
  source: 'treasurydirect';
  url: string;
  /** TreasuryDirect's monthly table the settlement-date row comes from. */
  table: string;
}

export const TIPS_INDEX: Record<'TIPS56' | 'TIPS50', TipsIndexRecord> = {
  TIPS56: {
    cusip: '912810US5',
    datedDate: '2026-02-15',
    refCpiDated: 324.088,
    refCpiSettle: 333.91913,
    indexRatio: 1.03033,
    asOf: '2026-09-30',
    source: 'treasurydirect',
    url: 'https://www.treasurydirect.gov/auctions/announcements-data-results/tips-cpi-data/tips-cpi-detail?cusip=912810US5',
    table: 'CPI_20260812',
  },
  TIPS50: {
    cusip: '912810SM1',
    datedDate: '2020-02-15',
    refCpiDated: 257.09503,
    refCpiSettle: 333.91913,
    indexRatio: 1.29882,
    asOf: '2026-09-30',
    source: 'treasurydirect',
    url: 'https://www.treasurydirect.gov/auctions/announcements-data-results/tips-cpi-data/tips-cpi-detail?cusip=912810SM1',
    table: 'CPI_20260812',
  },
};
