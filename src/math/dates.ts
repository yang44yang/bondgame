// Calendar helpers. All dates are UTC midnight timestamps (ms) so day counts are exact.
export type DateInput = string | number | Date;

export const DAY_MS = 86_400_000;

/** Parse 'YYYY-MM-DD', a UTC timestamp, or a Date into a UTC-midnight timestamp. */
export function toUTC(d: DateInput): number {
  if (typeof d === 'number') return d;
  if (d instanceof Date) return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) throw new Error(`Bad date "${d}", expected YYYY-MM-DD`);
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
}

export function isoDate(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

export function daysBetween(a: DateInput, b: DateInput): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
}

function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

export function isLastDayOfMonth(t: number): boolean {
  const d = new Date(t);
  return d.getUTCDate() === daysInMonth(d.getUTCFullYear(), d.getUTCMonth());
}

/**
 * Shift by whole months, anchored on `anchor`'s day of month.
 * Days that do not exist are clamped (Aug 31 − 6m → Feb 28/29).
 * With `endOfMonth`, the result is always the last day of the target month
 * (Treasury rule for securities that mature on a month end).
 */
export function addMonths(anchor: number, months: number, endOfMonth = false): number {
  const d = new Date(anchor);
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + months;
  const y = Math.floor(total / 12);
  const m0 = total - y * 12;
  const dim = daysInMonth(y, m0);
  const day = endOfMonth ? dim : Math.min(d.getUTCDate(), dim);
  return Date.UTC(y, m0, day);
}

/** Year fraction on a 365.25-day year: only for axes and "years left" labels, never for pricing. */
export function yearsBetween(a: DateInput, b: DateInput): number {
  return (toUTC(b) - toUTC(a)) / (365.25 * DAY_MS);
}
