/** Number formatting. Text around the numbers lives in src/content. */

/** $4,275 / $1,022.50 / −$200 */
export function usd(x: number, digits = 0): string {
  const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return (x < 0 ? '−$' : '$') + s;
}

/** Decimal yield → "5.11%". */
export const pct = (decimal: number, digits = 2) => (decimal * 100).toFixed(digits) + '%';

/** +7.5 / −19.1 with a real minus sign. */
export function signed(x: number, digits: number, suffix = ''): string {
  const r = Number(x.toFixed(digits));
  const sign = r > 0 ? '+' : r < 0 ? '−' : '';
  return sign + Math.abs(r).toFixed(digits) + suffix;
}

/** Fills {name} placeholders. */
export function tpl(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
