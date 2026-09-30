/** Level 4 demo: clean vs dirty price over a coupon period, and what an order really costs (CLAUDE.md §4.4). */
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { accrued, cleanPrice, schedule } from '../../math/bond.ts';
import { DAY_MS, daysBetween, isoDate, toUTC } from '../../math/dates.ts';
import { orderCost, treasuryCommission } from '../../math/cost.ts';
import { IBKR_TREASURY_COMMISSION } from '../../data/assumptions.ts';
import { instrument, nameOf, SETTLE_DATE, todayYield } from '../../data/snapshot.ts';
import type { Code } from '../../data/types.ts';
import type { AccruedCostProps } from '../../content/types.ts';
import { accruedText as T, BOND_LABELS } from '../../content/demos.ts';
import { tpl, usd } from '../../lib/format.ts';
import { svgX } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const W = 640;
const H = 250;
const X0 = 58;
const X1 = 560;
const T0 = 22;
const B0 = 212;

const money = (x: number) => x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Round-number grid values inside [lo, hi], about four of them. */
function niceTicks(lo: number, hi: number): number[] {
  const raw = (hi - lo) / 4;
  const step = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5].find((s) => s >= raw) ?? 10;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

export function AccruedCost({ props, reveal, locked, layout }: DemoRuntimeProps<AccruedCostProps>) {
  const from = toUTC(props.dateFrom);
  const span = daysBetween(props.dateFrom, props.dateTo);
  const todayDay = daysBetween(props.dateFrom, SETTLE_DATE);
  const [code, setCode] = useState<Code>(props.bonds[0]);
  const [day, setDay] = useState(todayDay);
  const [faceK, setFaceK] = useState(props.defaultFaceK);
  const [flash, setFlash] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const inst = instrument(code);
  const y0 = todayYield(code);
  const dateOf = (d: number) => isoDate(from + d * DAY_MS);
  const cleanOn = (d: number) => cleanPrice(y0, inst.coupon, inst.maturity, dateOf(d));
  const accOn = (d: number) => accrued(inst.coupon, inst.maturity, dateOf(d));

  const series = useMemo(() => {
    const pts: { d: number; clean: number; dirty: number }[] = [];
    for (let d = 0; d <= span; d++) {
      const date = isoDate(from + d * DAY_MS);
      const c = cleanPrice(y0, inst.coupon, inst.maturity, date);
      pts.push({ d, clean: c, dirty: c + accrued(inst.coupon, inst.maturity, date) });
    }
    return pts;
  }, [code, span, from, y0, inst]);
  const lo = Math.min(...series.map((p) => p.clean));
  const hi = Math.max(...series.map((p) => p.dirty));
  const pad = Math.max(0.2, (hi - lo) * 0.12);
  const yMin = lo - pad;
  const yMax = hi + pad;
  const x = (d: number) => X0 + (d / span) * (X1 - X0);
  const y = (v: number) => T0 + ((yMax - v) / (yMax - yMin)) * (B0 - T0);
  const pathOf = (key: 'clean' | 'dirty') => {
    let s = '';
    series.forEach((p, i) => {
      const prev = series[i - 1];
      // Break the dirty line where it drops on a coupon date so the drop reads as a jump.
      const jump = prev && key === 'dirty' && prev.dirty - p.dirty > 0.5;
      s += `${i === 0 || jump ? 'M' : 'L'}${x(p.d).toFixed(1)},${y(p[key]).toFixed(1)}`;
    });
    return s;
  };

  const coupons = inst.coupon > 0
    ? schedule(inst.maturity, props.dateFrom).dates.map((t) => daysBetween(props.dateFrom, isoDate(t))).filter((d) => d > 0 && d <= span)
    : [];
  const ticks: number[] = [];
  for (let d = 0; d <= span; d++) if (dateOf(d).endsWith('-01')) ticks.push(d);

  useEffect(() => {
    if (!reveal || reveal.kind !== 'costTicket') return;
    setCode(reveal.bond);
    setFaceK(reveal.faceK);
    setDay(todayDay);
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 2600);
    return () => window.clearTimeout(t);
  }, [reveal, todayDay]);

  const setFromX = (ev: PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const d = Math.round(((svgX(ev, svgRef.current, W) - X0) / (X1 - X0)) * span);
    setDay(Math.max(0, Math.min(span, d)));
  };

  const clean = cleanOn(day);
  const acc = accOn(day);
  const face = faceK * 1000;
  const cost = orderCost(clean, acc, face, treasuryCommission(face, IBKR_TREASURY_COMMISSION));
  const sch = inst.coupon > 0 ? schedule(inst.maturity, dateOf(day)) : null;
  const cx = x(day);
  const labelLeft = cx > (X0 + X1) / 2;

  const stage = (
    <Stage title={T.stageTitle} subtitle={tpl(T.stageSub, { name: nameOf(code).text })} locked={locked}>
      <svg
        ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.aria}
        onPointerDown={(e) => { dragging.current = true; setFromX(e); }}
        onPointerMove={(e) => { if (dragging.current) setFromX(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
      >
        {niceTicks(yMin, yMax).map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={y(v)} y2={y(v)} className="grid-line" />
            <text x={X0 - 8} y={y(v) + 4} textAnchor="end" className="t-num">{v.toFixed(2)}</text>
          </g>
        ))}
        {coupons.map((d) => (
          <g key={d}>
            <line x1={x(d)} x2={x(d)} y1={T0} y2={B0} className="ref-line" />
            <text x={x(d) + 4} y={T0 + 10} className="t-muted">{T.couponDay} {dateOf(d)}</text>
          </g>
        ))}
        <path d={pathOf('clean')} className="series series-2" />
        {inst.coupon > 0 ? <path d={pathOf('dirty')} className="series series-1" /> : null}
        {inst.coupon > 0 ? (
          <>
            <text x={X1 + 6} y={y(series[series.length - 1].dirty) + 4} className="t-label t-green">{T.dirty}</text>
            <text x={X1 + 6} y={y(series[series.length - 1].clean) + 16} className="t-label">{T.clean}</text>
          </>
        ) : (
          <text x={X1 + 6} y={y(series[series.length - 1].clean) + 4} className="t-label">{T.zeroShort}</text>
        )}
        <circle cx={x(todayDay)} cy={y(cleanOn(todayDay))} r={6} className="ring" />
        <text x={x(todayDay) + 8} y={B0 - 6} className="t-muted">{T.today}</text>

        <line x1={cx} x2={cx} y1={T0} y2={B0} className="cross" />
        {inst.coupon > 0 ? (
          <>
            <line x1={cx} x2={cx} y1={y(clean + acc)} y2={y(clean)} className="guide" strokeWidth={3} />
            <circle cx={cx} cy={y(clean + acc)} r={6} className="dot" />
            <text x={labelLeft ? cx - 10 : cx + 10} y={(y(clean + acc) + y(clean)) / 2 + 4} textAnchor={labelLeft ? 'end' : 'start'} className="t-strong">
              {tpl(T.accruedTag, { a: acc.toFixed(4) })}
            </text>
          </>
        ) : null}
        <circle cx={cx} cy={y(clean)} r={6} className="dot fill-2" />
        {ticks.map((d) => (
          <text key={d} x={x(d)} y={H - 16} textAnchor="middle" className="t-num">{dateOf(d).slice(2, 7)}</text>
        ))}
      </svg>
      <div className={'ibt' + (flash ? ' is-flash' : '')} aria-live="polite">
        <div className="ibt-title">{T.ticketTitle}</div>
        <div className="ibt-head">{tpl(T.ticketHead, { q: faceK, total: money(cost.total) })}</div>
        <div className="ibt-row"><span>{T.rowQty}</span><b>{faceK}</b></div>
        <div className="ibt-row"><span>{T.rowPrice}</span><b>{clean.toFixed(5)}</b></div>
        <div className="ibt-row"><span>{T.rowAmount}</span><b>{tpl(T.usd, { v: money(cost.amount) })}</b></div>
        <div className="ibt-row"><span>{T.rowCommission}</span><b>{tpl(T.usd, { v: money(cost.commission) })}</b></div>
        <div className="ibt-row"><span>{T.rowAccrued}</span><b>{tpl(T.usd, { v: money(cost.accrued) })}</b></div>
        <div className="ibt-row ibt-total"><span>{T.rowTotal}</span><b>{tpl(T.usd, { v: money(cost.total) })}</b></div>
        <div className="ibt-row ibt-share"><span>{T.rowShare}</span><b>{(cost.commissionShare * 100).toFixed(3)}%</b></div>
        <p className="note">{T.ticketNote}</p>
      </div>
    </Stage>
  );

  const controls = (
    <>
      <div className="box">
        <div className="box-title">{T.pickBond}</div>
        <div className="seg">
          {props.bonds.map((c) => (
            <button key={c} type="button" className={'seg-btn' + (c === code ? ' is-on' : '')} aria-pressed={c === code} onClick={() => setCode(c)}>
              {c}<span className="sub">{BOND_LABELS[c]?.short}</span>
            </button>
          ))}
        </div>
        <label className="label" htmlFor="settle-slider">{T.dateSlider}<b>{dateOf(day)}</b></label>
        <input id="settle-slider" type="range" min={0} max={span} step={1} value={day} onChange={(e) => setDay(Number(e.target.value))} />
        <label className="label" htmlFor="face-slider">{T.faceSlider}<b>{tpl(T.faceValue, { k: faceK, usd: usd(face) })}</b></label>
        <input id="face-slider" type="range" min={1} max={props.faceMaxK} step={1} value={faceK} onChange={(e) => setFaceK(Number(e.target.value))} />
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => setDay(todayDay)}>{T.backToday}</button>
        </div>
      </div>
      <div className="box">
        {sch ? (
          <>
            <div className="kv"><span className="kv-k">{T.lastCoupon}</span><span className="kv-v small">{isoDate(sch.prev)}</span></div>
            <div className="kv"><span className="kv-k">{T.nextCoupon}</span><span className="kv-v small">{isoDate(sch.next)}</span></div>
            <div className="kv"><span className="kv-k">{T.daysAccrued}</span><span className="kv-v">{tpl(T.daysOf, { d: daysBetween(isoDate(sch.prev), dateOf(day)), n: daysBetween(isoDate(sch.prev), isoDate(sch.next)) })}</span></div>
          </>
        ) : (
          <p className="muted">{T.noCoupons}</p>
        )}
        <div className="kv"><span className="kv-k">{T.accruedPer100}</span><span className="kv-v">{acc.toFixed(4)}</span></div>
        <div className="kv"><span className="kv-k">{T.accruedPer1000}</span><span className="kv-v">{usd(acc * 10, 2)}</span></div>
      </div>
    </>
  );

  return <>{layout(stage, controls)}</>;
}
