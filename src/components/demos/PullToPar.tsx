/** Level 3 demo: with the yield held constant, price walks to 100 while coupons pile up (CLAUDE.md §4.3). */
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { cashflows, cleanPrice } from '../../math/bond.ts';
import { DAY_MS, daysBetween, isoDate, toUTC, yearsBetween } from '../../math/dates.ts';
import { instrument, nameOf, SETTLE_DATE, todayPrice, todayYield } from '../../data/snapshot.ts';
import type { Code } from '../../data/types.ts';
import type { PullToParProps } from '../../content/types.ts';
import { BOND_LABELS, pullText as T } from '../../content/demos.ts';
import { pct, signed, tpl } from '../../lib/format.ts';
import { svgX, tween } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const W = 640;
const H = 400;
const X0 = 58;
const X1 = 600;
const PT = 30;
const PB = 222;
const BT = 262;
const BB = 350;
const AXIS = 372;
const SETTLE_T = toUTC(SETTLE_DATE);

/** Series colours stay the same for a bond across levels (level 9 uses the same). */
const SERIES: Partial<Record<Code, number>> = { BOND36: 3, BOND30: 2 };

function dateAt(day: number): string {
  return isoDate(SETTLE_T + day * DAY_MS);
}

function priceOn(code: Code, day: number): number {
  const inst = instrument(code);
  const n = daysBetween(SETTLE_DATE, inst.maturity);
  if (day >= n) return 100;
  return cleanPrice(todayYield(code), inst.coupon, inst.maturity, dateAt(day));
}

export function PullToPar({ props, reveal, locked, layout }: DemoRuntimeProps<PullToParProps>) {
  const [code, setCode] = useState<Code>(props.bonds[0]);
  const [day, setDay] = useState(0);
  const [answer, setAnswer] = useState<{ code: Code; day: number; guess: number } | null>(null);
  const dayRef = useRef(day);
  dayRef.current = day;
  const stop = useRef<() => void>(() => {});
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const spanDays = useMemo(() => Math.max(...props.bonds.map((c) => daysBetween(SETTLE_DATE, instrument(c).maturity))), [props.bonds]);
  const nDays = daysBetween(SETTLE_DATE, instrument(code).maturity);

  // Price paths sampled weekly, plus the exact maturity point.
  const paths = useMemo(() => props.bonds.map((c) => {
    const n = daysBetween(SETTLE_DATE, instrument(c).maturity);
    const pts: [number, number][] = [];
    for (let d = 0; d < n; d += 7) pts.push([d, priceOn(c, d)]);
    pts.push([n, 100]);
    return { code: c, pts };
  }), [props.bonds]);
  const [pMin, pMax] = useMemo(() => {
    const all = paths.flatMap((p) => p.pts.map(([, v]) => v));
    return [Math.floor(Math.min(...all, 100) / 2) * 2, Math.ceil(Math.max(...all, 100) / 2) * 2];
  }, [paths]);
  const couponMax = useMemo(() => Math.max(...props.bonds.map((c) => {
    const i = instrument(c);
    return cashflows(i.coupon, i.maturity, SETTLE_DATE).reduce((s, f) => s + f.coupon, 0);
  })), [props.bonds]);

  const x = (d: number) => X0 + (d / spanDays) * (X1 - X0);
  const yP = (p: number) => PT + ((pMax - p) / (pMax - pMin)) * (PB - PT);
  const yC = (c: number) => BB - (c / couponMax) * (BB - BT);

  const inst = instrument(code);
  const flows = cashflows(inst.coupon, inst.maturity, SETTLE_DATE);
  let running = 0;
  const bars = flows.map((f) => {
    running += f.coupon;
    return { d: daysBetween(SETTLE_DATE, f.date), cum: running };
  });
  const received = bars.filter((b) => b.d <= day).reduce((m, b) => Math.max(m, b.cum), 0);
  const P = priceOn(code, day);
  const P0 = todayPrice(code);

  const animateTo = (target: number, ms: number) => {
    stop.current();
    stop.current = tween(dayRef.current, target, ms, (v) => setDay(Math.round(v)));
  };
  useEffect(() => () => stop.current(), []);

  useEffect(() => {
    if (!reveal || reveal.kind !== 'setDate') return;
    setCode(reveal.bond);
    const target = daysBetween(SETTLE_DATE, reveal.date);
    setAnswer({ code: reveal.bond, day: target, guess: reveal.guess });
    stop.current();
    stop.current = tween(dayRef.current, target, 1000, (v) => setDay(Math.round(v)));
  }, [reveal]);

  const choose = (c: Code) => {
    stop.current();
    setCode(c);
    setAnswer(null);
    setDay((d) => Math.min(d, daysBetween(SETTLE_DATE, instrument(c).maturity)));
  };
  const setFromX = (ev: PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    stop.current();
    const d = Math.round(((svgX(ev, svgRef.current, W) - X0) / (X1 - X0)) * spanDays);
    setDay(Math.max(0, Math.min(nDays, d)));
  };

  const years: number[] = [];
  for (let yr = Number(SETTLE_DATE.slice(0, 4)) + 1; yr <= Number(SETTLE_DATE.slice(0, 4)) + Math.ceil(spanDays / 365); yr++) years.push(yr);
  const grid: number[] = [];
  for (let v = pMin; v <= pMax; v += 2) grid.push(v);
  const cx = x(day);

  const stage = (
    <Stage title={T.stageTitle} subtitle={tpl(T.stageSub, { name: nameOf(code).text })} locked={locked}>
      <svg
        ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.aria}
        onPointerDown={(e) => { dragging.current = true; setFromX(e); }}
        onPointerMove={(e) => { if (dragging.current) setFromX(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
      >
        <text x={X0 - 50} y={PT - 12} className="t-axis">{T.axisPrice}</text>
        {grid.map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={yP(v)} y2={yP(v)} className={v === 100 ? 'par-line' : 'grid-line'} />
            <text x={X0 - 8} y={yP(v) + 4} textAnchor="end" className="t-num">{v}</text>
          </g>
        ))}
        <text x={X1} y={yP(100) - 6} textAnchor="end" className="t-muted">{T.par}</text>
        {paths.map((p) => (
          <path
            key={p.code}
            d={'M' + p.pts.map(([d, v]) => `${x(d).toFixed(1)},${yP(v).toFixed(1)}`).join('L')}
            className={`series series-${SERIES[p.code] ?? 1}` + (p.code === code ? ' is-hl' : ' is-faded')}
          />
        ))}
        {paths.map((p) => (
          <text key={p.code} x={x(0) + 6} y={yP(p.pts[0][1]) + (p.pts[0][1] > 100 ? -8 : 16)} className="t-muted">
            {BOND_LABELS[p.code]?.short} · {tpl(T.today, { p: p.pts[0][1].toFixed(2) })}
          </text>
        ))}
        <circle cx={x(nDays)} cy={yP(100)} r={5} className="ring" />

        {answer && answer.code === code ? (
          <g>
            <line x1={X0} x2={X1} y1={yP(answer.guess)} y2={yP(answer.guess)} className="guess-line" />
            <text x={X1} y={yP(answer.guess) + 16} textAnchor="end" className="t-guess">{tpl(T.guess, { p: answer.guess.toFixed(2) })}</text>
            <circle cx={x(answer.day)} cy={yP(priceOn(code, answer.day))} r={11} className="ring-answer" />
            <text x={x(answer.day) - 14} y={yP(priceOn(code, answer.day)) - 14} textAnchor="end" className="t-answer">
              {tpl(T.answer, { p: priceOn(code, answer.day).toFixed(2) })}
            </text>
          </g>
        ) : null}

        <line x1={cx} x2={cx} y1={PT} y2={BB} className="cross" />
        <circle cx={cx} cy={yP(P)} r={7} className="dot" />
        <text x={X1} y={PT - 12} textAnchor="end" className="t-strong">
          {tpl(T.at, { date: dateAt(Math.min(day, nDays)), p: P.toFixed(2) })}
        </text>

        <text x={X0 - 50} y={BT - 10} className="t-axis">{T.axisCoupons}</text>
        {bars.map((b) => (
          <rect key={b.d} x={x(b.d) - 4} y={yC(b.cum)} width={8} height={BB - yC(b.cum)} rx={1.5} className={'bar-coupon' + (b.d <= day ? '' : ' bar-dim')} />
        ))}
        <line x1={X0} x2={X1} y1={BB} y2={BB} className="zero-line" />
        <text x={X1} y={BT - 10} textAnchor="end" className="t-strong">
          {tpl(T.couponsSoFar, { c: received.toFixed(2) })}
        </text>

        {years.map((yr) => {
          const d = daysBetween(SETTLE_DATE, `${yr}-01-01`);
          if (d <= 0 || d >= spanDays) return null;
          return <text key={yr} x={x(d)} y={AXIS} textAnchor="middle" className="t-num">{yr}</text>;
        })}
      </svg>
    </Stage>
  );

  const priceChange = P - P0;
  const controls = (
    <>
      <div className="box">
        <div className="box-title">{T.pickBond}</div>
        <div className="seg">
          {props.bonds.map((c) => (
            <button key={c} type="button" className={'seg-btn' + (c === code ? ' is-on' : '')} aria-pressed={c === code} onClick={() => choose(c)}>
              {c}<span className="sub">{BOND_LABELS[c]?.short}</span>
            </button>
          ))}
        </div>
        <label className="label" htmlFor="ptp-slider">
          {T.slider}<b>{dateAt(Math.min(day, nDays))}</b>
        </label>
        <input
          id="ptp-slider" type="range" min={0} max={nDays} step={1} value={Math.min(day, nDays)}
          onChange={(e) => { stop.current(); setDay(Number(e.target.value)); }}
        />
        <p className="small muted">{tpl(T.yearsFromNow, { n: yearsBetween(SETTLE_DATE, dateAt(Math.min(day, nDays))).toFixed(1) })}</p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => animateTo(nDays, 5000 * ((nDays - Math.min(day, nDays)) / nDays) + 400)}>{T.play}</button>
          <button type="button" className="btn" onClick={() => { stop.current(); setDay(0); }}>{T.back}</button>
        </div>
      </div>
      <div className="box">
        <div className="kv"><span className="kv-k">{T.rowYield}</span><span className="kv-v">{pct(todayYield(code))}</span></div>
        <div className="kv"><span className="kv-k">{T.rowPrice}</span><span className="kv-v">{P.toFixed(2)}</span></div>
        <div className="kv"><span className="kv-k">{T.rowVsToday}</span><span className={'kv-v ' + (priceChange > 0.005 ? 'up' : priceChange < -0.005 ? 'dn' : '')}>{signed(priceChange, 2)}</span></div>
        <div className="kv"><span className="kv-k">{T.rowCoupons}</span><span className="kv-v">{received.toFixed(2)}</span></div>
        <div className="kv"><span className="kv-k">{T.rowTotal}</span><span className="kv-v">{signed(priceChange + received, 2)}</span></div>
        <p className="note">{T.note}</p>
      </div>
    </>
  );

  return <>{layout(stage, controls)}</>;
}
