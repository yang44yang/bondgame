import type { ComponentType } from 'react';
import type { DemoName, DemoPropsMap, DemoSpec } from '../../content/types.ts';
import { AccruedCost } from './AccruedCost.tsx';
import { CashflowTimeline } from './CashflowTimeline.tsx';
import { DurationBalance } from './DurationBalance.tsx';
import { MultiBondChart } from './MultiBondChart.tsx';
import { PullToPar } from './PullToPar.tsx';
import { QuoteSpread } from './QuoteSpread.tsx';
import { SeesawCurve } from './SeesawCurve.tsx';
import { SideBySide } from './SideBySide.tsx';
import { YieldCurve } from './YieldCurve.tsx';
import type { DemoRuntimeProps } from './types.ts';

/** Demo components by the name a level's content uses (CLAUDE.md §3: demo = {component, props}). */
const REGISTRY: { [K in DemoName]: ComponentType<DemoRuntimeProps<DemoPropsMap[K]>> } = {
  CashflowTimeline,
  SeesawCurve,
  MultiBondChart,
  PullToPar,
  AccruedCost,
  QuoteSpread,
  YieldCurve,
  SideBySide,
  DurationBalance,
};

export function DemoHost({ spec, ...rest }: { spec: DemoSpec } & Omit<DemoRuntimeProps<unknown>, 'props'>) {
  const Demo = REGISTRY[spec.component] as ComponentType<DemoRuntimeProps<DemoSpec['props']>>;
  return <Demo props={spec.props} {...rest} />;
}
