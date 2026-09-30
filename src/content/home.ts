/**
 * The home page's mock IBKR web Bond Scanner (CLAUDE.md §1 "点亮六件套"): six Feb 2036 rows, which
 * cell group each level lights, and the IBKR chrome copied from the web screenshots.
 */
import type { Code } from '../data/types.ts';
import type { LightKey } from './types.ts';

export interface ScannerRowSpec {
  code: Code;
  /** Light key per cell group of the row. */
  product: LightKey;
  closing: LightKey;
  yields: LightKey;
  quotes: LightKey;
  /** Our own annotation under the IBKR sub-line, shown once the product cell is lit. */
  note: string;
}

const row = (code: Code, key: LightKey, note: string): ScannerRowSpec => ({ code, product: key, closing: key, yields: key, quotes: key, note });

/** Row order follows the IBKR app list for Feb 2036 (IBKR截图/app/app-筛选-Feb2036-六件套.png). */
export const SCANNER_ROWS: ScannerRowSpec[] = [
  row('SP36', 'SP36.row', '本金条 Principal STRIPS · 零息 Zero-coupon'),
  row('SI36', 'SI36.row', '利息条 Interest STRIPS · 零息 Zero-coupon'),
  row('TSI36', 'TSI36.row', 'TIPS 利息条 · 收益率是实际收益率 Real Yield'),
  row('NSP36', 'NSP36.row', '从 Note 拆出的本金条 Note Principal STRIPS · 零息'),
  {
    code: 'BOND36', product: 'BOND36.product', closing: 'BOND36.closing', yields: 'BOND36.yields', quotes: 'BOND36.quotes',
    note: '主线债 · 2006 年发的 30 年期 Bond',
  },
  row('NOTE36F', 'NOTE36F.row', '2026 年 2 月发的 10 年期 Note · 同一天到期、票息更低'),
];

/** IBKR web interface labels, as they appear in the Bond Scanner screenshots. */
export const scannerChrome = {
  title: 'Bond Scanner',
  refresh: 'Refresh Results',
  startOver: 'Start Over',
  edit: 'Edit',
  heading: 'US Treasuries',
  dateFrom: '2036/02/01',
  dateTo: '2036/02/28',
  to: 'To',
  typeLabel: 'Treasury Type:',
  typeValue: 'All',
  showing: 'Showing 1 To 6 of 6',
  page: '1',
  issuer: 'United States Treasury',
  columns: {
    product: 'PRODUCT',
    closing: 'CLOSING PRICE',
    closingYield: 'CLOSING YIELD',
    bidYield: 'CURRENT BID YIELD',
    bid: 'CURRENT BID PRICE/SIZE',
    askYield: 'CURRENT ASK YIELD',
    ask: 'CURRENT ASK PRICE/SIZE',
    duration: '久期 DURATION',
  },
  sortMark: '▾',
  dash: '—',
  approx: '≈',
  sizePrefix: 'x $',
  sizeSuffix: 'K',
  buy: 'Buy',
  sell: 'Sell',
  source: 'Source: LSEG',
  notLit: '未点亮 Not lit yet',
};
