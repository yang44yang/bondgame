/** Level 1 demo: every remaining payment of a bond on a time axis (CLAUDE.md §4.1). */
import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { cashflows, yearsLeft } from '../../math/bond.ts';
import { yearsBetween } from '../../math/dates.ts';
import { instrument, nameOf, SETTLE_DATE } from '../../data/snapshot.ts';
import type { Code } from '../../data/types.ts';
import type { CashflowTimelineProps } from '../../content/types.ts';
import { BOND_LABELS, cashflowText as T } from '../../content/demos.ts';
import { tpl, usd } from '../../lib/format.ts';
import { stepper, svgX } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const W = 640;
const H = 340;
const X0 = 60;
const X1 = 596;
const BASE = 284;
const TOP = 78;
const COUPON_H = 84;

export function CashflowTimeline({ props, reveal, locked, layout }: DemoRuntimeProps<CashflowTimelineProps>) {
  const [code, setCode] = useState<Code>(props.bonds[0]);
  const [face, setFace] = useState(props.defaultFace);
  const [sel, setSel] = useState<number | null>(null);
  /** During a bet reveal: how many coupon bars are lit so far. */
  const [lit, setLit] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const inst = instrument(code);
  const flows = useMemo(() => cashflows(inst.coupon, inst.maturity, SETTLE_DATE), [inst]);
  const tMax = useMemo(() => Math.max(...props.bonds.map((c) => yearsLeft(instrument(c).maturity, SETTLE_DATE))), [props.bonds]);
  const maxHalf = useMemo(() => Math.max(...props.bonds.map((c) => instrument(c).coupon / 2)), [props.bonds]);
  const refHalf = instrument(props.bonds[0]).coupon / 2;
  const half = inst.coupon / 2;
  const k = face / 100;
  const couponCount = flows.filter((f) => f.coupon > 0).length;

  const x = (t: number) => X0 + (t / tMax) * (X1 - X0);
  const hC = (amt: number) => (amt / maxHalf) * COUPON_H;

  useEffect(() => {
    if (!reveal || reveal.kind !== 'cashflowSum') return;
    setCode(reveal.bond);
    setFace(reveal.face);
    setSel(null);
    setGuess(reveal.guess);
    setLit(0);
    const b = instrument(reveal.bond);
    const n = cashflows(b.coupon, b.maturity, SETTLE_DATE).filter((f) => f.coupon > 0).length;
    return stepper(n, 130, setLit);
  }, [reveal]);

  const leaveReveal = () => { setLit(null); setGuess(null); };
  const chooseBond = (c: Code) => { setCode(c); setSel(null); leaveReveal(); };
  const chooseFace = (f: number) => { setFace(f); leaveReveal(); };

  const pickAt = (ev: PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const vx = svgX(ev, svgRef.current, W);
    let best = 0;
    flows.forEach((f, i) => { if (Math.abs(x(f.t) - vx) < Math.abs(x(flows[best].t) - vx)) best = i; });
    setSel(best);
  };
  const onKey = (ev: KeyboardEvent<SVGSVGElement>) => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    ev.preventDefault();
    const d = ev.key === 'ArrowRight' ? 1 : -1;
    setSel((s) => Math.max(0, Math.min(flows.length - 1, (s ?? (d > 0 ? -1 : flows.length)) + d)));
  };

  const years: number[] = [];
  for (let yr = Number(SETTLE_DATE.slice(0, 4)) + 1; yr <= Number(inst.maturity.slice(0, 4)); yr++) years.push(yr);

  const revealing = lit !== null;
  const litSum = revealing ? Math.min(lit, couponCount) * half * k : 0;
  const selFlow = sel !== null ? flows[sel] : null;
  const last = flows[flows.length - 1];
  const lastX = x(last.t);
  const couponTop = BASE - hC(last.coupon);

  const stage = (
    <Stage title={T.stageTitle} subtitle={tpl(T.stageSub, { name: nameOf(code).text, face: usd(face) })} locked={locked}>
      <svg
        ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.aria} tabIndex={0} onKeyDown={onKey}
        onPointerDown={(e) => { dragging.current = true; pickAt(e); }}
        onPointerMove={(e) => { if (dragging.current) pickAt(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
      >
        {/* reveal tally or selected-payment callout */}
        {revealing ? (
          <g>
            <text x={X0} y={26} className="t-strong">
              {lit >= couponCount
                ? tpl(T.revealDone, { n: couponCount, each: usd(half * k), sum: usd(couponCount * half * k) })
                : tpl(T.revealRunning, { sum: usd(litSum), i: lit, n: couponCount })}
            </text>
            {guess !== null ? <text x={X0} y={48} className="t-guess">{tpl(T.revealGuess, { guess: usd(guess) })}</text> : null}
          </g>
        ) : selFlow ? (
          (() => {
            const cx = Math.max(X0 + 90, Math.min(X1 - 90, x(selFlow.t)));
            const kind = selFlow.principal > 0 ? (selFlow.coupon > 0 ? T.couponAndPrincipal : T.principalOnly) : T.couponOnly;
            return (
              <g>
                <rect x={cx - 92} y={8} width={184} height={50} rx={8} className="callout-box" />
                <text x={cx} y={28} textAnchor="middle" className="t-num">{selFlow.date}</text>
                <text x={cx} y={48} textAnchor="middle" className="t-strong">{usd(selFlow.amount * k, 2)}</text>
                <title>{kind}</title>
              </g>
            );
          })()
        ) : (
          <text x={X0} y={30} className="t-muted">{T.tapHint}</text>
        )}

        {/* reference line: the main bond's coupon height, when a different coupon is shown */}
        {half > 0 && half !== refHalf ? (
          <g>
            <line x1={X0} x2={X1} y1={BASE - hC(refHalf)} y2={BASE - hC(refHalf)} className="ref-line" />
            <text x={(X0 + X1) / 2} y={BASE - hC(refHalf) - 6} textAnchor="middle" className="t-muted">{T.refLine}</text>
          </g>
        ) : null}

        {/* coupon bars */}
        {flows.map((f, i) => {
          if (f.coupon <= 0) return null;
          const h = hC(f.coupon);
          const dim = revealing && i >= lit;
          const cls = sel === i && !revealing ? 'bar-sel' : 'bar-coupon' + (dim ? ' bar-dim' : '');
          return <rect key={f.date} x={x(f.t) - 6} y={BASE - h} width={12} height={h} rx={2} className={cls} />;
        })}

        {/* principal on top of the last payment, drawn with a break because it is not to scale */}
        <g className={revealing ? 'bar-dim' : undefined}>
          <rect x={lastX - 8} y={TOP} width={16} height={couponTop - TOP} rx={2} className={sel === flows.length - 1 && !revealing ? 'bar-sel' : 'bar-principal'} />
          <line x1={lastX - 12} x2={lastX + 12} y1={(TOP + couponTop) / 2 + 6} y2={(TOP + couponTop) / 2 - 2} className="break-mark" />
          <line x1={lastX - 12} x2={lastX + 12} y1={(TOP + couponTop) / 2 + 14} y2={(TOP + couponTop) / 2 + 6} className="break-mark" />
        </g>
        <text x={lastX - 14} y={TOP + 12} textAnchor="end" className="t-label">{tpl(T.principal, { amt: usd(100 * k) })}</text>
        <text x={lastX - 14} y={TOP + 30} textAnchor="end" className="t-muted">{revealing ? T.principalExcluded : T.notToScale}</text>

        {half > 0 ? (
          <text x={x(flows[0].t) - 6} y={BASE - COUPON_H - 24} className="t-label">{tpl(T.eachCoupon, { amt: usd(half * k, 2) })}</text>
        ) : (
          <text x={(X0 + X1) / 2} y={BASE - 40} textAnchor="middle" className="t-muted">{T.zeroNote}</text>
        )}

        {/* time axis */}
        <line x1={X0 - 10} x2={X1 + 16} y1={BASE} y2={BASE} className="zero-line" />
        {years.map((yr) => {
          const t = yearsBetween(SETTLE_DATE, `${yr}-01-01`);
          if (t <= 0 || t >= tMax) return null;
          return (
            <g key={yr}>
              <line x1={x(t)} x2={x(t)} y1={BASE} y2={BASE + 6} className="grid-line" />
              <text x={x(t)} y={BASE + 22} textAnchor="middle" className="t-num">{yr}</text>
            </g>
          );
        })}
        <circle cx={X0} cy={BASE} r={5} className="dot" />
        <text x={X0} y={BASE + 42} textAnchor="middle" className="t-muted">{T.today}</text>
        <text x={x(tMax)} y={BASE + 42} textAnchor="end" className="t-muted">{T.maturity} {inst.maturity}</text>
      </svg>
    </Stage>
  );

  const controls = (
    <>
      <div className="box">
        <div className="box-title">{T.pickBond}</div>
        <div className="seg">
          {props.bonds.map((c) => (
            <button key={c} type="button" className={'seg-btn' + (c === code ? ' is-on' : '')} aria-pressed={c === code} onClick={() => chooseBond(c)}>
              {c}<span className="sub">{BOND_LABELS[c]?.short}</span>
            </button>
          ))}
        </div>
        <p className="small muted">{BOND_LABELS[code]?.line}</p>
        <div className="box-title">{T.pickFace}</div>
        <div className="seg">
          {props.faces.map((f) => (
            <button key={f} type="button" className={'seg-btn' + (f === face ? ' is-on' : '')} aria-pressed={f === face} onClick={() => chooseFace(f)}>
              {usd(f)}
            </button>
          ))}
        </div>
      </div>
      <div className="box" aria-live="polite">
        <div className="box-title">{T.selected}</div>
        {selFlow ? (
          <>
            <div className="kv"><span className="kv-k">{selFlow.principal > 0 ? (selFlow.coupon > 0 ? T.couponAndPrincipal : T.principalOnly) : T.couponOnly}</span><span className="kv-v">{usd(selFlow.amount * k, 2)}</span></div>
            <div className="kv"><span className="kv-k">{selFlow.date}</span><span className="kv-k">{tpl(T.per100, { amt: selFlow.amount.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') })}</span></div>
          </>
        ) : (
          <p className="muted">{T.tapHint}</p>
        )}
      </div>
      <div className="box">
        <div className="kv"><span className="kv-k">{T.statPayments}</span><span className="kv-v">{flows.length}</span></div>
        <div className="kv"><span className="kv-k">{T.statEach}</span><span className="kv-v">{half > 0 ? usd(half * k, 2) : T.none}</span></div>
        <div className="kv"><span className="kv-k">{T.statPrincipal}</span><span className="kv-v">{usd(100 * k)}</span></div>
      </div>
    </>
  );

  return <>{layout(stage, controls)}</>;
}
