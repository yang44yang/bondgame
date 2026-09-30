/**
 * Content schema. Every visible word lives under src/content; components only render these objects.
 * Levels follow CLAUDE.md §3: { id, season, title, titleEn, lesson, demo: {component, props}, quiz, bet, lights }.
 */
import type { Code } from '../data/types.ts';

/** One cell group of the home-page Bond Scanner that a level lights up (CLAUDE.md §4.0). */
export type LightKey =
  | 'BOND36.product' | 'BOND36.closing' | 'BOND36.yields' | 'buyButton' | 'BOND36.quotes'
  | 'filterRow' | 'NOTE36F.row' | 'duration.dim' | 'duration.lit'
  | 'SP36.row' | 'SI36.row' | 'NSP36.row' | 'TSI36.row';

export type Season = 1 | 2 | 3;
export type Phase = 'lesson' | 'demo' | 'quiz' | 'bet';

export interface LevelMeta {
  id: number;
  season: Season;
  title: string;
  titleEn: string;
  /** Minutes per phase, shown on the phase timeline. */
  minutes: Partial<Record<Phase, number>>;
  lights: LightKey[];
  /** What clearing this level lights, in words, for the level map. */
  lightsLabel: string;
  /** Short outline shown while the level's full content is not built yet. */
  outline: string;
  /** How many questions are drawn and how many must be right to clear. */
  quizRule: { draw: number; need: number };
  /** Levels 12 and 14 open their own views instead of the level page. */
  view?: 'exam' | 'sandbox';
}

export type OptionIndex = 0 | 1 | 2 | 3;

export interface Question {
  q: string;
  opts: [string, string, string, string];
  answer: OptionIndex;
  /** Why the right answer is right: shown after every answer. */
  why: string;
  /** "What's wrong with the one you picked", one entry per wrong option. */
  wrong: Partial<Record<OptionIndex, string>>;
}

export interface CashflowTimelineProps {
  bonds: Code[];
  faces: number[];
  defaultFace: number;
}

export interface SeesawCurveProps {
  bond: Code;
  /** Slider range, decimal yields. */
  yieldMin: number;
  yieldMax: number;
}

export interface MultiBondChartProps {
  bonds: Code[];
  shiftMinBp: number;
  shiftMaxBp: number;
  stepBp: number;
}

export interface PullToParProps {
  /** Bonds to compare; the first is shown first. */
  bonds: Code[];
}

export interface AccruedCostProps {
  bonds: Code[];
  /** Settlement-date slider range (ISO dates). */
  dateFrom: string;
  dateTo: string;
  /** Largest order on the face slider, in thousands (IBKR's THOUSAND FACE VALUE). */
  faceMaxK: number;
  defaultFaceK: number;
}

export interface QuoteSpreadProps {
  bonds: Code[];
  faceMaxK: number;
  defaultFaceK: number;
}

export interface YieldCurveProps {
  /** Points the curve line is drawn through, short to long. */
  knots: Code[];
  /** Also drawn as dots, but not used for the line. */
  extras: Code[];
  /** Hidden until the side bet is revealed. */
  revealExtras: Code[];
  /** An inferred long-end point with no screenshot behind it (drawn hollow and dashed). */
  inferred: { years: number; yield: number };
  /** Sandbox paths previewed by the three buttons. */
  paths: ('P1' | 'P2' | 'P3' | 'P4')[];
}

export interface SideBySideProps {
  bonds: Code[];
  /** Slider range for the common yield (decimals). */
  yieldMin: number;
  yieldMax: number;
}

export interface DurationBalanceProps {
  /** Preset bonds; the first is shown first. */
  presets: Code[];
  couponMax: number;
  yearsMax: number;
}

export interface DemoPropsMap {
  CashflowTimeline: CashflowTimelineProps;
  SeesawCurve: SeesawCurveProps;
  MultiBondChart: MultiBondChartProps;
  PullToPar: PullToParProps;
  AccruedCost: AccruedCostProps;
  QuoteSpread: QuoteSpreadProps;
  YieldCurve: YieldCurveProps;
  SideBySide: SideBySideProps;
  DurationBalance: DurationBalanceProps;
}

export type DemoName = keyof DemoPropsMap;
export type DemoSpec = { [K in DemoName]: { component: K; props: DemoPropsMap[K] } }[DemoName];

/** What the demo canvas does when a side bet is revealed. */
export type RevealAction =
  | { kind: 'cashflowSum'; bond: Code; face: number }
  | { kind: 'setYield'; y: number }
  | { kind: 'setShift'; bp: number; highlight: Code }
  | { kind: 'setDate'; bond: Code; date: string }
  | { kind: 'costTicket'; bond: Code; faceK: number }
  | { kind: 'roundTrip'; bond: Code; faceK: number }
  | { kind: 'curveRead'; years: number }
  | { kind: 'sameYield'; bond: Code; y: number }
  | { kind: 'durationShift'; bond: Code; dyBp: number; faceK: number };

/** Which reveal each demo understands (checked by content.test.ts). */
export const REVEALS_FOR: { [K in DemoName]: RevealAction['kind'][] } = {
  CashflowTimeline: ['cashflowSum'],
  SeesawCurve: ['setYield'],
  MultiBondChart: ['setShift'],
  PullToPar: ['setDate'],
  AccruedCost: ['costTicket'],
  QuoteSpread: ['roundTrip'],
  YieldCurve: ['curveRead'],
  SideBySide: ['sameYield'],
  DurationBalance: ['durationShift'],
};

export interface SideBet {
  /** Markdown. */
  prompt: string;
  /** usd = dollars · usdChange = signed dollars · price = per 100 face · pct = signed % change · share = a plain percentage */
  slider: { min: number; max: number; step: number; initial: number; unit: 'usd' | 'usdChange' | 'price' | 'pct' | 'share' };
  /** Computed with the bond engine when the content module loads. */
  answer: number;
  /** Payout by absolute error, tightest first. */
  tiers: { maxErr: number; reward: number }[];
  /** Markdown shown after the reveal. */
  explain: string;
  reveal: RevealAction;
}

export interface LevelContent extends LevelMeta {
  /** Markdown. */
  lesson: string;
  demo: DemoSpec;
  /** Markdown shown next to the demo controls. */
  demoGuide: string;
  /** Question bank; `quizRule.draw` questions are drawn per attempt. */
  quiz: Question[];
  bet: SideBet | null;
}
