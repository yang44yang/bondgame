import type { ReactNode } from 'react';
import type { RevealAction } from '../../content/types.ts';

/** A side-bet reveal handed to the demo; `nonce` makes every placement or replay a new event. */
export type Reveal = RevealAction & { guess: number; nonce: number };

/** The level page decides where the canvas and the controls go. */
export type Layout = (stage: ReactNode, controls: ReactNode) => ReactNode;

export interface DemoRuntimeProps<P> {
  props: P;
  reveal: Reveal | null;
  /** True while a side bet is open: the canvas is blurred so it can't be used to peek. */
  locked: boolean;
  layout: Layout;
}
