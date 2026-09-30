// Bond math — street convention: semiannual, actual/actual, settle 2026-09-30 (T+1 from 2026-09-29)
const SETTLE = Date.UTC(2026, 8, 30);
function addMonths(t, m) { const d = new Date(t); d.setUTCMonth(d.getUTCMonth() + m); return d.getTime(); }
function schedule(maturity) {
  const dates = []; let d = maturity;
  while (d > SETTLE) { dates.unshift(d); d = addMonths(d, -6); }
  return { prev: d, next: dates[0], n: dates.length };
}
function dirtyPrice(y, c, maturity) {
  const { prev, next, n } = schedule(maturity);
  const w = (next - SETTLE) / (next - prev);
  let pv = 0;
  for (let k = 0; k < n; k++) { const cf = c / 2 + (k === n - 1 ? 100 : 0); pv += cf / Math.pow(1 + y / 2, k + w); }
  return pv;
}
function accrued(c, maturity) { const { prev, next } = schedule(maturity); return c / 2 * (SETTLE - prev) / (next - prev); }
function cleanPrice(y, c, m) { return dirtyPrice(y, c, m) - accrued(c, m); }
function ytm(p, c, m) { let lo = -0.05, hi = 0.6; for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (cleanPrice(mid, c, m) > p) lo = mid; else hi = mid; } return (lo + hi) / 2; }
function modDuration(y, c, m) { const h = 1e-5; return (dirtyPrice(y - h, c, m) - dirtyPrice(y + h, c, m)) / (2 * h) / dirtyPrice(y, c, m); }
function yearsLeft(m) { return (m - SETTLE) / (365.25 * 864e5); }
if (typeof module !== 'undefined') module.exports = { SETTLE, cleanPrice, dirtyPrice, accrued, ytm, modDuration, yearsLeft };
