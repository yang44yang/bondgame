/**
 * What IBKR's Bond Scanner "Treasury Type" filter returns. Observed on the 2026-09-29 screenshots:
 * choosing Note also lists Note STRIPS (note scanner.png), choosing Bond also lists Bond STRIPS
 * (ScreenShot_2026-09-29_094539_128.png, ScreenShot_2026-09-29_095125_954.png).
 * The full dropdown was not captured (CLAUDE.md §5.8); these are the options seen.
 */
import type { TreasuryType } from '../data/types.ts';

export const TREASURY_TYPE_OPTIONS = [
  'All', 'Bill', 'Note', 'Bond', 'Bond STRIPS Principal', 'Bond STRIPS Interest', 'Note STRIPS Principal', 'Bond TIPS',
] as const;
export type TreasuryTypeOption = (typeof TREASURY_TYPE_OPTIONS)[number];

const INCLUDES: Record<TreasuryTypeOption, TreasuryType[] | 'all'> = {
  All: 'all',
  Bill: ['Bill'],
  Note: ['Note', 'Note STRIPS Principal'],
  Bond: ['Bond', 'Bond STRIPS Principal', 'Bond STRIPS Interest'],
  'Bond STRIPS Principal': ['Bond STRIPS Principal'],
  'Bond STRIPS Interest': ['Bond STRIPS Interest'],
  'Note STRIPS Principal': ['Note STRIPS Principal'],
  'Bond TIPS': ['Bond TIPS'],
};

export function matchesTreasuryType(option: TreasuryTypeOption, type: TreasuryType): boolean {
  const inc = INCLUDES[option];
  return inc === 'all' || inc.includes(type);
}
