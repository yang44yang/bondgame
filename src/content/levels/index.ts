import type { LevelContent } from '../types.ts';
import { L01 } from './L01.ts';
import { L02 } from './L02.ts';
import { L03 } from './L03.ts';
import { L04 } from './L04.ts';
import { L05 } from './L05.ts';
import { L06 } from './L06.ts';
import { L07 } from './L07.ts';
import { L08 } from './L08.ts';
import { L09 } from './L09.ts';
import { L10 } from './L10.ts';
import { L11 } from './L11.ts';

export { LEVEL_META, levelMeta } from './meta.ts';

/** Levels with full content in this milestone. The others show their outline. */
export const LEVELS: Partial<Record<number, LevelContent>> = { 1: L01, 2: L02, 3: L03, 4: L04, 5: L05, 6: L06, 7: L07, 8: L08, 9: L09, 10: L10, 11: L11 };
