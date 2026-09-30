/** Shapes of src/data/snapshot-2026-09-29.json. Yields in the JSON are in percent (5.121 = 5.121%). */

export type Code =
  | 'BILL27' | 'BOND30' | 'BOND36' | 'NOTE36F' | 'NOTE36A' | 'NOTE36M'
  | 'SP36' | 'SI36' | 'NSP36' | 'TSI36' | 'NSP36M' | 'SP48' | 'SP43' | 'SI46'
  | 'SI28' | 'SP28' | 'SP28A' | 'SP29' | 'TIPS56' | 'TIPS50';

/**
 * ibkr      = shown on an IBKR screen (the screenshot is named)
 * computed  = produced by src/math from other numbers (scripts/build-snapshot.ts writes these)
 * inferred  = not on any screenshot, inferred from IBKR's naming pattern (CLAUDE.md §5.8)
 * claude-md = a fact stated in CLAUDE.md that no screenshot shows
 */
export type Source = 'ibkr' | 'computed' | 'inferred' | 'claude-md';

export type TreasuryType =
  | 'Bill' | 'Note' | 'Bond' | 'Bond STRIPS Principal' | 'Bond STRIPS Interest'
  | 'Note STRIPS Principal' | 'Bond TIPS' | 'TIPS STRIPS Interest';

export interface NameRecord {
  use: 'scanner' | 'chart' | 'app' | 'header';
  text: string;
  source: Source;
  screenshot?: string;
  note?: string;
}

export type QuoteField = 'last' | 'closing' | 'bid' | 'ask';

export interface QuoteRecord {
  source: 'ibkr';
  type: 'quote';
  screenshot: string;
  screen: string;
  last?: number | null;
  closing?: number | null;
  change?: number;
  changePct?: number;
  bid?: number | null;
  ask?: number | null;
  bidYield?: number | null;
  askYield?: number | null;
  bidSizeK?: number | null;
  askSizeK?: number | null;
  /** Fields cut off at the screenshot edge, with the characters that are still visible. */
  truncated?: Partial<Record<'ask' | 'askSizeK' | 'closing', string>>;
  note?: string;
}

export interface FieldsRecord {
  source: 'ibkr';
  type: 'fields';
  screenshot: string;
  screen: string;
  /** Raw text exactly as the screen shows it. */
  fields: Record<string, string>;
}

export interface FactRecord {
  source: 'claude-md';
  type: 'fact';
  text: string;
}

export interface SyntheticQuote {
  /** Name of the constant in src/data/assumptions.ts that sets the width. */
  assumption: string;
  spread: number;
  bid: number;
  ask: number;
  bidYield: number;
  askYield: number;
}

export interface ModelRecord {
  source: 'computed';
  type: 'model';
  method: string;
  input: { price?: number; field?: QuoteField; yield?: number; assumption?: string };
  /** Percent. Real yield for the TIPS family. */
  ytm: number;
  cleanPrice: number;
  accrued: number;
  dirtyPrice: number;
  modDuration: number;
  macaulay: number | null;
  /** Ask price rebuilt from the IBKR ask yield when the price itself is cut off in the screenshot. */
  askFromYield?: { askYield: number; ask: number };
  /** Bid/ask drawn around the model price for rows without any screenshot. */
  synthetic?: SyntheticQuote;
}

export type InstrumentRecord = QuoteRecord | FieldsRecord | FactRecord | ModelRecord;

export interface Instrument {
  code: Code;
  role: string;
  treasuryType: TreasuryType;
  pricing: 'bill' | 'coupon' | 'zero';
  realYield?: boolean;
  cusip: string | null;
  coupon: number;
  maturity: string;
  /** Which quote record (index among `type: 'quote'` records) and field is "today's price" in lessons. */
  headline: { quote: number; field: QuoteField } | null;
  names: NameRecord[];
  records: InstrumentRecord[];
}

export interface Snapshot {
  snapshot: string;
  settle: string;
  screenshotDir: string;
  sourceKinds: Record<Source, string>;
  instruments: Instrument[];
  orderTicket: {
    source: 'ibkr';
    screenshots: string[];
    code: Code;
    fields: Record<string, string>;
    preview: Record<string, string>;
    capPriceNotice: string;
  };
  noise: { what: string; screenshot: string; shows: string; source: 'ibkr' }[];
}
